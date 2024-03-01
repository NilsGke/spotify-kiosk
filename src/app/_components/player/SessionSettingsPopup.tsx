"use client";

import { useEffect, useState } from "react";
import { LuSettings2 } from "react-icons/lu";
import useOutsideClick from "~/hooks/useOutsideClick";
import SessionSettings from "../SessionSettings";
import { api } from "~/trpc/react";
import type { SpotifySession } from "@prisma/client";

import { CgSpinner } from "react-icons/cg";
import { FaCheck, FaTimes } from "react-icons/fa";
import useKeyboard from "~/hooks/useKeyboard";
import { sendSignal } from "~/helpers/signals";
import HoverInfo from "../HoverInfo";

export default function SessionSettingsPopup({
  spotifySession: initialSpotifySession,
}: {
  spotifySession: SpotifySession;
}) {
  const [popupOpen, setPopupOpen] = useState(false);
  const containerRef = useOutsideClick(() => setPopupOpen(false));
  useKeyboard((key) => key === "Escape" && setPopupOpen(false));

  const { data: availableMarkets } = api.spotify.getAvailableMarkets.useQuery(
    undefined,
    { refetchOnWindowFocus: false },
  );

  // need available markets for market picker
  const {
    data: sessionData,
    mutate,
    status,
    error,
  } = api.session.editSession.useMutation({
    onMutate: (variables) => {
      setOptimisticSpotifySession((prev) => ({
        ...prev,
        ...variables.newSession,
      }));
      return optimisticSpotifySession;
    },
    onSuccess: (returnedData) => setOptimisticSpotifySession(returnedData),
  });

  // session mutation
  const mutateSession = (
    newSession: Parameters<typeof mutate>["0"]["newSession"],
  ) =>
    mutate(
      { code: optimisticSpotifySession.code, newSession },
      {
        onSuccess: (newSession) => sendSignal("updateSession", { newSession }),
      },
    );

  // update session on mutation callback
  useEffect(
    () =>
      void (
        sessionData !== undefined && setOptimisticSpotifySession(sessionData)
      ),
    [sessionData],
  );

  const [optimisticSpotifySession, setOptimisticSpotifySession] = useState(
    initialSpotifySession,
  );

  const errorMessage =
    error !== null &&
    (error.data?.zodError
      ? error.data.zodError?.fieldErrors[0]
      : error.message);

  return (
    <>
      <button
        className="rounded-md border border-zinc-500 p-2"
        onClick={() => setPopupOpen(true)}
      >
        <LuSettings2 />
      </button>
      {popupOpen && (
        <div className="fixed left-0 top-0 z-20 flex h-full w-full items-center justify-center backdrop-blur-sm backdrop-brightness-50">
          <div
            ref={containerRef}
            className="relative flex flex-col gap-3 rounded-3xl bg-zinc-900 p-2 md:p-4 lg:p-8 xl:p-10"
          >
            <h2>
              Session Settings{" "}
              {status === "error" ? (
                <span className="inline-block text-red-50">
                  <FaTimes />
                  <HoverInfo>{errorMessage}</HoverInfo>
                </span>
              ) : status === "loading" ? (
                <span
                  className="inline-block text-zinc-500"
                  title="applying changes"
                >
                  <CgSpinner className="animate-spin" />
                </span>
              ) : status === "success" ? (
                <span
                  className="inline-block text-green-400"
                  title="changes applied"
                >
                  <FaCheck />
                </span>
              ) : null}
            </h2>
            <SessionSettings
              name={optimisticSpotifySession.name}
              password={optimisticSpotifySession.password}
              permissions={{ ...optimisticSpotifySession }}
              market={optimisticSpotifySession.market}
              availableMarkets={
                availableMarkets ?? [optimisticSpotifySession.market]
              }
              onNameChange={(name) => mutateSession({ name })}
              onPasswordChange={(password) => mutateSession({ password })}
              onPermissionChange={(permissions) => mutateSession(permissions)}
              onMarketChange={(market) => mutateSession({ market })}
            />
          </div>
        </div>
      )}
    </>
  );
}

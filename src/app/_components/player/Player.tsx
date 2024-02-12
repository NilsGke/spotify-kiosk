"use client";

import { api } from "~/trpc/react";
import PlayControls from "./PlayControls";
import Search from "./Search";
import CurrentSong from "./CurrentSong";
import Queue from "./Queue";
import SessionControls from "./SessionControls";
import ReauthPopup from "./ReauthPopup";
import { useEffect } from "react";
import { itemIsTrack } from "~/helpers/itemTypeguards";
import toast from "react-simple-toasts";

const reauthErrorMessage =
  "Bad or expired token. This can happen if the user revoked a token or the access token has expired. You should re-authenticate the user.";

export default function Player({
  admin = false,
  code,
  password,
}: {
  admin?: boolean;
  code: string;
  password: string;
}) {
  const sessionQuery = api.session.get.useQuery(
    { code, password },
    { refetchInterval: 60000, refetchOnWindowFocus: false, retryDelay: 30000 },
  );

  const { data: playbackState, refetch: refetchPlayback } =
    api.spotify.getPlayback.useQuery(
      {
        code,
        password,
      },
      {
        retry: false,
        onError(error) {
          if (error.message.includes(reauthErrorMessage))
            toast("🚩 host needs to reauth. Tell them to open the session");
        },
      },
    );

  const { data: queueData, refetch: refetchQueue } =
    api.spotify.getQueue.useQuery(
      {
        code,
        password,
      },
      {
        retry: false,
        onError(error) {
          if (error.message.includes(reauthErrorMessage))
            toast("🚩 host needs to reauth. Tell them to open the session");
        },
      },
    );

  useEffect(() => {
    if (!playbackState?.item) return;

    if (!itemIsTrack(playbackState.item)) return;
    const songEnd = () => {
      console.log("song finished");
      void refetchPlayback();
      void refetchQueue();
    };

    const songEndTimer = setTimeout(
      songEnd,
      playbackState.item.duration_ms - playbackState.progress_ms,
    );

    return () => clearTimeout(songEndTimer);
  }, [playbackState, refetchPlayback, refetchQueue]);

  return (
    <>
      <div className="grid-rows-[calc(100%-80px-0.5rem),80px] gap-2 p-2 lg:grid lg:grid-cols-[300px,1fr,300px] xl:grid-cols-[400px,1fr,400px]">
        <Queue
          code={code}
          password={password}
          queueData={queueData}
          permissionSkipQueue={!!sessionQuery.data?.permission_skipQueue}
          refreshQueue={() => {
            setTimeout(() => {
              void refetchQueue();
              void refetchPlayback();
            }, 500); // sadly need to wait for spotify api to update
          }}
        />

        <Search session={sessionQuery.data} />

        <div className="row-span-2">
          <CurrentSong playbackState={playbackState} />
        </div>

        <SessionControls />

        <PlayControls
          isAdmin={admin}
          session={sessionQuery.data}
          playbackState={playbackState}
          refreshPlayback={() => {
            setTimeout(() => {
              void refetchPlayback();
              void refetchQueue();
            }, 1000);
          }}
        />
      </div>
      {admin && <ReauthPopup />}
    </>
  );
}

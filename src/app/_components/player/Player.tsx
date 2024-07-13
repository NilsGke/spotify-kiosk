"use client";

import { api } from "~/trpc/react";
import PlayControls from "./PlayControls";
import Search from "./Search";
import CurrentSong from "./CurrentSong";
import Queue from "./Queue";
import SessionControls from "./SessionControls";
import ReauthPopup from "./ReauthPopup";
import { useEffect, useState } from "react";
import { itemIsTrack } from "~/helpers/itemTypeguards";
import toast from "react-simple-toasts";
import Container from "./Container";
import { useSignal } from "~/helpers/signals";
import Link from "next/link";
import { IoMdTv } from "react-icons/io";
import type { SpotifySession } from "@prisma/client";
import NoPlaybackPopup from "./NoPlaybackPopup";

const reauthErrorMessage =
  "Bad or expired token. This can happen if the user revoked a token or the access token has expired. You should re-authenticate the user.";

export default function Player({
  admin = false,
  code,
  password,
  initialSession,
}: {
  admin?: boolean;
  code: string;
  password: string;
  initialSession: SpotifySession;
}) {
  const sessionQuery = api.session.get.useQuery(
    { code, password },
    {
      refetchInterval: 60000,
      refetchOnWindowFocus: false,
      retryDelay: 30000,
      initialData: initialSession,
    },
  );

  const [spotifySession, setSpotifySession] = useState(sessionQuery.data);
  useSignal("updateSession", (data) =>
    data === null
      ? void sessionQuery.refetch()
      : setSpotifySession(data.newSession),
  );
  useSignal("updatePlaybackState", () => void refetchPlayback());

  // update spotifySession on query update
  useEffect(
    () => sessionQuery.data && setSpotifySession(sessionQuery.data),
    [sessionQuery.data],
  );

  // PLAYBACK
  const { data: playbackState, refetch: refetchPlayback } =
    api.spotify.getPlayback.useQuery(
      { code, password },
      {
        retry: (number, error) => {
          if (!error.message.includes(reauthErrorMessage)) return false;
          if (number === 0) return true;
          toast(
            "🚩 Fetching Playback failed - host needs to reauth. Tell them to open the session",
          );
          return false;
        },
        refetchInterval: (playbackState) => {
          if (playbackState === null) return 4000;
          else return false;
        },
      },
    );

  // QUEUE
  const { data: queueData, refetch: refetchQueue } =
    api.spotify.getQueue.useQuery(
      { code, password },
      {
        retry: (number, error) => {
          if (!error.message.includes(reauthErrorMessage)) return false;
          if (number === 0) return true;
          toast(
            "🚩 Fetching Queue failed - host needs to reauth. Tell them to open the session",
          );
          return false;
        },
      },
    );

  // HISTORY
  const { data: historyData, refetch: refetchHistory } =
    api.spotify.getHistory.useQuery(
      { code, password },
      {
        retry: (number, error) => {
          if (!error.message.includes(reauthErrorMessage)) return false;
          if (number === 0) return true;
          toast(
            "🚩 Fetching History failed - host needs to reauth. Tell them to open the session",
          );
          return false;
        },
      },
    );

  // update on song end
  useEffect(() => {
    if (!playbackState?.item) return;

    if (!itemIsTrack(playbackState.item)) return;
    const songEnd = () => {
      console.log("song finished");
      void refetchPlayback();
      void refetchQueue();
      setTimeout(() => void refetchHistory(), 1000);
    };

    const songEndTimer = setTimeout(
      songEnd,
      playbackState.item.duration_ms - playbackState.progress_ms,
    );

    return () => clearTimeout(songEndTimer);
  }, [playbackState, refetchPlayback, refetchQueue, refetchHistory]);

  return (
    <>
      <div className="grid gap-2 p-2 md:grid-cols-[30%,auto] lg:grid lg:grid-cols-[300px,1fr,300px] lg:grid-rows-[calc(100%-80px-0.5rem),80px] xl:grid-cols-[400px,1fr,400px]">
        {/* current song */}
        <Container className="col-start-1 row-start-1 flex flex-col gap-4 lg:col-start-1">
          <CurrentSong playbackState={playbackState} />
        </Container>

        {/* search */}
        <Container className="relative grid min-h-[500px] grid-rows-[2.75rem,minmax(0,1fr)] gap-2 overflow-hidden md:col-start-2 md:row-span-2 md:row-start-1 lg:col-start-2 lg:row-span-1 lg:row-start-1">
          <Search
            session={spotifySession}
            history={historyData}
            isAdmin={admin}
          />
        </Container>

        {/* queue */}
        <Container className="flex h-max min-h-96 flex-col gap-2 overflow-y-scroll scrollbar scrollbar-track-transparent scrollbar-thumb-zinc-600 sm:max-h-full md:col-start-1 md:row-start-2 md:h-auto lg:col-start-3 lg:row-span-2 lg:min-h-0">
          <Queue
            code={code}
            password={password}
            queueData={queueData}
            permissionSkipQueue={!!spotifySession?.permission_skipQueue}
            refreshQueue={() => {
              setTimeout(() => {
                void refetchQueue();
                void refetchPlayback();
              }, 500); // sadly need to wait for spotify api to update
            }}
          />
        </Container>

        {/* session controls */}
        <Container className="lg:col-start-1 lg:row-start-2">
          <div className="grid h-full grid-flow-col content-center justify-center gap-3">
            {admin && spotifySession && (
              <SessionControls spotifySession={spotifySession} />
            )}
            <Link
              title="TV-Mode"
              href={window.location.href + "/tv"}
              className="rounded-md border border-zinc-500 p-2"
            >
              <IoMdTv />
            </Link>
          </div>
        </Container>

        {/* playback controls */}
        <Container className="row-start-2 md:col-start-2 md:row-start-3 lg:col-start-2 lg:row-start-2">
          <PlayControls
            isAdmin={admin}
            session={spotifySession}
            playbackState={playbackState}
            refreshPlayback={() => {
              void refetchPlayback();
              void refetchQueue();
              void refetchHistory();
            }}
          />
        </Container>

        {admin && <ReauthPopup />}
        {playbackState === null && (
          <NoPlaybackPopup session={spotifySession} admin={admin} />
        )}
      </div>
    </>
  );
}

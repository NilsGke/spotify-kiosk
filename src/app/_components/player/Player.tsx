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
import Container from "./Container";

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
      <div className="grid gap-2 p-2 md:grid-cols-[30%,auto] lg:grid lg:grid-cols-[300px,1fr,300px] lg:grid-rows-[calc(100%-80px-0.5rem),80px] xl:grid-cols-[400px,1fr,400px]">
        {/* current song */}
        <Container className="col-start-1 row-start-1 flex flex-col gap-4 lg:col-start-1">
          <CurrentSong playbackState={playbackState} />
        </Container>

        {/* search */}
        <Container className="relative grid min-h-[500px] grid-rows-[2.75rem,1fr] gap-2 overflow-hidden md:col-start-2 md:row-span-2 md:row-start-1 lg:col-start-2 lg:row-span-1 lg:row-start-1">
          <Search session={sessionQuery.data} />
        </Container>

        {/* queue */}
        <Container className="flex h-max min-h-96 flex-col gap-2 overflow-y-scroll scrollbar scrollbar-track-transparent scrollbar-thumb-zinc-600 sm:max-h-full md:col-start-1 md:row-start-2 md:h-auto lg:col-start-3 lg:row-span-2 lg:min-h-0">
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
        </Container>

        {/* session controls */}
        <Container className="lg:col-start-1 lg:row-start-2 ">
          <SessionControls />
        </Container>

        {/* playback controls */}
        <Container className="row-start-2 md:col-start-2 md:row-start-3 lg:col-start-2 lg:row-start-2">
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
        </Container>
      </div>
      {admin && <ReauthPopup />}
    </>
  );
}

"use client";

import { api } from "~/trpc/react";
import PlayControls from "./PlayControls";
import Search from "./Search";
import CurrentSong from "./CurrentSong";
import Queue from "./Queue";
import SessionControls from "./SessionControls";
import ReauthPopup from "./ReauthPopup";
import { useEffect } from "react";
import { itemIsTrack } from "~/helpers/itemIsTrack";

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
    { refetchInterval: 60000 },
  );

  const { data: playbackState, refetch: refetchPlayback } =
    api.spotify.getPlayback.useQuery({
      code,
      password,
    });

  const { data: queueData, refetch: refetchQueue } =
    api.spotify.getQueue.useQuery({
      code,
      password,
    });

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
      <div className="gap-2 p-2 lg:grid lg:grid-cols-[300px,1fr,300px] xl:grid-cols-[400px,1fr,400px]">
        <Queue queueData={queueData} />

        <Search />

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

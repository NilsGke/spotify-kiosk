"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { RecentlyPlayedTracksPage } from "@spotify/web-api-ts-sdk";
import getItemImage from "~/helpers/getItemImage";
import { api } from "~/trpc/react";
import { sendSignal, useSignal } from "~/helpers/signals";
import ControlledHeart from "./ControlledHeart";
import FallbackImage from "../FallbackImage";

export default function TrackHistory({
  history,
}: {
  history: RecentlyPlayedTracksPage | undefined;
}) {
  const [listRef] = useAutoAnimate<HTMLDivElement>();

  const { data: savedTracksData, refetch: refetchSavedTracks } =
    api.spotify.hasSavedTracks.useQuery(
      history?.items.map((item) => item.track.id) ?? [],
      { enabled: history !== undefined },
    );

  useSignal("updateLikes", () => void refetchSavedTracks());

  return (
    <div className="h-full w-full max-w-xl rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:p-3 md:p-5 lg:p-6 4xl:row-span-2">
      <h2 className="mb-3 h-[20px] text-center">Track History</h2>
      <div
        ref={listRef}
        className="flex h-[calc(100%-32px)] flex-wrap justify-center overflow-y-scroll scrollbar scrollbar-track-transparent scrollbar-thumb-zinc-600"
      >
        {history === undefined &&
          [...Array(10).keys()].map((a, i) => (
            <div
              className="mb-1 h-6 w-full animate-pulse rounded bg-zinc-800"
              key={i}
            />
          ))}

        {history?.items.map((item, index) => {
          const savedAtIndex = savedTracksData?.at(index);
          const savedTrackData =
            savedAtIndex ??
            savedTracksData?.find((track) => track.id === item.track.id);
          const savedTrack = savedTrackData?.saved;

          const image = getItemImage(item.track, 0);
          const playedAt = new Date(item.played_at).toLocaleTimeString(
            undefined,
            {
              minute: "2-digit",
              hour: "2-digit",
            },
          );
          return (
            <div
              key={item.played_at}
              className="group grid w-full grid-cols-[50px_35px_1fr_50px] items-center rounded p-1 text-sm hover:bg-zinc-800"
            >
              <div className="text-xs text-zinc-500">{playedAt}</div>
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="aspect-square h-6 w-6 rounded-sm"
                  src={image.url}
                  height={image?.height}
                  width={image?.width}
                  alt="album image"
                />
              ) : (
                <FallbackImage className="aspect-square size-6 rounded-sm p-0.5" />
              )}
              <div className="inline-block overflow-hidden overflow-ellipsis whitespace-nowrap text-xs">
                {item.track.name}
              </div>
              <div>
                {savedTrack !== undefined && (
                  <div className="size-4 opacity-20 transition-opacity duration-300  group-hover:opacity-100 group-hover:duration-0">
                    <ControlledHeart
                      trackId={item.track.id}
                      isSaved={savedTrack ?? false}
                      onLikeChange={(event) =>
                        sendSignal("updateLikes", { [event]: [item.track] })
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

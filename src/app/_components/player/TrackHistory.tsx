"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { RecentlyPlayedTracksPage } from "@spotify/web-api-ts-sdk";
import getItemImage from "~/helpers/getItemImage";

export default function TrackHistory({
  history,
}: {
  history: RecentlyPlayedTracksPage | undefined;
}) {
  const [listRef] = useAutoAnimate<HTMLDivElement>();

  return (
    <div className="h-full w-full rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:p-3 md:p-5 lg:p-6">
      <h2 className="mb-3 h-[20px] text-center">Track History:</h2>
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

        {history?.items.map((item) => {
          const image = getItemImage(item.track, 2);
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
              className="grid w-full grid-cols-[50px_35px_1fr_auto] items-center rounded p-1 text-sm"
            >
              <div className="text-xs text-zinc-500">{playedAt}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="aspect-square h-6 w-6 rounded-sm"
                src={image.url}
                height={image?.height}
                width={image?.width}
                alt="album image"
              />
              <div className="inline-block overflow-hidden overflow-ellipsis whitespace-nowrap text-xs">
                {item.track.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

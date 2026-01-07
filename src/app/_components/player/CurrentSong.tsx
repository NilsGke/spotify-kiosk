"use client";

import type { Episode, PlaybackState, Track } from "@spotify/web-api-ts-sdk";
import SlideDisplay from "../SlideDisplay";
import { itemIsTrack } from "../../../helpers/itemTypeguards";
import Heart from "../Heart";
import getItemImage from "~/helpers/getItemImage";
import FallbackImage from "../FallbackImage";

type RealPlaybackState = Omit<PlaybackState, "item"> & {
  readonly item: Track | Episode | null;
};

export default function CurrentSong({
  playbackState,
}: {
  playbackState: RealPlaybackState | null | undefined;
}) {
  if (playbackState === undefined) return <Skeleton />;

  if (playbackState === null)
    return (
      <>
        <div className="flex aspect-square size-32 items-center justify-center overflow-hidden rounded-lg bg-zinc-800 text-zinc-600 md:size-56 lg:h-auto lg:w-full">
          no Track Playing
        </div>
        <div className="h-6 w-full text-zinc-600">waiting for Track...</div>
      </>
    );

  const image =
    playbackState.item === null ? null : getItemImage(playbackState.item, 0);

  return (
    <>
      <div className="grid grid-cols-[8rem,auto] gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-rows-1">
        <div className="inline-block aspect-square size-32 overflow-hidden rounded-lg bg-zinc-800 md:size-auto lg:h-auto lg:w-full">
          {image === null ? (
            <FallbackImage className="p-6" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.url} alt="track / episode art" />
          )}
        </div>
        <div>
          <SlideDisplay className="text-3xl lg:w-full" onlyOnHover>
            {playbackState.item?.name ?? (
              <span className="text-zinc-500">no title</span>
            )}
          </SlideDisplay>
          <div className="text-zinc-500">
            {playbackState.item &&
              (itemIsTrack(playbackState.item)
                ? playbackState.item.artists
                    .map((artist) => artist.name)
                    .join(", ")
                : playbackState.item.show.publisher)}
          </div>
        </div>
        {playbackState && playbackState.item && (
          <Heart trackId={playbackState.item.id} />
        )}
      </div>
    </>
  );
}

function Skeleton() {
  return (
    <>
      <div className="aspect-square h-auto w-full animate-pulse overflow-hidden rounded-lg bg-zinc-800"></div>
      <div className="h-6 w-full animate-pulse rounded-md bg-zinc-800"></div>
    </>
  );
}

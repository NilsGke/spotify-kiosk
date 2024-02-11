/* eslint-disable @next/next/no-img-element */
"use client";

import type { Episode, PlaybackState, Track } from "@spotify/web-api-ts-sdk";
import Container from "./Container";
import SlideDisplay from "../SlideDisplay";
import { itemIsTrack } from "../../../helpers/itemIsTrack";

type RealPlaybackState = Omit<PlaybackState, "item"> & {
  readonly item: Track | Episode | null;
};

export default function CurrentSong({
  playbackState,
}: {
  playbackState: RealPlaybackState | undefined;
}) {
  if (playbackState === undefined) return <Skeleton />;

  if (playbackState === null)
    return (
      <Container>
        <div className="aspect-square h-auto w-full overflow-hidden rounded-lg bg-zinc-800"></div>
        <div className="h-6 w-full">No track playing</div>
      </Container>
    );

  const image =
    playbackState.item === null
      ? null
      : itemIsTrack(playbackState.item)
        ? playbackState.item.album.images[0]
        : playbackState.item.images[0];

  console.log(playbackState);

  return (
    <Container className="flex flex-col gap-4">
      <div className="aspect-square h-auto w-full overflow-hidden rounded-lg bg-zinc-800">
        {image && <img src={image.url} alt="track / episode art" />}
      </div>
      <SlideDisplay>
        {playbackState.item?.name ?? (
          <span className="text-zinc-500">no title</span>
        )}
      </SlideDisplay>
    </Container>
  );
}

function Skeleton() {
  return (
    <Container className="flex flex-col gap-3">
      <div className="aspect-square h-auto w-full animate-pulse overflow-hidden rounded-lg bg-zinc-800"></div>
      <div className="h-6 w-full animate-pulse rounded-md bg-zinc-800"></div>
    </Container>
  );
}

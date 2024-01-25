/* eslint-disable @next/next/no-img-element */
"use client";

import type { Episode, PlaybackState, Track } from "@spotify/web-api-ts-sdk";
import Container from "./Container";
import SlideDisplay from "../SlideDisplay";

export default function CurrentSong({
  playbackState,
}: {
  playbackState: PlaybackState | undefined;
}) {
  if (playbackState === undefined) return <Skeleton />;

  const image = itemIsTrack(playbackState.item)
    ? playbackState.item.album.images[0]
    : playbackState.item.images[0];

  return (
    <Container className="flex flex-col gap-4">
      <div className="aspect-square h-auto w-full overflow-hidden rounded-lg bg-zinc-800">
        {image && <img src={image.url} alt="track / episode art" />}
      </div>
      <SlideDisplay>{playbackState.item.name}</SlideDisplay>
    </Container>
  );
}

const itemIsTrack = (item: Track | Episode): item is Track =>
  item.type === "track";

function Skeleton() {
  return (
    <Container>
      <div className="aspect-square h-auto w-full animate-pulse overflow-hidden rounded-lg bg-zinc-800"></div>
    </Container>
  );
}

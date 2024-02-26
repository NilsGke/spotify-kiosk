"use client";

import type { Episode, SimplifiedAlbum, Track } from "@spotify/web-api-ts-sdk";
import { api } from "~/trpc/react";
import { ResultItem } from "../Search";
import skeletonList from "./SkeletonList";
import Display from "./Display";
import { sendSignal } from "~/helpers/signals";

export default function Album({
  item,
  addToQueuePermission,
  addToQueue,
}: {
  item: SimplifiedAlbum;
  addToQueuePermission: boolean;
  addToQueue: (item: Track | Episode) => void;
}) {
  const { data, isLoading } = api.spotify.getAlbum.useQuery({ id: item.id });
  return (
    <Display
      title={item.name}
      imageUrl={item.images[0]?.url}
      subtitle={item.artists.map((artist) => (
        <a key={artist.id} href={artist.href}>
          {artist.name}
        </a>
      ))}
    >
      {isLoading || data === undefined
        ? skeletonList(6)
        : data.tracks.items.map((track) => (
            <ResultItem
              canAddToQueue={addToQueuePermission}
              key={item.id}
              addToQueue={
                addToQueuePermission
                  ? (item: Track | Episode) => addToQueue(item)
                  : (item: Track | Episode) => sendSignal("openPopup", { item })
              }
              item={{
                ...track,
                album: item,
                external_ids: { isrc: "", upc: "", ean: "" },
                popularity: item.popularity,
              }}
            />
          ))}
    </Display>
  );
}

import type { Episode, Track } from "@spotify/web-api-ts-sdk";

export const itemIsTrack = (item: Track | Episode): item is Track =>
  item.type === "track";

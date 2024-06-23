import type { Episode, Image, Track } from "@spotify/web-api-ts-sdk";
import { itemIsEpisode, itemIsTrack } from "./itemTypeguards";

/**
 *
 * @param item
 * @param quality 0 best - 2 worst
 * @returns
 */
export default function getItemImage(
  item: Track | Episode,
  quality: 0 | 1 | 2 = 0,
) {
  let image: Image | undefined;

  if (itemIsTrack(item)) image = item.album.images.at(quality);
  else if (itemIsEpisode(item)) image = item.images.at(quality);

  if (image === undefined)
    throw Error(`could not get image from item: ${item.name} - ${item.uri}`);

  return image;
}

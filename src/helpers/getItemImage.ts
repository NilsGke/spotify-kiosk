import type { Episode, Image, Track } from "@spotify/web-api-ts-sdk";
import { itemIsEpisode, itemIsTrack } from "./itemTypeguards";

/** extracts image from item (Track or Episode)
 * @param item
 * @param quality 0 best, 2 worst, default: 0
 */
export default function getItemImage(
  item: Track | Episode,
  quality: 0 | 1 | 2 = 0,
) {
  let image: Image | undefined;

  if (itemIsTrack(item))
    image = item.album.images.at(quality) || item.album.images.at(0);
  else if (itemIsEpisode(item))
    image = item.images.at(quality) || item.images.at(0);

  if (image === undefined) return null;
  return image;
}

import type {
  Artist,
  ItemTypes,
  Playlist,
  SimplifiedAlbum,
  SimplifiedAudiobook,
  SimplifiedEpisode,
  SimplifiedShow,
  SimplifiedTrack,
  Track,
} from "@spotify/web-api-ts-sdk";

export type PlaylistBase = Omit<Playlist, "tracks">;

export type SearchResult =
  | SimplifiedAlbum
  | Artist
  | SimplifiedAudiobook
  | SimplifiedEpisode
  | PlaylistBase
  | Track
  | SimplifiedShow;

export const itemIsAlbum = (item: SearchResult): item is SimplifiedAlbum =>
  (item.type as ItemTypes) === "album";

export const itemIsArtist = (item: SearchResult): item is Artist =>
  (item.type as ItemTypes) === "artist";

export const itemIsAudiobook = (
  item: SearchResult,
): item is SimplifiedAudiobook => (item.type as ItemTypes) === "audiobook";

export const itemIsEpisode = (item: SearchResult): item is SimplifiedEpisode =>
  (item.type as ItemTypes) === "episode";

export const itemIsPlaylist = (item: SearchResult): item is PlaylistBase =>
  (item.type as ItemTypes) === "playlist";

export const itemIsTrack = (item: SearchResult): item is Track =>
  (item.type as ItemTypes) === "track";

export const itemIsShow = (item: SearchResult): item is SimplifiedShow =>
  (item.type as ItemTypes) === "show";

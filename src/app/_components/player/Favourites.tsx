"use client";

import type { Track, SavedTrack } from "@spotify/web-api-ts-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import getItemImage from "~/helpers/getItemImage";
import { api } from "~/trpc/react";
import { FaRegHeart } from "react-icons/fa";
import type { SpotifySession } from "@prisma/client";
import { sendSignal, useSignal } from "~/helpers/signals";
import LoginButton from "../LoginButton";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import FallbackImage from "../FallbackImage";

const limit = 9;

export default function Favourites({
  spotifySession,
  isAdmin,
}: {
  spotifySession: SpotifySession | undefined;
  isAdmin: boolean;
}) {
  const { mutate: addSongToQueue } = api.spotify.addToQueue.useMutation({
    onSettled: () => sendSignal("updateQueue", null), // update queue on success to move song to correct queue position and on error to remove song from queue
  });

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading,
    refetch,
  } = api.spotify.getFavourites.useInfiniteQuery(
    { limit },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      retry: 1,
      initialCursor: 0,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
    },
  );

  const tracks = useMemo(
    () =>
      data?.pages.reduce<SavedTrack[]>(
        (acc, page) => [...acc, ...page.items],
        [],
      ),
    [data],
  );

  // for instant updates:
  const [added, setAdded] = useState<Track[]>([]);
  const [removed, setRemoved] = useState<Track[]>([]);

  useSignal("updateLikes", (newData) => {
    if (newData === null) return void refetch();
    if (newData.add !== undefined)
      setAdded((prev) => [...prev, ...newData.add!]);
    if (newData.remove !== undefined)
      setRemoved((prev) => [...prev, ...newData.remove!]);
    void refetch();
  });

  // update "added" and "removed" based on new tracks
  useEffect(() => {
    setAdded(
      (prev) =>
        prev.filter((t1) => !tracks?.some((t2) => t1.id === t2.track.id)) ??
        true,
    );
    setRemoved(
      (prev) =>
        prev.filter((t1) => !tracks?.some((t2) => t1.id === t2.track.id)) ??
        true,
    );
  }, [tracks]);

  const observer = useRef<IntersectionObserver>();

  const lastElementRef = useCallback(
    (node: HTMLButtonElement) => {
      if (isLoading) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (
          entries[0] &&
          entries[0].isIntersecting &&
          hasNextPage &&
          !isFetching
        )
          void fetchNextPage();
      });

      if (node) observer.current.observe(node);
    },
    [fetchNextPage, hasNextPage, isFetching, isLoading],
  );

  const [listRef] = useAutoAnimate();

  return (
    <div className="row-span-2 h-full w-full max-w-xl rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:p-3 md:p-5 lg:p-6 4xl:col-start-3 4xl:row-span-3 4xl:row-start-1">
      <h2 className="mb-3 h-[20px] text-center">
        your favourites <FaRegHeart className="inline-block" />
      </h2>
      <div
        ref={listRef}
        className="flex h-[calc(100%-32px)] flex-wrap overflow-y-scroll scrollbar scrollbar-track-transparent scrollbar-thumb-zinc-600"
      >
        {tracks !== undefined &&
          [
            ...added
              .filter((t1) => tracks.every((t2) => t1.id !== t2.track.id))
              .map((track) => ({ track })),
            ...tracks.filter((t1) =>
              removed.every((t2) => t1.track.id !== t2.id),
            ),
          ]?.map(({ track }) => {
            const image = getItemImage(track, 0);
            return (
              <button
                key={track.id}
                ref={lastElementRef}
                onClick={() => {
                  if (!isAdmin && spotifySession?.permission_addToQueue) return;

                  spotifySession &&
                    addSongToQueue({
                      code: spotifySession.code,
                      password: spotifySession.password,
                      songUri: track.uri,
                    });

                  sendSignal("updateQueue", { add: [track], remove: [] });
                }}
                className="grid w-full grid-cols-[35px_1fr_auto] items-center rounded p-1 text-sm hover:bg-zinc-800"
              >
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.url}
                    alt="album image"
                    className="size-6 rounded-sm"
                  />
                ) : (
                  <FallbackImage className="size-6 rounded-sm p-0.5" />
                )}
                <div className="truncate text-start text-xs">{track.name}</div>
              </button>
            );
          })}
        {(isLoading || isFetching) &&
          [...Array(limit).keys()].map((_v, i) => (
            <div
              key={i}
              className="mb-2 h-6 w-full animate-pulse bg-zinc-800"
            />
          ))}
        {error &&
          (error.message === "UNAUTHORIZED" ? (
            <div className="flex size-full flex-wrap content-center items-center justify-center gap-2 text-sm text-zinc-500">
              <LoginButton
                session={null}
                className="borderzinc-700 rounded-md border bg-transparent px-2 py-1 text-sm text-white"
              />
              <div>to view your saved tracks</div>
            </div>
          ) : (
            error.message
          ))}
      </div>
    </div>
  );
}

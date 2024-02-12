"use client";

import Container from "./Container";
import type { Episode, Queue, Track } from "@spotify/web-api-ts-sdk";
import { itemIsTrack } from "~/helpers/itemTypeguards";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

export default function Queue({
  code,
  password,
  queueData,
  permissionSkipQueue,
  refreshQueue,
}: {
  code: string;
  password: string;
  queueData: Queue | undefined;
  permissionSkipQueue: boolean;
  refreshQueue: () => void;
}) {
  const [currentContainerRef] = useAutoAnimate();
  const [listRef] = useAutoAnimate();
  const [hovering, setHovering] = useState<number | null>(null);
  const [queue, setQueue] = useState<Queue | undefined>(queueData);

  // update `queue` value on queueData change
  useEffect(() => setQueue(queueData), [queueData]);

  const { mutate: skipQueue } = api.spotify.skipQueue.useMutation({
    onMutate(input) {
      setQueue((prev) => {
        if (prev === undefined) return undefined;

        const index = prev.queue.findIndex(
          (item) => item.uri === input.uriToSkipTo,
        );

        return {
          currently_playing: prev.queue.at(index)!,
          queue: prev.queue.slice(index + 1),
        };
      });
    },
    onSuccess: refreshQueue,
  });

  return (
    <Container className="scrollbar-track-transparent scrollbar-thumb-zinc-600 scrollbar flex max-h-full flex-col gap-2 overflow-y-scroll">
      <h2 className="">Currently Playing</h2>
      <div ref={currentContainerRef}>
        <Item data={queue?.currently_playing ?? null} />
      </div>

      <h2 className="">Upcoming</h2>
      <div className="flex flex-col  text-sm" ref={listRef}>
        {queue === undefined
          ? [...Array(10).keys()].map((a, i) => <Item key={i} data={null} />)
          : queue.queue.map((item, i) => (
              <Item
                index={i}
                key={item.id}
                data={item}
                canSkipQueue={permissionSkipQueue}
                onClick={() =>
                  permissionSkipQueue &&
                  skipQueue({ code, password, uriToSkipTo: item.uri })
                }
                willGetSkipped={hovering !== null && i < hovering} // property to show that if user clicks on item after this one, all prev items will be skipped
                onHoverStart={() => permissionSkipQueue && setHovering(i)}
                onHoverEnd={() => permissionSkipQueue && setHovering(null)}
              />
            ))}
      </div>
    </Container>
  );
}

function Item({
  index,
  data,
  canSkipQueue = false,
  willGetSkipped = false,
  onHoverStart,
  onHoverEnd,
  onClick,
}: {
  index?: number;
  data: Track | Episode | null;
  canSkipQueue?: boolean;
  willGetSkipped?: boolean;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onClick?: () => void;
}) {
  if (data === null)
    return (
      <div className="h-8 w-full animate-pulse rounded bg-zinc-800 p-2"></div>
    );

  const isTrack = itemIsTrack(data);

  const image = isTrack ? data.album.images.at(-1) : data.images.at(-1);

  let lengthString = new Date(data.duration_ms).toISOString().slice(11, 19);
  if (lengthString.startsWith("00:")) lengthString = lengthString.slice(3, 8);

  return (
    <div
      onClick={onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className={twMerge(
        "grid w-full grid-cols-[30px_35px_1fr_auto] items-center rounded p-2",
        canSkipQueue &&
          "cursor-pointer transition hover:bg-zinc-800 hover:transition-none",
        willGetSkipped && "opacity-40 grayscale",
      )}
    >
      <div className="text-sm text-zinc-500">
        {index !== undefined && index + 2}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="aspect-square h-6 w-6 rounded-sm"
        src={image?.url}
        height={image?.height}
        width={image?.width}
        alt="album image"
      />
      <div className="inline-block overflow-hidden overflow-ellipsis whitespace-nowrap">
        {data.name}
      </div>
      <div className="ml-2 text-xs text-zinc-600">{lengthString}</div>
    </div>
  );
}

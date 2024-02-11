"use client";

import Container from "./Container";
import type { Episode, Queue, Track } from "@spotify/web-api-ts-sdk";
import { itemIsTrack } from "~/helpers/itemIsTrack";
import { useAutoAnimate } from "@formkit/auto-animate/react";

export default function Queue({ queueData }: { queueData: Queue | undefined }) {
  const [currentContainerRef] = useAutoAnimate();
  const [listRef] = useAutoAnimate();

  return (
    <Container className="flex max-h-full flex-col gap-2 overflow-y-scroll">
      <h2 className="">Currently Playing</h2>
      <div ref={currentContainerRef}>
        <Item data={queueData?.currently_playing ?? null} />
      </div>

      <h2 className="">Upcoming</h2>
      <div className="flex flex-col gap-3 text-sm" ref={listRef}>
        {queueData === undefined
          ? [...Array(10).keys()].map((a, i) => <Item key={i} data={null} />)
          : queueData.queue.map((item, i) => (
              <Item index={i} key={item.id} data={item} />
            ))}
      </div>
    </Container>
  );
}

function Item({
  index,
  data,
}: {
  index?: number;
  data: Track | Episode | null;
}) {
  if (data === null)
    return <div className="h-8 w-full animate-pulse bg-zinc-600 p-2"></div>;

  const isTrack = itemIsTrack(data);

  const image = isTrack ? data.album.images.at(-1) : data.images.at(-1);

  let lengthString = new Date(data.duration_ms).toISOString().slice(11, 19);
  if (lengthString.startsWith("00:")) lengthString = lengthString.slice(3, 8);

  return (
    <div className="grid h-6 w-full grid-cols-[30px_30px_1fr_auto] items-center ">
      <div className="text-sm text-zinc-500">
        {index !== undefined && index + 2}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="aspect-square h-6 w-6"
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

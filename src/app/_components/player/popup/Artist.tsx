import type { Artist, Episode, Market, Track } from "@spotify/web-api-ts-sdk";
import Display from "./Display";
import { api } from "~/trpc/react";
import { ResultList } from "../Search";
import skeletonList from "./SkeletonList";
import SlideDisplay from "../../SlideDisplay";
import { sendSignal } from "~/helpers/signals";

export default function Artist({
  item: artist,
  market,
  addToQueuePermission,
  addToQueue,
}: {
  item: Artist;
  market: Market;
  addToQueuePermission: boolean;
  addToQueue: (item: Track | Episode) => void;
}) {
  const { data: info } = api.spotify.getArtistInformation.useQuery({
    artistId: artist.id,
    market,
  });

  return (
    <Display
      title={artist.name}
      imageUrl={artist.images[0]?.url}
      subtitle={
        artist.followers.total.toLocaleString() +
        " follower" +
        (artist.followers.total !== 1 ? "s" : "") // add trailing s (plural) only if follower count is not 1
      }
    >
      <div className="grid-cols-2 gap-2 lg:grid lg:gap-4">
        <div>
          <h2>Top Tracks</h2>
          {info === undefined ? (
            skeletonList(5)
          ) : (
            <ResultList
              minimal
              addToQueue={addToQueue}
              canAddToQueue={addToQueuePermission}
              items={info.topTracks.tracks}
            />
          )}
        </div>
        <div>
          <h2>Albums</h2>
          {info === undefined ? (
            skeletonList(4)
          ) : (
            <ResultList
              minimal
              canAddToQueue={addToQueuePermission}
              addToQueue={() => {
                return;
              }}
              items={info.albums.items}
            />
          )}
        </div>
        <div className="col-span-2">
          <h2>Related artists</h2>
          <button className="flex flex-wrap gap-2 overflow-x-scroll scrollbar scrollbar-track-transparent scrollbar-thumb-zinc-600">
            {info === undefined
              ? [...Array(7).keys()].map((u, i) => (
                  <div key={i} className="inline-block" />
                ))
              : info.relatedArtists.map((artist) => (
                  <div
                    onClick={() => sendSignal("openPopup", { item: artist })}
                    key={artist.id}
                    className="grid cursor-pointer grid-rows-[100px,auto] rounded p-2 transition hover:bg-zinc-700 hover:transition-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="aspect-square size-[100px] rounded"
                      src={artist.images[1]?.url && artist.images[0]?.url}
                      alt={"profile picture of" + artist.name}
                    />
                    <SlideDisplay className="text-sm" onlyOnHover>
                      {artist.name}
                    </SlideDisplay>
                  </div>
                ))}
          </button>
        </div>
      </div>
    </Display>
  );
}

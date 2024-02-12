"use client";

import { type HTMLAttributes, useRef, useState } from "react";
import Container from "./Container";
import { api } from "~/trpc/react";
import { itemTypes } from "~/helpers/itemTypes";
import type { ItemTypes, Page } from "@spotify/web-api-ts-sdk";
import {
  itemIsAlbum,
  itemIsArtist,
  itemIsAudiobook,
  itemIsEpisode,
  itemIsPlaylist,
  itemIsShow,
  itemIsTrack,
  type SearchResult,
} from "~/helpers/itemTypeguards";
import useDebounce from "~/hooks/useDebounce";
import { twMerge } from "tailwind-merge";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import type { SpotifySession } from "@prisma/client";

export default function Search({
  session,
}: {
  session: SpotifySession | undefined;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const searchDebounce = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(0);

  // display chip behind input if starts with @ + itemType
  const typeFilter = itemTypes.find((type) =>
    searchTerm.startsWith("@" + type),
  );
  const inputBG =
    typeFilter !== undefined ? (
      <>
        <span className="rounded bg-gray-600 outline outline-2 outline-gray-600">
          @{typeFilter}
        </span>{" "}
        {searchTerm.slice(0, typeFilter.length)}
      </>
    ) : (
      searchTerm
    );

  // display "autocomplete" menu if input starts with @
  const showSuggest = searchTerm.startsWith("@") && typeFilter === undefined;
  const searchWithoutAt = searchTerm.slice(1, undefined);
  const suggestions = itemTypes.filter((type) =>
    type.startsWith(searchWithoutAt),
  );

  // search query
  const { data: searchResults, isFetching } = api.spotify.search.useQuery(
    {
      page,
      searchTerm:
        typeFilter !== undefined
          ? searchDebounce.replace(`@${typeFilter} `, "")
          : searchDebounce,
      types: [typeFilter ?? "track"],
    },
    {
      enabled: showSuggest === false && searchTerm.length !== 0,
      select: (data) =>
        Object.entries(data).map(([key, value]) => ({
          itemType: key as ItemTypes,
          resultPage: value,
        })),
      refetchOnWindowFocus: false,
    },
  );

  console.log({
    enabled: showSuggest === false && searchTerm.length !== 0,
    searchTerm,
    searchResults,
    isFetching,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // page buttons
  const buttonCount = 5;
  const pageButtons = searchResults !== undefined && (
    <div className="flex w-full flex-nowrap items-center justify-center gap-2">
      <PageButton
        className=""
        disabled={page === 0}
        onClick={() => setPage((prev) => (prev - 1 < 0 ? 1 : prev - 1))}
      >
        <FaAngleLeft />
      </PageButton>

      {[...Array(buttonCount).keys()].map((i) => (
        <PageButton
          key={i}
          onClick={() => setPage(i)}
          className={(page === i && "border-spotify") || undefined}
        >
          {i + 1}
        </PageButton>
      ))}

      {page >= buttonCount && (
        <PageButton className="border-spotify">{page + 1}</PageButton>
      )}

      <PageButton onClick={() => setPage((prev) => prev + 1)}>
        <FaAngleRight />
      </PageButton>
    </div>
  );

  return (
    <Container className="grid grid-rows-[2.75rem,1fr] gap-2">
      <div className="relative">
        <div className=" z-10 h-11 w-full rounded-lg border-2 border-zinc-600 bg-transparent p-2 text-transparent">
          {inputBG}
        </div>
        <input
          className="absolute top-0 z-20 h-11 w-full rounded-lg border-2 border-zinc-600 bg-transparent p-2 text-white"
          ref={inputRef}
          type="text"
          placeholder="search... (type @ to search for other things than tracks)"
          value={searchTerm}
          onKeyUp={(e) => {
            // fires after onChange is complete
            // automatically add space after search thing term
            if (
              typeFilter !== undefined &&
              searchTerm.length === typeFilter.length + 1 &&
              searchTerm.at(typeFilter.length) !== " " &&
              e.key !== "Backspace"
            )
              setSearchTerm((prev) => prev + " ");

            if (
              e.key === "ArrowDown" &&
              (e.target as HTMLInputElement).selectionStart ===
                searchTerm.length
            )
              (
                suggestionRef.current?.children[0] as HTMLButtonElement | null
              )?.focus();
          }}
          onChange={(e) => setSearchTerm(() => e.target.value)}
        />
        {showSuggest && (
          <div
            className="absolute top-12 z-30 flex w-24 flex-col gap-1 rounded-lg border border-gray-600 bg-black p-2 text-sm"
            ref={suggestionRef}
          >
            {suggestions.map((suggestion) => (
              <button
                className="rounded bg-zinc-800 py-1"
                key={suggestion}
                onKeyUp={(e) => {
                  if (e.key === "ArrowUp")
                    (
                      (e.target as HTMLButtonElement)
                        .previousElementSibling as HTMLButtonElement | null
                    )?.focus();
                  else if (e.key === "ArrowDown")
                    (
                      (e.target as HTMLButtonElement)
                        .nextElementSibling as HTMLButtonElement | null
                    )?.focus();
                  else if (e.key === "Escape") inputRef.current?.focus();
                }}
                onClick={(e) => {
                  console.log("onclick");
                  setSearchTerm("@" + suggestion + " ");
                  inputRef.current?.focus();
                }}
              >
                {suggestion}
              </button>
            ))}
            {suggestions.length === 0 && (
              <div className="text-sm text-zinc-500">invalid filter</div>
            )}
          </div>
        )}
      </div>
      <div
        className={twMerge(
          "flex h-full w-full max-w-full flex-grow-0 flex-col gap-2 overflow-y-scroll scrollbar scrollbar-track-transparent scrollbar-thumb-zinc-600",
          isFetching && "overflow-hidden",
          searchTerm !== searchDebounce && "opacity-60",
        )}
      >
        {/* page if search input is empty */}
        {searchTerm.length === 0 && searchResults === undefined && (
          <div className="grid h-full w-full grid-cols-1 items-center justify-center justify-items-center gap-4 md:grid-cols-2 md:grid-rows-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8">
              start typing to search for a track
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8">
              you can search for different things with @
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8">
              <h2>Your Permissions:</h2>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8"></div>
          </div>
        )}

        {pageButtons}

        {/* search results */}
        {searchResults?.map((result) => (
          <ResultList key={result.itemType} resultPage={result.resultPage} />
        ))}

        {pageButtons}

        {/* results skeleton */}
        {isFetching &&
          [...Array(20).keys()].map((i) => (
            <div
              key={i}
              className="min-h-10 w-full max-w-full animate-pulse rounded bg-zinc-800"
            />
          ))}
      </div>
    </Container>
  );
}

function ResultList({ resultPage }: { resultPage: Page<SearchResult> }) {
  if (resultPage.items.filter((item) => item !== null).length === 0)
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
        no search results :(
      </div>
    );

  return resultPage.items
    .filter((item) => item !== null)
    .map((item) => (
      <ResultItem
        key={item.id + (itemIsTrack(item) && item.album.id)} // need to add album to track because a track can be in multiple albums, resulting in the ids not being unique 🤡
        item={item}
      />
    ));
}

function ResultItem({ item }: { item: SearchResult }) {
  if (itemIsAlbum(item))
    return (
      <ResultRow
        imageUrl={item.images.at(-1)?.url ?? ""}
        name={item.name}
        artist={item.artists.map((artist) => artist.name).join(", ")}
        extraInfo={item.release_date}
        duration={item.total_tracks.toString() + " tracks"}
        onClick={() => {
          console.log(item.id);
        }}
      />
    );

  if (itemIsArtist(item))
    return (
      <ResultRow
        imageUrl={item.images.at(-1)?.url ?? ""}
        name={item.name}
        artist={null}
        extraInfo={item.followers.total.toLocaleString()}
        duration={""}
        onClick={() => {
          console.log(item.id);
        }}
      />
    );

  if (itemIsAudiobook(item))
    return (
      <ResultRow
        imageUrl={item.images.at(-1)?.url ?? ""}
        name={item.name}
        artist={item.authors.map((author) => author.name).join(", ")}
        extraInfo={item.description}
        duration={item.total_chapters + " chapters"}
        onClick={() => {
          console.log(item.id);
        }}
      />
    );

  if (itemIsEpisode(item)) {
    let lengthString = new Date(item.duration_ms).toISOString().slice(11, 19);
    if (lengthString.startsWith("00:")) lengthString = lengthString.slice(3, 8);
    return (
      <ResultRow
        imageUrl={item.images.at(-1)?.url ?? ""}
        name={item.name}
        artist={null}
        extraInfo={item.description}
        duration={lengthString}
        onClick={() => {
          console.log(item.id);
        }}
      />
    );
  }

  if (itemIsPlaylist(item))
    return (
      <ResultRow
        imageUrl={item.images.at(-1)?.url ?? ""}
        name={item.name}
        artist={item.description}
        extraInfo={"by " + item.owner.display_name}
        // api does not know that tracks is a thing
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        duration={(
          item as unknown as { tracks: { total: number } }
        ).tracks.total.toString()}
        onClick={() => {
          console.log(item.id);
        }}
      />
    );

  if (itemIsTrack(item)) {
    let lengthString = new Date(item.duration_ms).toISOString().slice(11, 19);
    if (lengthString.startsWith("00:")) lengthString = lengthString.slice(3, 8);
    return (
      <ResultRow
        imageUrl={item.album.images.at(-1)?.url ?? ""}
        name={item.name}
        artist={item.artists.map((artist) => artist.name).join(", ")}
        extraInfo={item.album.name}
        duration={lengthString}
        onClick={() => {
          console.log(item);
        }}
      />
    );
  }

  if (itemIsShow(item)) {
    return (
      <ResultRow
        imageUrl={item.images.at(-1)?.url ?? ""}
        name={item.name}
        artist={item.description}
        extraInfo={item.publisher}
        duration={item.total_episodes.toString()}
        onClick={() => {
          console.log(item.id);
        }}
      />
    );
  }

  return <div></div>;
}

const ResultRow = ({
  imageUrl,
  name,
  artist,
  extraInfo,
  duration,
  onClick,
}: {
  imageUrl: string;
  name: string;
  artist: string | null;
  extraInfo: string;
  duration: string;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="grid h-14 w-full max-w-full grid-cols-[40px,1.5fr,1fr,100px] items-center gap-4 rounded hover:bg-zinc-800"
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="aspect-square h-8 w-8 rounded" src={imageUrl} alt="" />

    <div className="grid w-full grid-rows-[auto,auto]">
      <div
        className="w-full overflow-hidden text-ellipsis whitespace-nowrap"
        title={name}
      >
        {name}
      </div>
      {artist && (
        <div
          className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-zinc-400"
          title={artist}
        >
          {artist}
        </div>
      )}
    </div>

    <div
      className="w-full overflow-hidden text-ellipsis whitespace-nowrap"
      title={extraInfo}
    >
      {extraInfo}
    </div>

    <div className="w-full">{duration}</div>
  </div>
);

const PageButton: React.FC<
  HTMLAttributes<HTMLButtonElement> & { disabled?: boolean }
> = (props) => (
  <button
    {...props}
    className={twMerge(
      "flex aspect-square h-10 w-10 items-center justify-center rounded border border-zinc-700",
      props.disabled
        ? "bg-zinc-700"
        : "transition hover:bg-zinc-800 hover:transition-none active:bg-zinc-700",
      props.className,
    )}
  />
);

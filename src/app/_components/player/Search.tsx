"use client";

import {
  type HTMLAttributes,
  useRef,
  useState,
  useEffect,
  type KeyboardEventHandler,
} from "react";
import { api } from "~/trpc/react";
import { itemTypes } from "~/types/itemTypes";
import type { Episode, ItemTypes, Page, Track } from "@spotify/web-api-ts-sdk";
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
import { stringIsPermissionName } from "~/types/permissionTypes";
import { sendSignal } from "~/helpers/signals";
import toast from "react-simple-toasts";
import Popup from "./popup/Popup";

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
        <span
          onClick={() => setShowSuggest(true)}
          className="rounded bg-zinc-800 py-0.5 pr-2 outline outline-2 outline-zinc-600"
        >
          @{typeFilter}
        </span>{" "}
        {/* {searchTerm.slice(0, typeFilter.length)} */}
      </>
    ) : (
      searchTerm
    );

  // display "autocomplete" menu if input starts with @
  const [showSuggest, setShowSuggest] = useState(false);
  // update show suggest on every character input
  useEffect(() => {
    setShowSuggest(searchTerm.startsWith("@") && typeFilter === undefined);
    setPage(0);
  }, [searchTerm, typeFilter]);

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
          ? searchDebounce.replace(`@${typeFilter} `, "").trim()
          : searchDebounce.trim(),
      types: [typeFilter ?? "track"],
    },
    {
      enabled: showSuggest === false && searchTerm.trim().length !== 0,
      select: (data) =>
        Object.entries(data).map(([key, value]) => ({
          itemType: key as ItemTypes,
          resultPage: value,
        })),
      refetchOnWindowFocus: false,
    },
  );

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
  const pageButtonSkeleton = (
    <div className="flex w-full flex-nowrap items-center justify-center gap-2 opacity-50">
      <PageButton disabled>
        <FaAngleLeft />
      </PageButton>

      {[...Array(buttonCount).keys()].map((i) => (
        <PageButton key={i}>{i + 1}</PageButton>
      ))}

      {page >= buttonCount && (
        <PageButton className="border-spotify">{page + 1}</PageButton>
      )}

      <PageButton>
        <FaAngleRight />
      </PageButton>
    </div>
  );

  const addToQueueMutation = api.spotify.addToQueue.useMutation({
    onSuccess: () => sendSignal("updateQueue", null),
    onError: (error, variables) => {
      sendSignal("updateQueue", {
        add: [],
        remove: [variables.songUri],
      });
      if (error.shape?.data.zodError)
        toast(error.data?.zodError?.fieldErrors[0]);
      else toast(error.message);
    },
  });

  const suggestionItemKeyUp: KeyboardEventHandler<HTMLButtonElement> = (e) => {
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
  };

  return (
    <>
      {/* search bar */}
      <div className="relative">
        <div className="z-10 h-11 w-full rounded-lg border-2 border-zinc-600 bg-transparent p-2 pl-1 text-transparent">
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
              setSearchTerm((prev) => prev + "  ");

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
            className="absolute top-12 z-30 flex flex-col gap-1 rounded-lg border border-gray-600 bg-black p-2 text-sm"
            ref={suggestionRef}
          >
            {suggestions.map((suggestion) => (
              <button
                className="rounded border-2 border-zinc-600 bg-zinc-800 px-1 py-1"
                key={suggestion}
                onKeyUp={suggestionItemKeyUp}
                onClick={() => {
                  setSearchTerm("@" + suggestion + "  ");
                  inputRef.current?.focus();
                }}
              >
                {suggestion}
              </button>
            ))}
            {suggestions.length === 0 && (
              <div className="text-sm text-zinc-500">invalid filter</div>
            )}
            <button
              onClick={() => {
                setSearchTerm(
                  (prev) => prev.replace(/^(@\w*)\s*/i, "") ?? prev,
                );
                inputRef.current?.focus();
              }}
              onKeyUp={suggestionItemKeyUp}
              className="text-nowrap rounded border-2 border-zinc-600 bg-zinc-800 px-1 py-1"
            >
              remove filter
            </button>
          </div>
        )}
      </div>

      {/* results */}
      <div
        className={twMerge(
          "flex h-full w-full max-w-full flex-grow-0 flex-col gap-2 overflow-y-scroll scrollbar scrollbar-track-transparent scrollbar-thumb-zinc-600",
          isFetching && "overflow-hidden",
          searchTerm !== searchDebounce &&
            searchTerm !== "" &&
            "opacity-40 grayscale",
        )}
      >
        {/* page if search input is empty */}
        {searchTerm.length === 0 && searchResults === undefined && (
          <div className="grid h-full w-full grid-cols-1 items-center justify-center justify-items-center gap-4 md:grid-cols-2 md:grid-rows-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:p-3 md:p-5 lg:p-6">
              start typing to search for a track
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:p-3 md:p-5 lg:p-6">
              <h2 className="mb-3 text-center">type @...</h2>
              <div className="flex flex-wrap gap-1">
                {itemTypes.map((typename) => (
                  <button
                    key={typename}
                    onClick={() => {
                      setSearchTerm("@" + typename + "  ");
                      inputRef.current?.focus();
                    }}
                    className="rounded border border-zinc-500 bg-zinc-800 px-1 py-0.5 hover:bg-zinc-700 active:bg-zinc-600"
                  >
                    {typename}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:p-3 md:p-5 lg:p-6">
              <h2 className="mb-3 text-center">Your Permissions:</h2>
              <div className="flex flex-wrap justify-center gap-1">
                {session &&
                  Object.entries(session)
                    .filter((a) => stringIsPermissionName(a[0]))
                    .map((keyval) => {
                      const [permissionName, value] = keyval;
                      if (typeof value !== "boolean") return null;
                      if (value === false) return null;

                      return (
                        <div
                          key={permissionName}
                          className="rounded border border-green-700 px-1 py-0.5 text-green-300"
                        >
                          {permissionName.replace("permission_", "")}
                        </div>
                      );
                    })}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:p-3 md:p-5 lg:p-6"></div>
          </div>
        )}

        {pageButtons}

        {/* search results */}
        {searchResults?.map((result) => (
          <ResultList
            canAddToQueue={!!session?.permission_addToQueue}
            addToQueue={
              !!session?.permission_addToQueue
                ? (item) => {
                    if (session) {
                      addToQueueMutation.mutate({
                        code: session.code,
                        password: session.password,
                        songUri: item.uri,
                      });
                      sendSignal("updateQueue", {
                        add: [item],
                        remove: [],
                      });
                    }
                  }
                : undefined
            }
            key={result.itemType}
            items={result.resultPage.items}
          />
        ))}

        {pageButtons}

        {/* results skeleton */}
        {isFetching && (
          <>
            {pageButtonSkeleton}
            {[...Array(20).keys()].map((i) => (
              <div
                key={i}
                className="min-h-10 w-full max-w-full animate-pulse rounded bg-zinc-900"
              />
            ))}
            {pageButtonSkeleton}
          </>
        )}
      </div>
      {session && (
        <Popup
          market={session.market}
          code={session.code}
          password={session.password}
          addToQueuePermission={session.permission_addToQueue}
        />
      )}
    </>
  );
}

export function ResultList({
  items,
  canAddToQueue,
  addToQueue,
  minimal = false,
}: {
  items: Page<SearchResult>["items"];
  canAddToQueue: boolean;
  addToQueue: undefined | ((item: Track | Episode) => void);
  minimal?: boolean;
}) {
  if (items.filter((item) => item !== null).length === 0)
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
        no search results :(
      </div>
    );

  return (
    <>
      {items
        .filter((item) => item !== null)
        .map((item) => (
          <ResultItem
            canAddToQueue={canAddToQueue}
            minimal={minimal}
            key={item.id + (itemIsTrack(item) && item.album.id)} // need to add album to track because a track can be in multiple albums, resulting in the ids not being unique 🤡
            addToQueue={addToQueue}
            item={item}
          />
        ))}
    </>
  );
}

export function ResultItem({
  item,
  addToQueue,
  canAddToQueue,
  minimal = false,
}: {
  item: SearchResult;
  addToQueue: undefined | ((item: Track | Episode) => void);
  canAddToQueue: boolean;
  minimal?: boolean;
}) {
  if (itemIsAlbum(item))
    return (
      <ResultRow
        minimal={minimal}
        imageUrl={item.images.at(-1)?.url ?? ""}
        name={item.name}
        subtitle={item.artists.map((artist) => artist.name).join(", ")}
        extraInfo={item.release_date}
        duration={
          item.total_tracks.toString() +
          " track" +
          (item.total_tracks > 1 ? "s" : "")
        }
        onClick={() => sendSignal("openPopup", { item })}
      />
    );

  if (itemIsArtist(item))
    return (
      <ResultRow
        minimal={minimal}
        imageUrl={item.images.at(-1)?.url ?? ""}
        name={item.name}
        subtitle={null}
        extraInfo={item.followers.total.toLocaleString()}
        duration={""}
        onClick={() => sendSignal("openPopup", { item })}
      />
    );

  if (itemIsAudiobook(item))
    return (
      <ResultRow
        minimal={minimal}
        imageUrl={item.images.at(-1)?.url ?? ""}
        name={item.name}
        subtitle={item.authors.map((author) => author.name).join(", ")}
        extraInfo={item.description}
        duration={item.total_chapters + " chapters"}
        onClick={() => sendSignal("openPopup", { item })}
      />
    );

  if (itemIsEpisode(item)) {
    let lengthString = new Date(item.duration_ms).toISOString().slice(11, 19);
    if (lengthString.startsWith("00:")) lengthString = lengthString.slice(3, 8);
    return (
      <ResultRow
        minimal={minimal}
        imageUrl={item.images.at(-1)?.url ?? ""}
        name={item.name}
        subtitle={null}
        extraInfo={item.description}
        duration={lengthString}
        onClick={() => sendSignal("openPopup", { item })}
      />
    );
  }

  if (itemIsPlaylist(item))
    return (
      <ResultRow
        minimal={minimal}
        imageUrl={item.images.at(-1)?.url ?? ""}
        name={item.name}
        subtitle={item.description}
        extraInfo={"by " + item.owner.display_name}
        // api does not know that tracks is a thing
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        duration={(
          item as unknown as { tracks: { total: number } }
        ).tracks.total.toString()}
        onClick={() => sendSignal("openPopup", { item })}
      />
    );

  if (itemIsTrack(item)) {
    let lengthString = new Date(item.duration_ms).toISOString().slice(11, 19);
    if (lengthString.startsWith("00:")) lengthString = lengthString.slice(3, 8);
    return (
      <ResultRow
        minimal={minimal}
        imageUrl={item.album.images.at(-1)?.url ?? ""}
        name={item.name}
        subtitle={item.artists.map((artist) => artist.name).join(", ")}
        extraInfo={item.album.name}
        duration={lengthString}
        onClick={
          addToQueue !== undefined && canAddToQueue
            ? () => addToQueue && addToQueue(item)
            : undefined
        }
      />
    );
  }

  if (itemIsShow(item)) {
    return (
      <ResultRow
        minimal={minimal}
        imageUrl={item.images.at(-1)?.url ?? ""}
        name={item.name}
        subtitle={item.description}
        extraInfo={item.publisher}
        duration={item.total_episodes.toString()}
        onClick={() => sendSignal("openPopup", { item })}
      />
    );
  }

  return <div></div>;
}

const ResultRow = ({
  imageUrl,
  name,
  subtitle,
  extraInfo,
  duration,
  onClick,
  minimal,
}: {
  imageUrl: string;
  name: string;
  subtitle: string | null;
  extraInfo: string;
  duration: string;
  onClick?: () => void;
  minimal: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={onClick === undefined}
    className={twMerge(
      "grid min-h-12 w-full max-w-full grid-cols-[40px,1.5fr,1fr,100px] items-center gap-4 rounded hover:bg-zinc-800",
      onClick !== undefined && "active cursor-pointer",
      minimal && "grid-cols-[40px,1fr] text-sm",
    )}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="ml-2 aspect-square size-8 rounded" src={imageUrl} alt="" />

    <div className="grid w-full grid-rows-[auto,auto]">
      <div
        className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-start"
        title={name}
      >
        {name}
      </div>
      {subtitle && (
        <div
          className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-start text-xs text-zinc-400"
          title={subtitle}
        >
          {subtitle}
        </div>
      )}
    </div>

    {!minimal && (
      <>
        <div
          className="w-full overflow-hidden text-ellipsis whitespace-nowrap"
          title={extraInfo}
        >
          {extraInfo}
        </div>

        <div className="w-full">{duration}</div>
      </>
    )}
  </button>
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

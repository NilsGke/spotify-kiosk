"use client";

import { useState, type ReactNode, useMemo } from "react";
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
import { IoIosClose } from "react-icons/io";
import toast from "react-simple-toasts";
import { sendSignal, useSignal } from "~/helpers/signals";
import useKeyboard from "~/hooks/useKeyboard";
import { api } from "~/trpc/react";
import Display from "./Display";
import Album from "./Album";
import Artist from "./Artist";
import type { Market } from "@spotify/web-api-ts-sdk";

export default function Popup({
  code,
  password,
  market,
  addToQueuePermission,
}: {
  code: string;
  password: string;
  market: Market;
  addToQueuePermission: boolean;
}) {
  const [popupOpen, setPopupOpen] = useState(false);
  const [item, setItem] = useState<SearchResult | null>(null);

  const close = () => {
    setPopupOpen(false);
    console.log("close");
    console.trace();
  };
  useKeyboard((key) => key === "Escape" && close());

  useSignal("openPopup", ({ item }) => {
    setPopupOpen(true);
    setItem(item);
  });

  const { mutate: addToQueue } = api.spotify.addToQueue.useMutation({
    onSuccess() {
      sendSignal("updateQueue", { add: [], remove: [] });
    },
    onError() {
      sendSignal("updateQueue", { add: [], remove: [] });
    },
  });

  const content: ReactNode = useMemo(() => {
    if (!popupOpen) return null;

    if (item === null) {
      toast("❌ No content specified. this should not happen :/");
      close();
      return null;
    }

    if (itemIsAlbum(item))
      return (
        <Album
          item={item}
          addToQueue={(item) =>
            addToQueue({
              code,
              password,
              songUri: item.uri,
            })
          }
          addToQueuePermission={addToQueuePermission}
        />
      );

    if (itemIsArtist(item))
      return (
        <Artist
          item={item}
          market={market}
          addToQueue={(item) =>
            addToQueue({
              code,
              password,
              songUri: item.uri,
            })
          }
          addToQueuePermission={addToQueuePermission}
        />
      );

    if (itemIsAudiobook(item)) return "audio book not implement";

    if (itemIsEpisode(item))
      return (
        <Display
          title={item.name}
          imageUrl={item.images[0]?.url}
          subtitle={item.description}
        >
          episode
        </Display>
      );

    if (itemIsPlaylist(item))
      return (
        <Display
          title={item.name}
          imageUrl={item.images[0]?.url}
          subtitle={`${item.description}\nby ${item.owner.display_name}`}
        >
          playlist
        </Display>
      );

    if (itemIsShow(item))
      return (
        <Display
          title={item.name}
          subtitle={item.description}
          imageUrl={item.images[0]?.url}
        >
          show
        </Display>
      );

    if (itemIsTrack(item)) return "track";

    toast("❌ could not use item.type to specify what the content should be");
    return "could not specify content";
  }, [
    addToQueue,
    addToQueuePermission,
    code,
    item,
    market,
    password,
    popupOpen,
  ]);

  if (popupOpen)
    return (
      <div className="absolute left-0 top-0 z-20 size-full overflow-y-scroll rounded-2xl bg-zinc-900 p-2 scrollbar scrollbar-track-transparent scrollbar-thumb-zinc-600 sm:p-4 md:p-6 lg:p-10 xl:p-10">
        <button
          tabIndex={1}
          className="absolute right-2 top-2 size-8 rounded-lg hover:bg-zinc-800 active:bg-zinc-700"
          onClick={close}
        >
          <IoIosClose className="size-full" />
        </button>
        {content}
      </div>
    );

  return null;
}

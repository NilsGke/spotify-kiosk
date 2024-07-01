"use client";

import { signIn } from "next-auth/react";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { env } from "~/env";
import { sendSignal } from "~/helpers/signals";
import { api } from "~/trpc/react";

export default function Heart({ trackId }: { trackId: string }) {
  const {
    data: savedQueryData,
    isInitialLoading,
    refetch,
    error,
  } = api.spotify.hasSavedTrack.useQuery({ trackId }, { retry: false });

  const [saved, setSaved] = useState(false);

  const saveQuery = api.spotify.saveTrack.useMutation({
    onMutate: () => setSaved(true),
    onError: () => {
      setSaved(false);
      sendSignal("updateLikes", null);
    },
    onSuccess: () => {
      void refetch();
      sendSignal("updateLikes", null);
    },
  });
  const removeQuery = api.spotify.removeSavedTrack.useMutation({
    onMutate: () => setSaved(false),
    onError: () => {
      void refetch();
      sendSignal("updateLikes", null);
    },
    onSuccess: () => {
      setSaved(false);
      sendSignal("updateLikes", null);
    },
  });

  // updated saved on new query data
  useEffect(
    () => void (savedQueryData !== undefined && setSaved(savedQueryData)),
    [savedQueryData],
  );

  const pathname = usePathname();

  let heart: ReactNode = null;

  if (error && error.message.includes("UNAUTHORIZED"))
    // not logged in
    heart = (
      <FaRegHeart
        className="size-full cursor-pointer text-zinc-400"
        title="add to your favourites"
        onClick={() =>
          signIn("spotify", {
            callbackUrl: env.NEXT_PUBLIC_APP_URL + pathname,
          })
        }
      />
    );
  else if (isInitialLoading)
    // initial load
    heart = (
      <FaRegHeart
        className="size-full animate-pulse text-zinc-300"
        title="add to your favourites"
      />
    );
  else if (saved)
    // track saved
    heart = (
      <FaHeart
        onClick={() => removeQuery.mutate({ trackId })}
        className="size-full animate-boob-once cursor-pointer text-spotify"
        title="add to your favourites"
      />
    );
  else if (!saved)
    // track not saved
    heart = (
      <FaRegHeart
        onClick={() => saveQuery.mutate({ trackId })}
        className="size-full -animate-boob-once cursor-pointer"
        title="add to your favourites"
      />
    );

  return <div className="size-6">{heart}</div>;
}

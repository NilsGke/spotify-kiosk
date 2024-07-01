import "client-only";
import { useEffect, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { sendSignal } from "~/helpers/signals";
import { api } from "~/trpc/react";

/**
 * setting @param controlled to true will turn off the internal query and make it controlled
 *  state is then set via
 */
export default function ControlledHeart({
  trackId,
  isSaved,
  onLikeChange,
}: {
  trackId: string;
  isSaved: boolean;
  onLikeChange: (event: "add" | "remove") => void;
}) {
  const [saved, setSaved] = useState(isSaved ?? false);

  const saveQuery = api.spotify.saveTrack.useMutation({
    onMutate: () => {
      setSaved(true);
      onLikeChange("add");
    },
    onError: () => {
      setSaved(false);
      sendSignal("updateLikes", null);
    },
    onSuccess: () => {
      setSaved(true);
      sendSignal("updateLikes", null);
    },
  });
  const removeQuery = api.spotify.removeSavedTrack.useMutation({
    onMutate: () => {
      setSaved(false);
      onLikeChange("remove");
    },
    onError: () => {
      setSaved(true);
      sendSignal("updateLikes", null);
    },
    onSuccess: () => {
      setSaved(false);
      sendSignal("updateLikes", null);
    },
  });

  useEffect(() => void (isSaved !== undefined && setSaved(isSaved)), [isSaved]);

  if (saved)
    // track saved
    return (
      <FaHeart
        onClick={() => removeQuery.mutate({ trackId })}
        className="size-full animate-boob-once cursor-pointer text-spotify"
        title="add to your favourites"
      />
    );
  else if (!saved)
    // track not saved
    return (
      <FaRegHeart
        onClick={() => saveQuery.mutate({ trackId })}
        className="size-full -animate-boob-once cursor-pointer"
        title="add to your favourites"
      />
    );

  return null;
}

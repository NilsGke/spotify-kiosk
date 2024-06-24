import type { SpotifySession } from "@prisma/client";
import { IoMdPlayCircle } from "react-icons/io";
import { MdPauseCircle } from "react-icons/md";
import { MdCircle } from "react-icons/md";
import { IoMdSkipForward } from "react-icons/io";
import { IoMdSkipBackward } from "react-icons/io";
import type { PlaybackState } from "@spotify/web-api-ts-sdk";
import { twMerge } from "tailwind-merge";
import { api } from "~/trpc/react";
import toast from "react-simple-toasts";

export default function PlayControls({
  session,
  playbackState,
  refreshPlayback,
  isAdmin,
}: {
  session: SpotifySession | undefined;
  playbackState: PlaybackState | undefined;
  refreshPlayback: () => void;
  isAdmin: boolean;
}) {
  const playPauseMutation = api.spotify.togglePlayPause.useMutation({
    onSuccess: refreshPlayback,
    onError: (error) => toast(error.message),
  });

  const skipForwardMutation = api.spotify.skipForward.useMutation({
    onSuccess: refreshPlayback,
    onError: (error) => toast(error.message),
  });

  const skipBackwardMutation = api.spotify.skipBackward.useMutation({
    onSuccess: refreshPlayback,
    onError: (error) => toast(error.message),
  });

  const PlayIcon =
    playbackState === undefined
      ? MdCircle
      : playbackState?.is_playing
        ? MdPauseCircle
        : IoMdPlayCircle;

  return (
    <div className="grid h-full w-full grid-cols-3 content-center justify-items-center">
      <div className="grid w-full grid-cols-1 grid-rows-2 gap-2 text-xs">
        <div
          className={twMerge(
            "",
            session === undefined && "h-4 w-40 animate-pulse bg-zinc-800",
          )}
        >
          {session?.name}
        </div>
        <div
          className={twMerge(
            "",
            session === undefined && "h-4 w-40 animate-pulse bg-zinc-800",
          )}
        >
          Session Code: {session?.code}
        </div>
      </div>
      <div
        className={twMerge(
          "grid w-[165px] grid-cols-3 justify-items-center",
          playbackState === undefined && "animate-pulse",
        )}
      >
        <button
          onClick={() =>
            session &&
            skipBackwardMutation.mutate({
              code: session.code,
              password: session.password,
            })
          }
          className="brightness-90 hover:brightness-100 active:brightness-90"
        >
          <IoMdSkipBackward className="aspect-square h-6 w-6" />
        </button>

        <button
          disabled={
            session && session.permission_playPause === false && !isAdmin
          }
          onClick={() =>
            session &&
            playPauseMutation.mutate({
              code: session.code,
              password: session.password,
            })
          }
          className={twMerge(
            session === undefined || session.permission_playPause || isAdmin
              ? "hover:brightness-90 active:brightness-75"
              : "cursor-default text-zinc-500",
          )}
        >
          <PlayIcon className="aspect-square h-10 w-10" />
        </button>

        <button
          onClick={() =>
            session &&
            skipForwardMutation.mutate({
              code: session.code,
              password: session.password,
            })
          }
          className="brightness-90 hover:brightness-100 active:brightness-90"
        >
          <IoMdSkipForward className="aspect-square h-6 w-6" />
        </button>
      </div>

      <div className="flex w-full items-center justify-end text-xs">
        listening on {playbackState?.device.name}
      </div>
    </div>
  );
}

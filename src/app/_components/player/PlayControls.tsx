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
import DeviceList from "./DeviceList";
import { useState } from "react";
import useOutsideClick from "~/hooks/useOutsideClick";
import { spotifyDeviceTypes } from "~/types/deviceTypes";
import QRCode from "./QRCode";

export default function PlayControls({
  session,
  playbackState,
  refreshPlayback,
  isAdmin,
}: {
  session: SpotifySession | undefined;
  playbackState: PlaybackState | null | undefined;
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

  // device picker
  const [devicesOpen, setDevicesOpen] = useState(false);
  const ref = useOutsideClick(() => setDevicesOpen(false), devicesOpen);

  const deviceInfo =
    playbackState !== null && playbackState !== undefined
      ? spotifyDeviceTypes.find(
          (device) => device.type === playbackState?.device.type.toLowerCase(),
        )
      : null;

  const PlayIcon =
    playbackState === undefined
      ? MdCircle
      : playbackState?.is_playing
        ? MdPauseCircle
        : IoMdPlayCircle;

  return (
    <div className="grid h-full w-full grid-cols-3 content-stretch  justify-items-center">
      <div className="grid max-h-full grid-cols-[1fr_auto] grid-rows-[100%] items-center gap-3 justify-self-start">
        <QRCode session={session} />
        <div className="grid w-full grid-cols-1 grid-rows-2 items-center gap-2 text-xs">
          <div
            className={twMerge(
              "h-4",
              session === undefined && "h-4 w-40 animate-pulse bg-zinc-800",
            )}
          >
            {session?.name}
          </div>
          <div
            className={twMerge(
              "h-4",
              session === undefined && "h-4 w-40 animate-pulse bg-zinc-800",
            )}
          >
            Session Code: {session?.code}
          </div>
        </div>
      </div>
      <div
        className={twMerge(
          "grid w-[165px] grid-cols-3 justify-items-center",
          playbackState === undefined && "animate-pulse",
        )}
      >
        <button
          aria-label="skip song backwards"
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
          aria-label={`play/pause (song is currently ${
            playbackState?.is_playing ? "playing" : "paused"
          })`}
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
          aria-label="skip song"
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

      <div className="relative flex w-full items-center justify-end text-xs">
        <button
          disabled={!isAdmin}
          onClick={() => setDevicesOpen((prev) => !prev)}
          className={twMerge(
            "flex items-center gap-2 rounded bg-zinc-900 px-2 py-1 outline outline-zinc-800",
            isAdmin && "transition-colors hover:bg-zinc-800",
          )}
        >
          {playbackState?.device.name} {deviceInfo && <deviceInfo.icon />}
        </button>
        {session && devicesOpen && (
          <DeviceList
            ref={ref}
            session={session}
            className="absolute bottom-10 min-w-48 outline outline-zinc-700"
          />
        )}
      </div>
    </div>
  );
}

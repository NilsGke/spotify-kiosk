import type { SpotifySession } from "@prisma/client";
import { api } from "~/trpc/react";
import { MdOutlineSpeaker } from "react-icons/md";
import { IoMdRefresh } from "react-icons/io";
import { twMerge } from "tailwind-merge";
import { spotifyDeviceTypes } from "~/types/deviceTypes";
import toast from "react-simple-toasts";
import { forwardRef, useEffect, useRef, useState } from "react";
import autoAnimate from "@formkit/auto-animate";
import { sendSignal } from "~/helpers/signals";

export default forwardRef<
  HTMLDivElement,
  { session: SpotifySession; className?: string }
>(function DeviceList({ session, className }, forwardedRef) {
  const [startingPlaybackId, setStartingPlaybackId] = useState<string | null>(
    null,
  );

  const {
    data: deviceList,
    refetch: refetchDeviceList,
    isFetching: isFetchingDeviceList,
  } = api.spotify.getAvalibleDevices.useQuery(
    { code: session.code, password: session.password },
    { refetchInterval: 5000 },
  );

  const { mutate: startPlayback, isLoading: isStartingPlayback } =
    api.spotify.startPlayback.useMutation({
      onError(error) {
        toast("could not start Playback");
        console.error(error);
      },
      onSuccess: (res, data) =>
        setTimeout(() => {
          void refetchDeviceList(), 500; // need to wait for a bit, becaues spotify api does not update instantly
          const device = deviceList?.find(
            (d) => d.id !== null && d.id === data.deviceId,
          );
          if (device !== undefined)
            sendSignal("updatePlaybackState", { device });
        }),
      onMutate: ({ deviceId }) => setStartingPlaybackId(deviceId),
    });

  const fallbackRef = useRef<HTMLDivElement>(null);
  const ref = (forwardedRef as typeof fallbackRef) ?? fallbackRef;

  useEffect(() => {
    ref.current && autoAnimate(ref.current);
  }, [ref]);

  return (
    <div
      className={twMerge(
        "flex h-min max-w-52 flex-col gap-2 rounded-lg bg-zinc-900 p-2",
        className,
      )}
      ref={ref}
    >
      <div className="flex justify-between">
        Your devices
        <button
          onClick={() => refetchDeviceList()}
          disabled={isFetchingDeviceList}
          title="refresh devices"
        >
          <IoMdRefresh
            className={twMerge("", isFetchingDeviceList && "animate-spin")}
          />
        </button>
      </div>
      {deviceList?.map((device) => {
        const { icon: Icon, description } = spotifyDeviceTypes.find(
          (d) => d.type === device.type,
        ) ?? {
          icon: MdOutlineSpeaker,
          description: "unknown device type",
        };
        return (
          <button
            disabled={device.is_restricted}
            key={device.id ?? device.name}
            onClick={() => {
              if (device.id === null) return toast("device has no identifier");
              startPlayback({
                code: session.code,
                password: session.password,
                deviceId: device.id,
              });
            }}
            className={twMerge(
              "grid grid-cols-[1.25rem_auto_1.25rem] items-center gap-3 rounded bg-zinc-800 p-2 hover:bg-zinc-700",
              isStartingPlayback &&
                startingPlaybackId === device.id &&
                "animate-pulse",
              device.is_active && "outline outline-spotify",
              device.is_restricted && "opacity-50",
            )}
          >
            <div title={description}>
              <Icon className="aspect-square size-5" />
            </div>

            <div title={description} className="truncate">
              {device.name}
            </div>
          </button>
        );
      })}
    </div>
  );
});

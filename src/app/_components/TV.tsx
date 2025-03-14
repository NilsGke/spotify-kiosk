"use client";

import type { SpotifySession } from "@prisma/client";
import type { PlaybackState } from "@spotify/web-api-ts-sdk";
import { useEffect, useMemo, useRef, useState } from "react";
import { itemIsTrack } from "~/helpers/itemTypeguards";
import { api } from "~/trpc/react";
import { prominent } from "color.js";
import { env } from "~/env";
import { twMerge } from "tailwind-merge";
import getColorBrightness from "~/helpers/colorBrightness";
import getItemImage from "~/helpers/getItemImage";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Link from "next/link";
import { FiEye, FiEyeOff } from "react-icons/fi";
import QRCode from "./player/QRCode";

type HEX = `#${string}`;
const mouseMoveTime = 1000;

export default function TV({
  spotifySession,
  playback: initialPlayback,
}: {
  spotifySession: SpotifySession;
  playback: PlaybackState | undefined;
}) {
  const { data: playback, refetch: refetchPlayback } =
    api.spotify.getPlayback.useQuery(
      {
        code: spotifySession.code,
        password: spotifySession.password,
      },
      {
        initialData: initialPlayback,
        refetchInterval: 1000 * 10,
      },
    );

  const { data: queue, refetch: refetchQueue } = api.spotify.getQueue.useQuery(
    {
      code: spotifySession.code,
      password: spotifySession.password,
    },
    {
      refetchInterval: 30000,
    },
  );

  const item = playback?.item;
  const image = useMemo(() => item && getItemImage(item), [item]);
  const artist =
    item &&
    (itemIsTrack(item)
      ? item.artists.map((artist) => artist.name).join(", ")
      : item.show.name);

  // refresh playback and queue on song end
  useEffect(() => {
    if (!playback?.item) return;

    if (!itemIsTrack(playback.item)) return;
    const songEnd = () => {
      void refetchPlayback();
      void refetchQueue();
    };

    const songEndTimer = setTimeout(
      songEnd,
      playback.item.duration_ms - playback.progress_ms,
    );

    return () => clearTimeout(songEndTimer);
  }, [playback, refetchPlayback, refetchQueue]);

  // extract colors from image
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [backgroundColors, setBackgroundColors] = useState<HEX[] | null>(null);
  const [textColor, setTextColor] = useState<"black" | "white" | null>(null);
  useEffect(() => {
    if (image === undefined || imageRef.current === null) {
      setBackgroundColors(null);
      setTextColor(null);
    } else {
      void prominent(imageRef.current, { amount: 3, format: "hex" }).then(
        (value) => {
          setBackgroundColors(value as HEX[]);
          const centerBrightness = getColorBrightness(value[1] as HEX);
          if (centerBrightness !== undefined)
            setTextColor(centerBrightness > 255 / 2 ? "black" : "white");
        },
      );
    }
  }, [image]);

  // hide mouse on idle
  const [mouseMoving, setMouseMoving] = useState(false);
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    const mouseMove = () => {
      clearTimeout(timer);
      setMouseMoving(true);
      timer = setTimeout(() => setMouseMoving(false), mouseMoveTime);
    };

    document.addEventListener("mousemove", mouseMove);

    return () => {
      document.removeEventListener("mousemove", mouseMove);
    };
  }, []);

  const [queueRef] = useAutoAnimate();

  const [showQrCode, setShowQrCode] = useState(false);

  return (
    <div
      className={twMerge(
        "absolute left-0 top-0 flex h-screen w-screen items-center justify-center bg-orange-400 bg-cover bg-center backdrop-blur-md backdrop-brightness-50",
        !mouseMoving && "cursor-none",
      )}
      style={{
        backgroundImage: backgroundColors
          ? `linear-gradient(295deg, ${backgroundColors
              .map(
                (color, i) =>
                  `${color} ${(100 / (backgroundColors.length - 1)) * i}%`,
              )
              .join(",\n")})`
          : `linear-gradient(
              295deg,
              hsl(240deg 0% 20%) 0%,
              hsl(289deg 0% 21%) 11%,
              hsl(55deg 0% 50%) 100%
            )`,
      }}
    >
      {/* noise background */}
      <div
        className={twMerge(
          "absolute left-0 top-0 h-screen w-screen opacity-[40%]",
          textColor === "black" && "invert",
        )}
        style={{
          backgroundImage: `url(${env.NEXT_PUBLIC_APP_URL}/noise.png)`,
          backgroundSize: "200px",
        }}
      ></div>

      {/* back button */}
      <Link
        className={twMerge(
          "absolute left-5 top-5 rounded p-2 backdrop-blur-md backdrop-brightness-95 transition hover:backdrop-brightness-90",
          !mouseMoving && "opacity-0",
        )}
        style={{
          color: textColor ?? "white",
        }}
        href={`${env.NEXT_PUBLIC_APP_URL}/session/${spotifySession.code}`}
      >
        &lt;- back to session
      </Link>

      {/* QR button */}
      <div
        className={twMerge(
          "group absolute right-5 top-5 size-32 rounded backdrop-blur-md backdrop-brightness-95 duration-200",
          !mouseMoving && !showQrCode && "opacity-0",
        )}
      >
        <button
          onClick={() => setShowQrCode((prev) => !prev)}
          className="relative size-full"
        >
          <QRCode
            className={twMerge(
              "size-32 transition duration-200 group-hover:blur-sm group-hover:brightness-75",
              mouseMoving && "blur-sm brightness-75",
              mouseMoving && showQrCode && "blur-none brightness-100",
              !showQrCode && "opacity-50 blur-sm",
            )}
            margin={0}
            color={{
              dark:
                textColor !== null
                  ? textColor === "white"
                    ? "#fff"
                    : "#000"
                  : "#000",
              light: "#0000",
            }}
            session={spotifySession}
          />
          <div
            className={twMerge(
              "absolute top-0 grid size-full items-center justify-center opacity-0 transition duration-200 group-hover:opacity-100",
              !showQrCode && mouseMoving && "opacity-100",
            )}
          >
            {showQrCode ? (
              <FiEye
                className="size-10"
                style={{ color: textColor ?? "white" }}
              />
            ) : (
              <FiEyeOff
                className="size-10"
                style={{ color: textColor ?? "white" }}
              />
            )}
          </div>
        </button>
      </div>
      {/* QR overlay */}
      {/* {showQrCode && (
        <div
          className={twMerge(
            "absolute right-5 top-5 overflow-hidden rounded transition-all",
            mouseMoving && "top-20",
          )}
        >
          <QRCode
            className="size-32"
            margin={0}
            color={{
              dark:
                textColor !== null
                  ? textColor === "white"
                    ? "#fff"
                    : "#000"
                  : "black",
              light: "#0000",
            }}
            session={spotifySession}
          />
        </div>
      )} */}

      {/* content */}
      <div className="z-20 flex flex-col items-center justify-center gap-6">
        <div className="relative aspect-square size-60 md:size-80">
          {/* bloom image */}
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imageRef}
              className="absolute size-full rounded-md blur-2xl"
              src={image.url}
              alt="album / episode art"
            />
          )}
          {/* album image */}
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="absolute top-0 z-10 size-full rounded-xl "
              src={image.url}
              alt="album / episode art"
            />
          )}
        </div>
        <h2
          className="text-5xl font-semibold"
          style={{
            color: textColor ?? "white",
          }}
        >
          {playback?.item.name}
        </h2>
        <h3
          className="text-lg opacity-80"
          style={{ color: textColor ?? "white" }}
        >
          {artist}
        </h3>
      </div>

      {/* Queue bar */}
      <div className="absolute bottom-0 w-full overflow-x-hidden p-3">
        <div className="w-[10000%]" ref={queueRef}>
          {queue?.queue.map((item) => (
            <div
              key={item.id}
              className={twMerge(
                "mr-4 inline-block rounded-md p-1 backdrop-blur-3xl",
                textColor === "white"
                  ? "backdrop-brightness-125"
                  : "backdrop-brightness-95",
              )}
            >
              <div
                className=" flex items-center gap-3 transition-colors"
                style={{ color: textColor ?? "white" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getItemImage(item, 2).url}
                  alt="album / episode image"
                  className="aspect-square h-6 rounded"
                />
                {item.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

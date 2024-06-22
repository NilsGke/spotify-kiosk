"use client";

import type { SpotifySession } from "@prisma/client";
import type { PlaybackState } from "@spotify/web-api-ts-sdk";
import { useEffect, useRef, useState } from "react";
import { itemIsTrack } from "~/helpers/itemTypeguards";
import { api } from "~/trpc/react";
import { prominent } from "color.js";
import { env } from "~/env";
import { twMerge } from "tailwind-merge";
import getColorBrightness from "~/helpers/colorBrightness";

type HEX = `#${string}`;

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

  const item = playback?.item;
  const image =
    item && (itemIsTrack(item) ? item.album.images.at(0) : item.images.at(0));
  const artist =
    item &&
    (itemIsTrack(item)
      ? item.artists.map((artist) => artist.name).join(", ")
      : item.show.name);
  console.log(artist);

  // refresh playback on song end
  useEffect(() => {
    if (!playback?.item) return;

    if (!itemIsTrack(playback.item)) return;
    const songEnd = () => void refetchPlayback();

    const songEndTimer = setTimeout(
      songEnd,
      playback.item.duration_ms - playback.progress_ms,
    );

    return () => clearTimeout(songEndTimer);
  }, [playback, refetchPlayback]);

  // extract colors from image
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [backgroundColors, setBackgroundColors] = useState<HEX[] | null>(null);
  const [textColor, setTextColor] = useState<string | null>(null);
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
  const [hideMouse, setHideMouse] = useState(false);
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    const mouseMove = () => {
      clearTimeout(timer);
      setHideMouse(false);
      timer = setTimeout(() => setHideMouse(true), 2000);
    };

    document.addEventListener("mousemove", mouseMove);

    return () => {
      document.removeEventListener("mousemove", mouseMove);
    };
  }, []);

  return (
    <div
      className={twMerge(
        "absolute left-0 top-0 flex h-screen w-screen items-center justify-center bg-orange-400 bg-cover bg-center backdrop-blur-md backdrop-brightness-50",
        hideMouse && "cursor-none",
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
              hsl(240deg 100% 20%) 0%,
              hsl(289deg 100% 21%) 11%,
              hsl(55deg 100% 50%) 100%
            );`,
      }}
    >
      {/* noise background */}
      <div
        className="absolute left-0 top-0 h-screen w-screen opacity-[40%]"
        style={{
          backgroundImage: `url(${env.NEXT_PUBLIC_APP_URL}/noise.png)`,
          backgroundSize: "200px",
        }}
      ></div>

      {/* content */}
      <div className="z-20 flex flex-col items-center justify-center gap-6">
        <div className="relative aspect-square size-60 md:size-80">
          {/* bloom image */}
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imageRef}
              className="absolute z-10 size-full rounded-md"
              src={image.url}
              alt="album / episode art"
            />
          )}
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="absolute top-0 size-full rounded-md blur-2xl"
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
    </div>
  );
}

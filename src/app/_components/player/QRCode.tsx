import type { SpotifySession } from "@prisma/client";
import { type QRCodeRenderersOptions, toCanvas } from "qrcode";
import { useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { env } from "~/env";

export default function QRCode({
  session,
  color,
  margin,
  className,
}: {
  session: SpotifySession | undefined;
  color?: QRCodeRenderersOptions["color"];
  margin?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (
      session === undefined ||
      canvasRef.current === null ||
      containerRef.current === null
    )
      return;
    const size = containerRef.current.clientHeight;
    void toCanvas(
      canvasRef.current,
      `${env.NEXT_PUBLIC_APP_URL}/s/${session.code}`,
      {
        margin: margin ?? 1,
        color: color ?? { dark: "#000", light: "#ddd" },
        width: size,
      },
    );
  }, [session, color, margin]);

  return (
    <div
      ref={containerRef}
      className={twMerge(
        "aspect-square size-full overflow-hidden rounded-sm",
        className,
      )}
    >
      <canvas ref={canvasRef} className="aspect-square" height={1} width={1} />
    </div>
  );
}

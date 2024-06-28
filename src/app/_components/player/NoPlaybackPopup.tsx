import type { SpotifySession } from "@prisma/client";
import DeviceList from "./DeviceList";

export default function NoPlaybackPopup({
  admin = false,
  session,
}: {
  admin: boolean;
  session: SpotifySession;
}) {
  return (
    <div className="absolute left-0 top-0 z-20 grid h-full w-full items-center justify-center backdrop-blur-sm backdrop-brightness-75">
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-zinc-900 p-6 outline outline-zinc-700">
        <h2 className="text-xl">
          {admin ? "You are" : "The host is"} not playing anything on Spotify
        </h2>
        {admin && <DeviceList session={session} />}
      </div>
    </div>
  );
}

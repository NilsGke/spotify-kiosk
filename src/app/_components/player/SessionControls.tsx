"use client";

import DeleteSessionButton from "../DeleteSessionButton";
import type { SpotifySession } from "@prisma/client";
import SessionSettingsPopup from "./SessionSettingsPopup";
import Link from "next/link";
import { IoMdTv } from "react-icons/io";

export default function SessionControls({
  spotifySession,
}: {
  spotifySession: SpotifySession;
}) {
  return (
    <div className="grid h-full grid-flow-col content-center justify-center gap-3">
      <DeleteSessionButton
        sessionCode={spotifySession.code}
        sessionName={spotifySession.name}
      />
      <SessionSettingsPopup spotifySession={spotifySession} />
      <Link
        href={window.location.href + "/tv"}
        className="rounded-md border border-zinc-500 p-2"
      >
        <IoMdTv />
      </Link>
    </div>
  );
}

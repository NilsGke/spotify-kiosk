"use client";

import DeleteSessionButton from "../DeleteSessionButton";
import type { SpotifySession } from "@prisma/client";
import SessionSettingsPopup from "./SessionSettingsPopup";

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
    </div>
  );
}

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
    <>
      <DeleteSessionButton
        sessionCode={spotifySession.code}
        sessionName={spotifySession.name}
      />
      <SessionSettingsPopup spotifySession={spotifySession} />
    </>
  );
}

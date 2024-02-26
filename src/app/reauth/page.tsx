"use client";

import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { useEffect, useState } from "react";
import { env } from "~/env";
import { scopes } from "~/server/scopes";

export default function ReauthPage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    void SpotifyApi.performUserAuthorization(
      env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
      env.NEXT_PUBLIC_APP_URL + "/reauth",
      scopes,
      env.NEXT_PUBLIC_APP_URL + "/api/reauth",
    ).then(() => {
      setDone(true);
      window.close();
    });
  }, []);

  if (done)
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-black"></div>
    );

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-black">
      <h1 className="text-2xl">Reauthenticating...</h1>
      you might get forwarded to the spotify page
    </div>
  );
}

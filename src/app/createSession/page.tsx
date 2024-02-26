import { getSpotifyApi } from "~/server/spotifyApi";
import LoginButton from "../_components/LoginButton";
import SessionGenerator from "./SessionGenerator";
import { getServerAuthSession } from "~/server/auth";
import type { Market } from "@spotify/web-api-ts-sdk";
import ReauthPopup from "../_components/player/ReauthPopup";
import type { ReactNode } from "react";
import checkExpiration from "~/server/checkExpiration";

export default async function page() {
  const session = await getServerAuthSession();

  if (session === null)
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-6">
        <h1>You need to log in to create a session</h1>
        <LoginButton session={session} className="rounded-md bg-zinc-600" />
      </div>
    );

  const { spotifyApi, error: spotifyApiError } = await getSpotifyApi(
    session.user.id,
  );

  if (spotifyApiError !== null) return error(spotifyApiError);

  const { expired, error: expirationError } = await checkExpiration(
    session.user.id,
  );
  if (expirationError) return error(expirationError as string);
  if (expired) {
    return error(
      <>
        <ReauthPopup />
        you need to reauthenticate yourself
      </>,
    );
  }

  const { markets } = await spotifyApi.markets.getAvailableMarkets();

  if (markets.length === 0)
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-6">
        There are no markets avalible
      </div>
    );

  return (
    <div className="flex h-full w-full items-center justify-center">
      <SessionGenerator markets={markets as Market[]} />
    </div>
  );
}

function error(message: ReactNode) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6">
      <h2>Error</h2>
      <pre>{message}</pre>
    </div>
  );
}

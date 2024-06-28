import type { User } from "next-auth";
import { getSpotifyApi } from "./spotifyApi";
import type { RefreshToken } from "./api/routers/spotify";
import { env } from "~/env";
import { db } from "./db";
import { updateAccesToken } from "~/helpers/updateAccesToken";
import sharedReauth from "~/helpers/sharedReauth";

export default async function checkExpiration(userId: User["id"]) {
  const { error, spotifyApi } = await getSpotifyApi(userId);
  if (error !== null) throw Error(error);
  try {
    await spotifyApi.player.getPlaybackState();
  } catch (error) {
    try {
      await sharedReauth(userId);
    } catch (error) {
      return { expired: true, error: error };
    }
  }

  return { expired: false, error: null };
}

/** generates new token and saves it in database */
export async function refreshToken(userId: User["id"]) {
  console.log(`refreshToken triggered with uid: ${userId}`);
  const newToken = await getNewToken(userId);
  await updateAccesToken(userId, newToken);
  return newToken;
}

/** fetches token from spotify */
export async function getNewToken(userId: string) {
  console.log(`getNewToken triggered with uid: ${userId}`);
  const accountData = await db.account.findFirst({
    where: { userId },
  });

  if (accountData === null) throw Error("user not found");
  if (accountData.refresh_token === null) throw Error("refresh token is null");
  if (accountData.token_type === null) throw Error("token type is null");

  const encodedCredentials = Buffer.from(
    `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");
  const authorizationHeader = `Basic ${encodedCredentials}`;

  const refreshOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: authorizationHeader,
    },
    body: `grant_type=refresh_token&refresh_token=${accountData.refresh_token}`,
  };

  const res = await fetch(
    "https://accounts.spotify.com/api/token",
    refreshOptions,
  );
  if (!res.ok) throw Error(`Token refresh failed with status: ${res.status}`);

  const newToken = (await res.json()) as RefreshToken;

  return newToken;
}

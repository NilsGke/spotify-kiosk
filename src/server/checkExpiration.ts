import type { User } from "next-auth";
import { getSpotifyApi } from "./spotifyApi";
import type { RefreshToken } from "./api/routers/spotify";
import { env } from "~/env";
import { db } from "./db";
import { updateAccesToken } from "~/helpers/updateAccesToken";

export default async function checkExpiration(userId: User["id"]) {
  const { error, spotifyApi } = await getSpotifyApi(userId);
  if (error !== null) throw Error(error);
  try {
    await spotifyApi.player.getPlaybackState();
  } catch (error) {
    try {
      const newToken = await refreshToken(userId);
      console.log(
        `\x1b[33m new token: ${JSON.stringify(newToken, null, "  ")} \x1b[33m`,
      );
      await updateAccesToken(userId, newToken);
    } catch (error) {
      return { expired: true, error: error };
    }
  }

  return { expired: false, error: null };
}

export async function refreshToken(userId: string) {
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

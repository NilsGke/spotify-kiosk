import { type AccessToken, SpotifyApi } from "@spotify/web-api-ts-sdk";
import { env } from "~/env";
import { db } from "~/server/db";

/**
 *
 * @param userId userid of the user in the db
 */

export async function getSpotifyApi(userId: string) {
  const data = await db.account.findFirst({
    where: { userId },
  });

  if (data === null) return { error: "user not found", spotifyApi: null };
  if (data.access_token === null)
    return { error: "no access token", spotifyApi: null };
  if (data.expires_at === null)
    return { error: "expires at is null", spotifyApi: null };
  if (data.refresh_token === null)
    return { error: "refresh token is null", spotifyApi: null };
  if (data.token_type === null)
    return { error: "token type is null", spotifyApi: null };

  const accessToken: AccessToken = {
    access_token: data.access_token,
    expires_in: Date.now() - data.expires_at,
    refresh_token: data.refresh_token,
    token_type: data.token_type,
  };

  return {
    spotifyApi: SpotifyApi.withAccessToken(env.SPOTIFY_CLIENT_ID, accessToken),
    error: null,
  };
}

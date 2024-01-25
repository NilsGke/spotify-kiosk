import { type AccessToken, SpotifyApi } from "@spotify/web-api-ts-sdk";
import { z } from "zod";
import { env } from "~/env";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { spotifySessionCodeZod, spotifySessionPasswordZod } from "./session";

export const spotifyRouter = createTRPCRouter({
  test: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.account.findFirst({
      where: { id: ctx.session.user.id },
    });
  }),

  getPlayback: publicProcedure
    .input(
      z.object({
        code: spotifySessionCodeZod,
        password: spotifySessionPasswordZod,
      }),
    )
    .query(async ({ ctx, input }) => {
      const spotifySession = await ctx.db.spotifySession.findFirst({
        where: { code: input.code },
      });

      if (spotifySession === null)
        throw Error(`session (${input.code}) not found`);
      if (spotifySession.password !== input.password)
        throw Error("incorrect session password");

      const { error, spotifyApi } = await getSpotifyApi(spotifySession.adminId);
      if (error !== null) throw Error(error);

      return await spotifyApi.player.getPlaybackState();
    }),

  togglePlayPause: protectedProcedure.mutation(async ({ ctx }) => {
    const { spotifyApi, error } = await getSpotifyApi(ctx.session.user.id);
    if (error !== null)
      throw Error(`could not get spotify api. Error: ${error}`);

    const playbackState = await spotifyApi.player.getPlaybackState();
    const deviceId = playbackState.device.id;

    if (deviceId === null)
      throw Error("device id is null. Maybe its not playing?");

    await spotifyApi.player.pausePlayback(deviceId);
  }),
});

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

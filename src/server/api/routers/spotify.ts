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
import type { SpotifySession } from "@prisma/client";
import type { Session } from "next-auth";
import type { SessionPermissions } from "~/app/_components/SessionSettings";

const defaultSessionZodInput = z.object({
  code: spotifySessionCodeZod,
  password: spotifySessionPasswordZod,
});

export const spotifyRouter = createTRPCRouter({
  test: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.account.findFirst({
      where: { id: ctx.session.user.id },
    });
  }),

  getPlayback: publicProcedure
    .input(defaultSessionZodInput)
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

      const pbState = await spotifyApi.player.getPlaybackState();
      if (pbState.item === null) {
        // try to get item via queue
        const episode = (await spotifyApi.player.getUsersQueue())
          .currently_playing;
        if (episode !== null) pbState.item = episode;
      }

      return pbState;
    }),

  getQueue: publicProcedure
    .input(defaultSessionZodInput)
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

      return await spotifyApi.player.getUsersQueue();
    }),

  togglePlayPause: publicProcedure
    .input(defaultSessionZodInput)
    .mutation(async ({ ctx, input }) => {
      const spotifySession = await getSpotifySession(ctx.db, input);
      checkPermission(spotifySession, ctx.session, "permission_playPause");

      const { spotifyApi, error } = await getSpotifyApi(spotifySession.adminId);
      if (error !== null)
        throw Error(`could not get spotify api. Error: ${error}`);

      const playbackState = await spotifyApi.player.getPlaybackState();
      const deviceId = playbackState.device.id;

      if (deviceId === null)
        throw Error("device id is null. Maybe its not playing?");

      if (playbackState.is_playing)
        await spotifyApi.player.pausePlayback(deviceId);
      else await spotifyApi.player.startResumePlayback(deviceId);
    }),

  skipForward: publicProcedure
    .input(defaultSessionZodInput)
    .mutation(async ({ ctx, input }) => {
      const spotifySession = await getSpotifySession(ctx.db, input);
      checkPermission(spotifySession, ctx.session, "permission_playPause");

      const { spotifyApi, error } = await getSpotifyApi(spotifySession.adminId);
      if (error !== null)
        throw Error(`could not get spotify api. Error: ${error}`);

      const playbackState = await spotifyApi.player.getPlaybackState();
      const deviceId = playbackState.device.id;

      if (deviceId === null)
        throw Error("device id is null. Maybe its not playing?");

      await spotifyApi.player.skipToNext(deviceId);
    }),

  skipBackward: publicProcedure
    .input(defaultSessionZodInput)
    .mutation(async ({ ctx, input }) => {
      const spotifySession = await getSpotifySession(ctx.db, input);
      checkPermission(spotifySession, ctx.session, "permission_playPause");

      const { spotifyApi, error } = await getSpotifyApi(spotifySession.adminId);
      if (error !== null)
        throw Error(`could not get spotify api. Error: ${error}`);

      const playbackState = await spotifyApi.player.getPlaybackState();
      const deviceId = playbackState.device.id;

      if (deviceId === null)
        throw Error("device id is null. Maybe its not playing?");

      await spotifyApi.player.skipToPrevious(deviceId);
    }),
});

function checkPermission(
  spotifySession: SpotifySession,
  session: Session | null,
  permissionName: keyof SessionPermissions,
) {
  if (
    spotifySession.adminId !== session?.user.id &&
    spotifySession[permissionName] === false
  )
    throw Error("session permission does not allow you to toggle play/pause");
}

async function getSpotifySession(
  database: typeof db,
  creds: { code: string; password: string },
) {
  const spotifySession = await database.spotifySession.findFirst({
    where: { ...creds },
  });
  if (spotifySession === null)
    throw Error(
      "could not get spotify session while trying to toggle play/pause",
    );
  return spotifySession;
}

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

export type RefreshToken = Pick<
  AccessToken,
  "access_token" | "expires_in" | "token_type"
> & { scope: string };

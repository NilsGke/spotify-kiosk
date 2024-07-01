import "server-only";
import {
  type AccessToken,
  SpotifyApi,
  type Market,
  type PlaybackState,
  type MaxInt,
} from "@spotify/web-api-ts-sdk";
import { z } from "zod";
import { env } from "~/env";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { type db } from "~/server/db";
import { spotifySessionCodeZod, spotifySessionPasswordZod } from "./session";
import type { SpotifySession, User } from "@prisma/client";
import type { Session } from "next-auth";
import { itemTypes } from "../../../types/itemTypes";
import type { SessionPermissions } from "~/types/permissionTypes";
import spotifyMarkets from "~/helpers/spotifyMarkets";
import { api } from "~/trpc/server";
import { getSpotifyApi } from "../../spotifyApi";
import checkExpiration from "~/server/token";
import type SpotifyDeviceType from "~/types/deviceTypes";

const defaultSessionZodInput = z.object({
  code: spotifySessionCodeZod,
  password: spotifySessionPasswordZod,
});

// ROUTER
export const spotifyRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        searchTerm: z.string().min(1),
        types: z.array(z.enum(itemTypes)),
        page: z.number().min(0),
      }),
    )
    .query(async ({ input }) => {
      const spotifyApi = SpotifyApi.withClientCredentials(
        env.SPOTIFY_CLIENT_ID,
        env.SPOTIFY_CLIENT_SECRET,
      );

      const limit = 20;
      const results = await spotifyApi.search<typeof input.types>(
        input.searchTerm,
        input.types,
        "DE",
        limit,
        limit * input.page,
      );

      return results;
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
      const pbState = await spotifyApi.player
        .getPlaybackState()
        .catch(
          reauthCatcherFactory(spotifySession.adminId, (spotifyApi) =>
            spotifyApi.player.getPlaybackState(),
          ),
        );

      return pbState as PlaybackState | null;
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

      return await spotifyApi.player
        .getUsersQueue()
        .catch(
          reauthCatcherFactory(spotifySession.adminId, (spotifyApi) =>
            spotifyApi.player.getUsersQueue(),
          ),
        );
    }),

  getHistory: publicProcedure
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

      return await spotifyApi.player
        .getRecentlyPlayedTracks(10)
        .catch(
          reauthCatcherFactory(spotifySession.adminId, (spotifyApi) =>
            spotifyApi.player.getRecentlyPlayedTracks(10),
          ),
        );
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

  skipQueue: publicProcedure
    .input(defaultSessionZodInput.merge(z.object({ uriToSkipTo: z.string() })))
    .mutation(async ({ ctx, input }) => {
      const spotifySession = await getSpotifySession(ctx.db, input);
      checkPermission(spotifySession, ctx.session, "permission_skipQueue");

      const { spotifyApi, error } = await getSpotifyApi(spotifySession.adminId);
      if (error !== null)
        throw Error(`could not get spotify api. Error: ${error}`);

      const {
        device: { id: deviceId },
      } = await spotifyApi.player.getPlaybackState();
      if (deviceId === null) throw Error("could not find a playing device");

      const queue = await spotifyApi.player.getUsersQueue();
      const queueIndex = queue.queue.findIndex(
        (item) => item.uri === input.uriToSkipTo,
      );
      if (queueIndex === -1)
        throw Error("requested song could not be found in queue");

      // skip all songs one by one
      // terrible solution, but the spotify api does not provide a better way
      const proms: Promise<void>[] = [];
      for (let i = 0; i < queueIndex + 1; i++)
        proms.push(spotifyApi.player.skipToNext(deviceId));

      await Promise.all(proms);
    }),

  addToQueue: publicProcedure
    .input(defaultSessionZodInput.merge(z.object({ songUri: z.string() })))
    .mutation(async ({ ctx, input }) => {
      const spotifySession = await getSpotifySession(ctx.db, input);
      checkPermission(spotifySession, ctx.session, "permission_playPause");

      const { spotifyApi, error } = await getSpotifyApi(spotifySession.adminId);
      if (error !== null)
        throw Error(`could not get spotify api. Error: ${error}`);

      await spotifyApi.player.addItemToPlaybackQueue(input.songUri);
    }),
  getAlbum: publicProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      const spotifyApi = SpotifyApi.withClientCredentials(
        env.SPOTIFY_CLIENT_ID,
        env.SPOTIFY_CLIENT_SECRET,
      );

      return await spotifyApi.albums.get(input.id);
    }),
  getArtistInformation: publicProcedure
    .input(
      z.object({ artistId: z.string().min(1), market: z.enum(spotifyMarkets) }),
    )
    .query(async ({ input: { artistId, market } }) => {
      const spotifyApi = SpotifyApi.withClientCredentials(
        env.SPOTIFY_CLIENT_ID,
        env.SPOTIFY_CLIENT_SECRET,
      );

      const [topTracks, albums, relatedArtists] = await Promise.all([
        spotifyApi.artists.topTracks(artistId, market),
        spotifyApi.artists.albums(artistId, undefined, market, 5),
        spotifyApi.artists.relatedArtists(artistId),
      ]);

      return { topTracks, albums, relatedArtists: relatedArtists.artists };
    }),

  hasSavedTrack: protectedProcedure
    .input(
      z.object({
        trackId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { spotifyApi, error } = await getSpotifyApi(ctx.session.user.id);
      if (error !== null) throw Error(error);

      return (
        await spotifyApi.currentUser.tracks
          .hasSavedTracks([input.trackId])
          .catch(
            reauthCatcherFactory(ctx.session.user.id, (spotifyApi) =>
              spotifyApi.currentUser.tracks.hasSavedTracks([input.trackId]),
            ),
          )
      )[0];
    }),

  saveTrack: protectedProcedure
    .input(
      z.object({
        trackId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { spotifyApi, error: spotifyApiError } = await getSpotifyApi(
        ctx.session.user.id,
      );
      if (spotifyApiError !== null) throw Error(spotifyApiError);
      const { expired, error: expirationError } =
        await api.session.checkExpiration.query();
      if (expirationError) throw Error(expirationError as string);
      if (expired) throw Error("token expired! please reauthenticate");

      await spotifyApi.currentUser.tracks.saveTracks([input.trackId]);

      return;
    }),

  removeSavedTrack: protectedProcedure
    .input(
      z.object({
        trackId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { spotifyApi, error: spotifyApiError } = await getSpotifyApi(
        ctx.session.user.id,
      );
      if (spotifyApiError !== null) throw Error(spotifyApiError);
      const { expired, error: expirationError } =
        await api.session.checkExpiration.query();
      if (expirationError) throw Error(expirationError as string);
      if (expired) throw Error("token expired! please reauthenticate");

      await spotifyApi.currentUser.tracks.removeSavedTracks([input.trackId]);

      return;
    }),

  getFavourites: protectedProcedure
    .input(
      z.object({
        limit: z.number().nonnegative().max(49).int() as z.ZodType<MaxInt<49>>,
        cursor: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { spotifyApi, error } = await getSpotifyApi(ctx.session.user.id);
      if (error !== null) throw Error(error);

      const limit = input.limit ?? 15;
      const { cursor } = input;

      const data = await spotifyApi.currentUser.tracks.savedTracks(
        limit,
        cursor ?? undefined,
      );

      const nextCursor = data.offset + data.items.length;

      return { nextCursor, ...data };
    }),

  getAvailableMarkets: protectedProcedure.query(async ({ ctx }) => {
    const { spotifyApi, error } = await getSpotifyApi(ctx.session.user.id);
    if (error !== null) throw Error(error);
    return (await spotifyApi.markets.getAvailableMarkets()).markets as Market[];
  }),

  getAvalibleDevices: protectedProcedure
    .input(defaultSessionZodInput)
    .query(async ({ ctx, input }) => {
      const spotifySession = await getSpotifySession(ctx.db, input);

      if (ctx.session.user.id !== spotifySession.adminId)
        throw Error("only admin can fetch avalible devices");

      const { spotifyApi, error } = await getSpotifyApi(spotifySession.adminId);
      if (error !== null)
        throw Error(`could not get spotify api. Error: ${error}`);

      const devices = (await spotifyApi.player.getAvailableDevices()).devices
        .map((device) => ({
          ...device,
          type: device.type.toLowerCase() as SpotifyDeviceType,
        }))
        .sort((a, b) => (a.name > b.name ? 1 : -1));

      return devices;
    }),

  startPlayback: protectedProcedure
    .input(
      defaultSessionZodInput.merge(
        z.object({
          deviceId: z.string(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const spotifySession = await getSpotifySession(ctx.db, input);

      if (ctx.session.user.id !== spotifySession.adminId)
        throw Error("only admin can fetch avalible devices");

      const { spotifyApi, error } = await getSpotifyApi(spotifySession.adminId);
      if (error !== null)
        throw Error(`could not get spotify api. Error: ${error}`);

      await spotifyApi.player.transferPlayback([input.deviceId], true);
    }),
});

function checkPermission(
  spotifySession: SpotifySession,
  session: Session | null,
  permissionName: keyof SessionPermissions,
) {
  if (spotifySession.adminId === session?.user.id) return;

  if (spotifySession.permission_requireLoggedIn === true && session === null)
    throw Error("session requires you to be logged in");

  if (spotifySession[permissionName] === false)
    throw Error("session permission does not allow you to toggle play/pause");
}

async function getSpotifySession(
  database: typeof db,
  creds: { code: string; password: string },
) {
  const spotifySession = await database.spotifySession.findFirst({
    where: { code: creds.code, password: creds.password },
  });
  if (spotifySession === null) throw Error("could not get spotify session");
  return spotifySession;
}

/** function that generates a catch function used to try to reauth the user if that is the error
 * @param adminId id of the admin that should be reauthenticated
 * @param callback callback that was initially tried but failed due to reauth error
 * @returns catch function
 */
function reauthCatcherFactory<T>(
  adminId: User["id"],
  callback: (newSpotifyApi: SpotifyApi) => Promise<T>,
) {
  return async () => {
    // check if token expired -> `checkExpiration` will generate a new one
    const { expired, error } = await checkExpiration(adminId);
    if (!expired) {
      // get new SpotifyApi (with new token)
      const { spotifyApi, error } = await getSpotifyApi(adminId);
      if (error !== null) throw Error(error);
      // fire callback with new SpotifyApi
      return await callback(spotifyApi);
    } else {
      // handle error
      if (typeof error === "string") throw Error(error);
      if (error instanceof Error) throw error;
      console.error(error);
      throw Error(
        "^ unidentifiable error above while trying to automatically reauthenticate user",
      );
    }
  };
}

export type RefreshToken = Pick<
  AccessToken,
  "access_token" | "expires_in" | "token_type"
> & { scope: string } & Partial<Pick<AccessToken, "refresh_token">>;

import type { SpotifySession } from "@prisma/client";
import { z } from "zod";
import generatePwCookieName from "~/helpers/generatePwCookieName";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import Cookies from "js-cookie";
import { getSpotifyApi } from "./spotify";

export type SpotifySessionWithoutPassword = Omit<SpotifySession, "password">;

export const spotifySessionPasswordZod = z
  .string()
  .min(4, "❕ Password must be at lease four characters long");

export const spotifySessionCodeZod = z
  .string()
  .min(4, "code must be at least four characters long");

export const sessionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "❕ name cannot be empty"),
        password: spotifySessionPasswordZod,
        permission_playPause: z.boolean(),
        permission_skip: z.boolean(),
        permission_addToQueue: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const usersSesssionsCount = await ctx.db.spotifySession.count({
        where: {
          adminId: ctx.session.user.id,
        },
      });

      if (usersSesssionsCount >= 10)
        throw Error(
          "❌ You cannot create more then ten sessions.\nDelete your old ones before creating a new session.",
        );

      const data = await ctx.db.spotifySession.findMany({
        select: {
          code: true,
        },
      });

      const newCode = generateUniqueCode(data.map((d) => d.code));

      const existingSession = await ctx.db.spotifySession.findFirst({
        where: {
          code: newCode,
        },
        select: { id: true }, // we technically dont need to select anything (though prisma wont let you leave it empty), we only want to check if there is an existing session with that code
      });

      if (existingSession === null)
        return ctx.db.spotifySession.create({
          data: {
            name: input.name,
            password: input.password,

            adminId: ctx.session.user.id,
            code: newCode,

            permission_addToQueue: input.permission_addToQueue,
            permission_playPause: input.permission_playPause,
            permission_skip: input.permission_skip,
          },
        });
      else throw Error("❌ could not generate a unique session code");
    }),

  get: publicProcedure
    .input(
      z.object({
        code: spotifySessionCodeZod,
        password: spotifySessionPasswordZod,
      }),
    )
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.spotifySession.findFirst({
        where: {
          code: input.code,
          password: input.password,
        },
      });
      if (session === null) throw Error("could not get / find session");
      return session;
    }),

  checkExpiration: protectedProcedure.query(async ({ ctx }) => {
    const { error, spotifyApi } = await getSpotifyApi(ctx.session.user.id);
    if (error !== null) throw Error(error);
    try {
      const playbackState = await spotifyApi.player.getPlaybackState();
    } catch (error) {
      return { expired: true, error: error };
    }

    return { expired: false, error: null };
  }),

  checkPassword: publicProcedure
    .input(
      z.object({
        sessionCode: z
          .string()
          .min(4, "session code must be at least 4 characters long"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const spotifySession = await ctx.db.spotifySession.findFirst({
        where: {
          code: input.sessionCode,
        },
        select: {
          password: true,
          adminId: true,
        },
      });

      if (spotifySession === null)
        throw Error(
          `could not find spotifySession with code: ${input.sessionCode}`,
        );

      const pwCookieName = generatePwCookieName(
        input.sessionCode,
        spotifySession.adminId,
      );

      global.document = {
        ...global.document,
        cookie: ctx.headers.get("cookie") ?? "",
      };

      const pwFromUser = Cookies.get(pwCookieName);

      if (pwFromUser === undefined) throw Error("Password required");

      if (pwFromUser !== spotifySession.password)
        throw Error("Incorrect Password");

      return true;
    }),
});

function generateUniqueCode(usedArr: string[]) {
  const used = new Set(usedArr);

  for (let i = 0; i < 100; i++) {
    const code = randomDigit() + randomDigit() + randomDigit() + randomDigit();
    if (!used.has(code)) return code;
  }

  console.log("could not randomly find a code that fits");

  for (let i = 0; i < 10000; i++) {
    const code = numberToStringWithZeros(i);
    if (!used.has(code)) {
      console.log("chose: " + code);
      return code;
    }
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function randomDigit() {
  const nums = "0123456789";
  return nums.at(Math.round(Math.random() * 10)) ?? "0";
}

function numberToStringWithZeros(number: number) {
  return "0000".slice(0, number.toString().length) + number.toString();
}

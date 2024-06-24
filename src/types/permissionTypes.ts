import type { SpotifySession } from "@prisma/client";

export type SessionPermissions = {
  [K in keyof SpotifySession as K extends `permission_${string}`
    ? K
    : never]: SpotifySession[K];
};

export const defaultPermissions: {
  [key in keyof SessionPermissions]: boolean;
} = {
  permission_addToQueue: true,
  permission_playPause: false,
  permission_skip: false,
  permission_skipQueue: false,
  permission_requireLoggedIn: false,
};

export const permissionDescription: {
  [key in keyof SessionPermissions]: string;
} = {
  permission_addToQueue: "add songs to the end of the queue",
  permission_playPause: "toggle play / pause",
  permission_skip: "skip songs one by one",
  permission_skipQueue: "skip to a certain point in the queue",
  permission_requireLoggedIn: "user must be logged in to interact",
} as const;

export const stringIsPermissionName = (
  inp: string,
): inp is keyof SessionPermissions => inp.startsWith("permission_");

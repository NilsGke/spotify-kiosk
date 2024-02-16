import type { SpotifySession } from "@prisma/client";

export type SessionPermissions = {
  [K in keyof SpotifySession as K extends `permission_${string}`
    ? K
    : never]: SpotifySession[K];
};

export const stringIsPermissionName = (
  inp: string,
): inp is keyof SessionPermissions => inp.startsWith("permission_");

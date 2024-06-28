import type { User } from "@prisma/client";
import { type RefreshToken } from "../server/api/routers/spotify";
import { db } from "~/server/db";

export async function updateAccesToken(
  userId: User["id"],
  token: RefreshToken,
) {
  return await db.account.updateMany({
    where: { userId: userId, provider: "spotify" },
    data: {
      access_token: token.access_token,
      token_type: token.token_type,
      expires_at: Math.round(Date.now() / 1000 + token.expires_in),
      scope: token.scope,
      refresh_token: token.refresh_token,
    },
  });
}

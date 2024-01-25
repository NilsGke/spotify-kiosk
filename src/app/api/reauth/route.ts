import { type NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

export async function OPTIONS(req: NextRequest) {
  const token = (await req.json()) as {
    access_token: string;
    token_type: "Bearer";
    expires_in: number;
    refresh_token: string;
    scope: string;
    expires: number;
  };

  console.log(token, req);

  const session = await getServerAuthSession();
  if (session === null)
    return NextResponse.json({ status: 401, message: "unauthorized" });

  await db.account.updateMany({
    where: { userId: session.user.id, provider: "spotify" },
    data: {
      access_token: token.access_token,
      token_type: token.token_type,
      expires_at: Math.round(token.expires / 1000),
      refresh_token: token.refresh_token,
      scope: token.scope,
    },
  });

  console.log("\x1b[32mREAUTHENTICATED USER \x1b[0m");

  return new NextResponse("ok");
}

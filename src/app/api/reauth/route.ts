import { type NextRequest, NextResponse } from "next/server";
import { updateAccesToken } from "~/helpers/updateAccesToken";
import { getServerAuthSession } from "~/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = (await req.json()) as {
    access_token: string;
    token_type: "Bearer";
    expires_in: number;
    refresh_token: string;
    scope: string;
    expires: number;
  };

  const session = await getServerAuthSession();
  if (session === null)
    return NextResponse.json({ status: 401, message: "unauthorized" });

  await updateAccesToken(session.user.id, token);

  return new NextResponse("ok");
}

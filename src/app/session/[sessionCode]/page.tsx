import JoinSessionField from "~/app/_components/JoinSessionField";
import Player from "~/app/_components/player/Player";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { cookies } from "next/headers";
import generatePwCookieName from "~/helpers/generatePwCookieName";
import PasswordInputField from "~/app/_components/PasswordInputField";
import { api } from "~/trpc/server";

export default async function page({
  params: { sessionCode },
}: {
  params: {
    sessionCode: string;
  };
}) {
  const [session, spotifySession] = await Promise.all([
    getServerAuthSession(),
    db.spotifySession.findFirst({ where: { code: sessionCode } }),
  ]);

  if (spotifySession === null)
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <h1 className="text-2xl">Could not find session {sessionCode}</h1>
        <JoinSessionField />
      </div>
    );

  if (spotifySession.adminId === session?.user.id)
    return (
      <Player
        code={spotifySession.code}
        password={spotifySession.password}
        initialSession={spotifySession}
        admin
      />
    );

  const passwordCookieName = generatePwCookieName(
    spotifySession.code,
    spotifySession.adminId,
  );
  const passwordCookie = cookies().get(passwordCookieName);

  if (passwordCookie === undefined)
    return (
      <PasswordInputField
        adminId={spotifySession.adminId}
        code={spotifySession.code}
      />
    );

  if (passwordCookie.value !== spotifySession.password)
    return (
      <PasswordInputField
        adminId={spotifySession.adminId}
        code={spotifySession.code}
        message={"incorrect password"}
      />
    );

  return (
    <Player
      code={spotifySession.code}
      password={spotifySession.password}
      initialSession={spotifySession}
    />
  );
}

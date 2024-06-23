import JoinSessionField from "~/app/_components/JoinSessionField";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { cookies } from "next/headers";
import generatePwCookieName from "~/helpers/generatePwCookieName";
import PasswordInputField from "~/app/_components/PasswordInputField";
import TV from "~/app/_components/TV";
import { getSpotifyApi } from "~/server/spotifyApi";
import checkExpiration from "~/server/checkExpiration";
import type { ReactNode } from "react";

export default async function TVPage({
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

  if (spotifySession.adminId !== session?.user.id) {
    const passwordCookieName = generatePwCookieName(
      spotifySession.code,
      spotifySession.adminId,
    );
    const passwordCookie = cookies().get(passwordCookieName);

    if (passwordCookie === undefined)
      // early return of password field
      return (
        <PasswordInputField
          adminId={spotifySession.adminId}
          code={spotifySession.code}
        />
      );

    if (passwordCookie.value !== spotifySession.password)
      // same as above
      return (
        <PasswordInputField
          adminId={spotifySession.adminId}
          code={spotifySession.code}
          message={"incorrect password"}
        />
      );
  }

  const { spotifyApi, error } = await getSpotifyApi(spotifySession.adminId);

  if (error)
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        <h2>Error</h2>
        <pre>{error}</pre>
      </div>
    );

  if (spotifySession.adminId === session?.user.id) {
    const { expired, error } = await checkExpiration(spotifySession.adminId);
    if (error)
      return (
        <div className="flex flex-col items-center justify-center gap-2">
          <h2>Error</h2>
          <pre>{error as ReactNode}</pre>
        </div>
      );
    if (expired)
      return (
        <div className="flex flex-col items-center justify-center gap-2">
          The hosts token has expired. Tell them to open the player Page
        </div>
      );
  }
  const playback = await spotifyApi?.player.getPlaybackState();

  return <TV spotifySession={spotifySession} playback={playback} />;
}

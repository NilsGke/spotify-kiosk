import { getServerAuthSession } from "~/server/auth";
import LoginButton from "./_components/LoginButton";
import Link from "next/link";
import { db } from "~/server/db";
import SessionList from "./_components/SessionList";
import { env } from "~/env";

export default async function MainLoginAndSessionField() {
  const session = await getServerAuthSession();

  await db.$queryRaw`SELECT 1`;

  const usersSessions =
    (session !== null &&
      (await db.spotifySession.findMany({
        where: { adminId: session.user.id },
      }))) ||
    undefined;

  return (
    <>
      {session === null ? (
        <div>
          <LoginButton
            session={null}
            className="mr-1 rounded-lg bg-zinc-800 px-2 py-1 hover:bg-zinc-700"
          />{" "}
          to create a session
        </div>
      ) : (
        <>
          <SessionList initialSessions={usersSessions ?? []} />
          <Link
            href={env.NEXT_PUBLIC_APP_URL + "/createSession"}
            className="cursor-pointer rounded-md bg-spotify px-2 py-1 text-xl transition hover:brightness-90"
          >
            Create
          </Link>
        </>
      )}
    </>
  );
}

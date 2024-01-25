import { getServerAuthSession } from "~/server/auth";
import LoginButton from "./_components/LoginButton";
import JoinSessionField from "./_components/JoinSessionField";
import Link from "next/link";
import { env } from "~/env";
import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: {
    session?: string;
  };
}) {
  if (searchParams.session)
    redirect(env.NEXT_PUBLIC_APP_URL + "/session/" + searchParams.session);

  const session = await getServerAuthSession();

  return (
    <main className="block grid-cols-2 flex-col md:grid">
      <div className="flex h-auto w-full flex-col p-3 sm:p-5 md:grid md:h-full md:p-14 xl:p-20 ">
        <div className="h-auto w-full p-3 sm:p-5 md:h-full md:p-8 ">
          Create your own Spotify-Sessions for your friends.
        </div>
        <div className="h-auto w-full p-3 sm:p-5 md:h-full md:p-8 ">
          You have full control over the permissions, your friends have
        </div>
      </div>
      <div className="grid h-auto w-full grid-cols-1 grid-rows-2 items-center justify-items-center gap-4 md:h-full">
        <div className="flex w-min flex-col items-center justify-center gap-6 rounded-xl border-2 border-zinc-700 p-4 ">
          <h2 className="text-3xl">Join Session</h2>
          <JoinSessionField />
        </div>

        <div className="flex h-auto w-min flex-col items-center justify-center gap-6 rounded-xl border-2 border-zinc-700 p-4">
          <h2 className="text-nowrap text-3xl">Create Session</h2>

          {session === null ? (
            <div>
              <LoginButton
                session={null}
                className="mr-1 rounded-lg bg-zinc-800 px-2 py-1 hover:bg-zinc-700"
              />{" "}
              to create a session
            </div>
          ) : (
            <Link
              href={env.NEXT_PUBLIC_APP_URL + "/createSession"}
              className="cursor-pointer rounded-md bg-spotify px-2 py-1 text-xl transition hover:brightness-90"
            >
              Create
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

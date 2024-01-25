import LoginButton from "../_components/LoginButton";
import SessionGenerator from "./SessionGenerator";
import { getServerAuthSession } from "~/server/auth";

export default async function page() {
  const session = await getServerAuthSession();

  if (session === null)
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-6">
        <h1>You need to log in to create a session</h1>
        <LoginButton session={session} className="rounded-md bg-zinc-600" />
      </div>
    );

  return (
    <div className="flex h-full w-full items-center justify-center">
      <SessionGenerator />
    </div>
  );
}

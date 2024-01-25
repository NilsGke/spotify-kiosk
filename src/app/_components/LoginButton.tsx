"use client";

import { type Session } from "next-auth";
import { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { initials } from "@dicebear/collection";
import { signIn, signOut } from "next-auth/react";
import { twMerge } from "tailwind-merge";

export default function LoginButton({
  session,
  className,
}: {
  session: Session | null;
  className?: string;
}) {
  if (session === null)
    return (
      <button
        onClick={() => signIn("spotify")}
        className={twMerge(
          "rounded-[50px] bg-spotify px-4 py-3 text-lg transition hover:brightness-90 active:brightness-75",
          className,
        )}
      >
        Login
      </button>
    );

  return <LogoutButton session={session} className={className} />;
}

function LogoutButton({
  session,
  className,
}: {
  session: Session;
  className?: string;
}) {
  const avatar = useMemo(() => {
    if (typeof session.user?.image === "string") return session.user.image;
    else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return createAvatar(initials, {
        size: 128,
        seed: session.user.name ?? session.user.email ?? session.user.id,
      }).toDataUriSync();
    }
  }, [
    session.user.email,
    session.user.id,
    session.user.image,
    session.user.name,
  ]);

  return (
    <button
      onClick={() => signOut()}
      className={twMerge(
        "flex cursor-pointer items-center gap-3 rounded-[50px] bg-spotify py-1 pl-3 pr-1 text-lg brightness-100 transition-all hover:brightness-90 active:brightness-75",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div>Logout</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="aspect-square h-12 rounded-full"
        src={avatar}
        alt="your profile image"
      />
    </button>
  );
}

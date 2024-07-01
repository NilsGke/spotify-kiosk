"use client";

import { type Session } from "next-auth";
import { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { initials } from "@dicebear/collection";
import { signIn, signOut } from "next-auth/react";
import { twMerge } from "tailwind-merge";
import toast from "react-simple-toasts";

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
        onClick={() => {
          toast("⏳signing in...");
          void signIn("spotify")
            .then(() => toast("✅ Login successful"))
            .catch((error) => {
              toast("❌ An error occured while signing in");
              if (typeof error === "string") {
                toast(error);
                throw error;
              } else if (error instanceof Error) {
                toast(error.message);
                throw error;
              } else console.error(error);
            });
        }}
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
      onClick={() => {
        toast("⏳ signing out...");
        signOut()
          .then(() => toast("✅ Login successful"))
          .catch((error) => {
            toast("❌ An error occured while signing in");
            if (typeof error === "string") {
              toast(error);
              throw error;
            } else if (error instanceof Error) {
              toast(error.message);
              throw error;
            } else console.error(error);
          });
      }}
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

"use client";

import type { SpotifySession } from "@prisma/client";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { env } from "~/env";
import { api } from "~/trpc/react";
import { TiDelete } from "react-icons/ti";
import { CgSpinner } from "react-icons/cg";

export default function SessionList({
  initialSessions,
}: {
  initialSessions: SpotifySession[];
}) {
  const { data: sessions, refetch: refetchQueue } = api.session.list.useQuery(
    undefined,
    {
      initialData: initialSessions,
    },
  );

  const {
    isLoading,
    isSuccess,
    variables,
    mutate: removeSession,
  } = api.session.delete.useMutation({
    onSuccess: () => refetchQueue(),
  });

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- otherwise type is (string | false | null)
  const removingCode = (isLoading && variables?.code) || null;

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((session) => {
        const removing = removingCode === session.code;
        if (isSuccess && removing) return null;
        return (
          <div
            key={session.code}
            className={twMerge(
              "flex w-full justify-between gap-3",
              removing && "animate-pulse opacity-50",
            )}
          >
            <Link
              href={`${env.NEXT_PUBLIC_APP_URL}/session/${session.code}`}
              className="flex w-full items-center justify-between rounded border border-zinc-800 bg-zinc-900 px-2 py-1"
            >
              <div>{session.name}</div>
            </Link>

            <button
              className=""
              onClick={() => removeSession({ code: session.code })}
            >
              {removing ? (
                <CgSpinner className="animate-spin" />
              ) : (
                <TiDelete className="color-white aspect-square h-8 w-6" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

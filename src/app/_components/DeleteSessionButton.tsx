"use client";

import type { SpotifySession } from "@prisma/client";
import { useState } from "react";
import { MdDelete, MdDeleteOutline } from "react-icons/md";
import useKeyboard from "~/hooks/useKeyboard";
import useOutsideClick from "~/hooks/useOutsideClick";
import { api } from "~/trpc/react";
import toast from "react-simple-toasts";
import { useRouter } from "next/navigation";
import { env } from "~/env";
import { twMerge } from "tailwind-merge";

export default function DeleteSessionButton({
  sessionCode,
  sessionName,
}: {
  sessionCode: SpotifySession["code"];
  sessionName: SpotifySession["name"];
}) {
  const router = useRouter();

  const { mutate, isLoading, isSuccess, isIdle } =
    api.session.delete.useMutation({
      onSuccess() {
        router.push(env.NEXT_PUBLIC_APP_URL);
        toast(`✅ deleted "${sessionName}" successfully`);
        toast("⏳ forwarding...");
      },
    });

  const deleteSession = () =>
    mutate({
      code: sessionCode,
    });

  const [confirmPopupOpen, setConfirmPopupOpen] = useState(false);

  const close = () =>
    void (!isLoading && !isSuccess && setConfirmPopupOpen(false));

  const containerRef = useOutsideClick(close);
  useKeyboard((key) => key === "Escape" && close());

  return (
    <>
      <button
        title="delete session"
        className="w-full rounded-md border border-zinc-500 p-2"
        onClick={() => setConfirmPopupOpen(true)}
      >
        <div className="relative size-5 text-white transition-colors hover:text-red-400 active:text-red-600">
          <MdDelete className="absolute left-0 top-0 size-full" />
          <MdDeleteOutline className="absolute left-0 top-0 size-full" />
        </div>
      </button>

      {confirmPopupOpen && (
        <div className="fixed left-0 top-0 z-20 flex h-full w-full items-center justify-center backdrop-blur-sm backdrop-brightness-50">
          <div
            ref={containerRef}
            className="flex flex-col gap-3 rounded-3xl bg-zinc-900 p-2 md:p-4 lg:p-8 xl:p-10"
          >
            <h2>Are you sure you want to delete &quot;{sessionName}&quot;?</h2>
            <div className="grid w-full grid-cols-2 gap-3">
              <button
                aria-label="keep session"
                className={twMerge(
                  "rounded-md border border-zinc-500 p-3 transition-colors hover:bg-zinc-700",
                  (isLoading || isSuccess) && "pointer-events-none opacity-50",
                )}
                onClick={close}
              >
                no, keep session
              </button>
              <button
                aria-label="delete session (confirmation)"
                disabled={isLoading || isSuccess}
                className={twMerge(
                  "rounded-md border border-zinc-500 p-3 text-red-500 transition-colors hover:bg-red-400 [&:not(:disabled)]:hover:text-white",
                  isLoading && "pointer-events-none opacity-50",
                )}
                onClick={deleteSession}
              >
                {isLoading && (
                  <span className="animate-pulse">Deleting...</span>
                )}

                {isSuccess && "✅ Deleted!"}

                {isIdle && !isSuccess && "yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

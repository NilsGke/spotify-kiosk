"use client";

import type { SpotifySession } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { env } from "~/env";
import { api } from "~/trpc/react";
import Cookie from "js-cookie";
import generatePwCookieName from "~/helpers/generatePwCookieName";
import toast from "react-simple-toasts";

export default function PasswordInputField({
  code,
  adminId,
  message,
}: {
  adminId: SpotifySession["adminId"];
  code: SpotifySession["code"];
  message?: "incorrect password";
}) {
  const [password, setPassword] = useState("");

  // focus pw input on mount
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);

  const pwCookieName = useMemo(
    () => generatePwCookieName(code, adminId),
    [code, adminId],
  );

  // remove cookie if pw is incorrect
  useEffect(() => {
    if (message === "incorrect password") {
      Cookie.remove(pwCookieName);
      console.log("\x1b[31mremoved cookie");
    }
  }, [adminId, code, message, pwCookieName]);

  const router = useRouter();

  const passwordQuery = api.session.checkPassword.useQuery(
    {
      sessionCode: code,
    },
    {
      refetchInterval: Infinity,
      refetchOnWindowFocus: false,
      retry: false,
    },
  );

  return (
    <div className="flex h-full w-full items-center justify-center">
      <form
        className="flex flex-col gap-4 rounded-lg border border-zinc-700 p-3"
        onSubmit={async (e) => {
          e.preventDefault();

          Cookie.set(pwCookieName, password, {
            expires: 7,
          });
          const res = await passwordQuery.refetch();
          if (typeof res === "string" && res === "error") return;

          if (res.data === false) {
            toast("incorrect password");
          } else {
            const newURL = `${env.NEXT_PUBLIC_APP_URL}/session/${code}`; // this allows this component to be rendered on any route
            toast("correct password");
            if (newURL === window.location.href) router.refresh();
            else router.push(newURL);
          }
        }}
      >
        {passwordQuery.error && (
          <div>
            {passwordQuery.error.data?.zodError
              ? passwordQuery.error.data.zodError.fieldErrors.sessionCode?.join(
                  "\n",
                ) ?? "Error"
              : passwordQuery.error.message}
          </div>
        )}
        <input
          ref={inputRef}
          className="rounded border border-zinc-700 bg-black p-2 text-white placeholder:text-zinc-700"
          type="password"
          name="passwordInput"
          id="passwordInput"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="cursor-pointer rounded border border-zinc-700 bg-black p-2 text-white"
          type="submit"
          value="Submit"
        />
      </form>
    </div>
  );
}

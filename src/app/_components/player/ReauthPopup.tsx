"use client";

import { useState } from "react";
import { env } from "~/env";
import { api } from "~/trpc/react";

export default function ReauthPopup() {
  const query = api.session.checkExpiration.useQuery();

  const [collapsed, setCollapsed] = useState(false);

  if (!query.isSuccess || query.data.expired === false) return null;

  if (collapsed)
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute bottom-6 left-6 rounded bg-red-400 p-4 text-lg"
      >
        Reauthentication required!
      </button>
    );

  return (
    <div className="absolute left-0 top-0 flex h-screen w-screen items-center justify-center backdrop-blur-sm">
      <div className="flex flex-col gap-4 rounded-xl border border-red-400 bg-zinc-800 p-4">
        <div className="flex items-center justify-center gap-6">
          <h2 className="text-lg">The Spotify Token has Expired</h2>
          <button
            className="flex aspect-square h-8 w-8 items-center justify-center rounded border border-zinc-600 text-lg hover:brightness-90 active:brightness-75"
            onClick={() => setCollapsed(true)}
          >
            x
          </button>
        </div>
        <h3 className="">You need to Reauthenticate yourself</h3>
        <button
          className="rounded border border-zinc-500 p-2 hover:brightness-90 active:brightness-75"
          onClick={() => {
            localStorage.removeItem(
              "spotify-sdk:AuthorizationCodeWithPKCEStrategy:token",
            );
            window.open(
              env.NEXT_PUBLIC_APP_URL + "/reauth",
              "_blank",
              "popup,height=700,width=550",
            );
          }}
        >
          Reauthenticate
        </button>
      </div>
    </div>
  );
}

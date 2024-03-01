"use client";

import { useState } from "react";
import SessionSettings from "../_components/SessionSettings";
import {
  defaultPermissions,
  type SessionPermissions,
} from "~/types/permissionTypes";
import { twMerge } from "tailwind-merge";
import { api } from "~/trpc/react";
import toast from "react-simple-toasts";
import { useRouter } from "next/navigation";
import { env } from "~/env";
import type { Market } from "@spotify/web-api-ts-sdk";

export default function SessionGenerator({ markets }: { markets: Market[] }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] =
    useState<SessionPermissions>(defaultPermissions);
  const [market, setMarket] = useState<Market | null>(null);

  const router = useRouter();

  const createMutation = api.session.create.useMutation({
    onSuccess({ code, name }) {
      toast(`✅ Created "${name}"`);
      toast("⏳ forwarding...");
      router.push(env.NEXT_PUBLIC_APP_URL + "/session/" + code);
    },
    onError(error) {
      console.error(error.message);
      if (error.data?.zodError)
        for (const key in error.data.zodError.fieldErrors)
          toast(error.data.zodError.fieldErrors[key]);
      else toast(error.message);
    },
  });

  return (
    <div className="flex flex-col items-center gap-5 lg:gap-10">
      <h1 className="text-4xl">Create a session</h1>
      <SessionSettings
        name={name}
        password={password}
        permissions={permissions}
        market={market}
        availableMarkets={markets}
        onNameChange={setName}
        onPasswordChange={setPassword}
        onPermissionChange={setPermissions}
        onMarketChange={setMarket}
      />
      <button
        disabled={
          createMutation.isLoading ||
          createMutation.isSuccess ||
          createMutation.isError
        }
        onClick={() => {
          if (name.length === 0) return toast("❕ name cannot be empty");
          if (password.length < 4)
            return toast("❕ Password must be at lease four characters long");
          if (market === null) return toast("❕ you must select a market");

          createMutation.mutate({
            name,
            password,
            market,
            ...permissions,
          });
        }}
        className={twMerge(
          "w-full rounded bg-spotify p-2 transition hover:brightness-95 active:brightness-90",
          createMutation.isLoading && "brightness-90",
        )}
      >
        Create
      </button>
    </div>
  );
}

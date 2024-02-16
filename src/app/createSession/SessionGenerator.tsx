"use client";

import { useState } from "react";
import SessionSettings from "../_components/SessionSettings";
import { type SessionPermissions } from "~/types/permissionTypes";
import { twMerge } from "tailwind-merge";
import { api } from "~/trpc/react";
import toast from "react-simple-toasts";
import { useRouter } from "next/navigation";
import { env } from "~/env";

export default function SessionGenerator() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<SessionPermissions>({
    permission_addToQueue: false,
    permission_playPause: false,
    permission_skip: false,
    permission_skipQueue: false,
  });

  const router = useRouter();

  const createMutation = api.session.create.useMutation({
    onSuccess({ code, name }) {
      toast(`✅ Created "${name}"`);
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
        onNameChange={setName}
        onPasswordChange={setPassword}
        onPermissionChange={setPermissions}
      />
      <button
        onClick={() => {
          createMutation.mutate({
            name,
            password,
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

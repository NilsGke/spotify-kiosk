"use client";

import checkForTokenError from "~/helpers/checkForTokenError";
import reauthToast from "~/helpers/reauthToast";
import { api } from "~/trpc/react";
import { usePathname } from "next/navigation";
import { env } from "~/env";

export default function PlayToggle() {
  const pathname = usePathname();

  const toggleMutation = api.spotify.togglePlayPause.useMutation({
    onError(error) {
      if (checkForTokenError(error))
        reauthToast(env.NEXT_PUBLIC_APP_URL + pathname);
    },
  });

  return <button onClick={() => toggleMutation.mutate()}>toggle play</button>;
}

"use client";

import type { SpotifySession } from "@prisma/client";
import Container from "./Container";
import { api } from "~/trpc/react";
import { useEffect } from "react";
import Spinner from "../Spinner";
import checkForTokenError from "~/helpers/checkForTokenError";
import { hostNeedsToReauthToast } from "~/helpers/reauthToast";

export default function PlayControls({
  session,
}: {
  session: SpotifySession | undefined;
}) {
  if (session === undefined)
    return (
      <Container>
        <Spinner />
      </Container>
    );

  return (
    <Container>
      <Controls session={session} />
    </Container>
  );
}

function Controls({ session }: { session: SpotifySession }) {
  const { data, isError, error, isLoading } = api.spotify.getPlayback.useQuery({
    code: session.code,
    password: session.password,
  });

  if (isError) return <pre>{error.message}</pre>;

  return (
    <div>
      <pre>{JSON.stringify(data)}</pre>
    </div>
  );
}

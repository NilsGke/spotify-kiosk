"use client";

import { api } from "~/trpc/react";
import PlayControls from "./PlayControls";
import Search from "./Search";
import CurrentSong from "./CurrentSong";
import Queue from "./Queue";
import SessionControls from "./SessionControls";
import ReauthPopup from "./ReauthPopup";

export default function Player({
  admin = false,
  code,
  password,
}: {
  admin?: boolean;
  code: string;
  password: string;
}) {
  const sessionQuery = api.session.get.useQuery(
    { code, password },
    {
      refetchInterval: 10000,
    },
  );

  return (
    <>
      <div className="grid-rows-[1fr,10%] lg:grid lg:grid-cols-[300px,1fr,300px] xl:grid-cols-[400px,1fr,400px]">
        <Queue />

        <Search />

        <div className="row-span-2">
          <CurrentSong />
        </div>

        <SessionControls />

        <PlayControls session={sessionQuery.data} />
      </div>
      {sessionQuery.isSuccess && <ReauthPopup session={sessionQuery.data} />}
    </>
  );
}

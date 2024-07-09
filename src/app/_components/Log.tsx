import type { LogType, SpotifySession } from "@prisma/client";
import type { Track } from "@spotify/web-api-ts-sdk";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { api } from "~/trpc/react";
import HoverInfo from "./HoverInfo";

const logDescriptions: Record<LogType, string> = {
  AddToQueue: "added",
  Skip: "skipped",
};

export default function Log({
  spotifySession,
}: {
  spotifySession: SpotifySession | undefined;
}) {
  if (spotifySession === undefined) return skeleton;

  return <Logs spotifySession={spotifySession} />;
}

function Logs({ spotifySession }: { spotifySession: SpotifySession }) {
  const { data: logs } = api.spotify.getLog.useQuery(
    { code: spotifySession.code, password: spotifySession.password },
    {
      refetchInterval: 5000,
      refetchIntervalInBackground: false,
    },
  );

  const {
    mutate: fetchTracks,
    isLoading,
    isError,
  } = api.spotify.getTracks.useMutation({
    onSuccess: (tracks) => setTracks((prev) => [...prev, ...tracks]),
  });

  const [tracks, setTracks] = useState<Track[]>([]);

  // fetch tracks that are in logs but not in tracks
  useEffect(() => {
    if (logs === undefined || isLoading || isError) return;

    const trackIds = logs.map((log) => log.trackIds).flat();

    const missingTrackIds = trackIds.filter(
      (id) => tracks.findIndex((track) => track.id === id) === -1,
    );

    console.log(trackIds, missingTrackIds);

    if (missingTrackIds.length === 0) return;

    fetchTracks({
      code: spotifySession.code,
      password: spotifySession.password,
      trackIds: missingTrackIds,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, isLoading]);

  return (
    <div className="h-full w-full max-w-xl rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:p-3 md:p-5 lg:p-6">
      <h2>Logs</h2>
      <div className="flex flex-col gap-1">
        {logs === undefined
          ? skeleton
          : logs.map((log) => {
              let trackInfo: JSX.Element | string = "";
              if (log.trackIds.length === 1)
                trackInfo =
                  tracks?.find((track) => track.id === log.trackIds.at(0)!)
                    ?.name ?? "a track";
              else if (log.trackIds.length > 1)
                trackInfo = (
                  <>
                    {log.trackIds.length} tracks{" "}
                    <HoverInfo>
                      {log.trackIds
                        .map((trackId) =>
                          tracks.find((track) => trackId === track.id),
                        )
                        .filter((t) => t !== undefined)
                        .map((track) => track!.name)}
                    </HoverInfo>
                  </>
                );

              const userImageUrl = log.triggeredBy?.image;

              return (
                <div
                  key={log.id}
                  className="grid h-10 w-full grid-cols-[40%_18%_1fr] content-center items-center gap-2 rounded text-xs"
                >
                  <div className="flex items-center justify-center">
                    <div className="flex flex-nowrap gap-2 rounded-md bg-zinc-800 p-1 px-2">
                      {userImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className="aspect-square size-6 rounded-full"
                          src={userImageUrl}
                          alt="user profile picture"
                        />
                      )}
                      <div className="flex w-full items-center  overflow-hidden overflow-ellipsis whitespace-nowrap">
                        {log.triggeredBy?.name ?? "anonymous"}
                      </div>
                    </div>
                  </div>
                  <div
                    className={twMerge(
                      "flex  h-min w-min items-center overflow-hidden overflow-ellipsis whitespace-nowrap rounded p-1",
                      log.type === "Skip" && "bg-blue-400",
                      log.type === "AddToQueue" && "bg-purple-500",
                    )}
                  >
                    {logDescriptions[log.type]}
                  </div>
                  <div className="flex w-full items-center overflow-hidden overflow-ellipsis whitespace-nowrap">
                    {trackInfo}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

const skeleton = (
  <div className="flex flex-col gap-1">
    <h2>Logs</h2>
    {Array(5)
      .fill(0)
      .map((_i, i) => (
        <div
          key={i}
          className="h-10 w-full animate-pulse rounded bg-zinc-800"
        />
      ))}
  </div>
);

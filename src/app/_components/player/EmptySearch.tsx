import type { SpotifySession } from "@prisma/client";
import type {
  ItemTypes,
  RecentlyPlayedTracksPage,
} from "@spotify/web-api-ts-sdk";
import { itemTypes } from "~/types/itemTypes";
import {
  type SessionPermissions,
  permissionDescription,
  stringIsPermissionName,
} from "~/types/permissionTypes";
import HoverInfo from "../HoverInfo";
import TrackHistory from "./TrackHistory";

export default function EmptySearch({
  session,
  setSearch,
  history,
}: {
  session: SpotifySession | undefined;
  setSearch: (term: `@${ItemTypes} `) => void;
  history: RecentlyPlayedTracksPage | undefined;
}) {
  return (
    <div className="grid h-full w-full grid-cols-1 items-center justify-center justify-items-center gap-4 md:grid-cols-2 md:grid-rows-2">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:p-3 md:p-5 lg:p-6">
        start typing to search for a track
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:p-3 md:p-5 lg:p-6">
        <h2 className="mb-3 text-center">type @...</h2>
        <div className="flex flex-wrap gap-1">
          {itemTypes.map((typename) => (
            <button
              key={typename}
              onClick={() => setSearch(`@${typename} `)}
              className="rounded border border-zinc-500 bg-zinc-800 px-1 py-0.5 hover:bg-zinc-700 active:bg-zinc-600"
            >
              {typename}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-1 sm:p-3 md:p-5 lg:p-6">
        <h2 className="mb-3 text-center">Your Permissions:</h2>
        <div className="flex flex-wrap justify-center gap-1">
          {session &&
            Object.entries(session)
              .filter((a) => stringIsPermissionName(a[0]))
              .map((keyval) => {
                const [permissionName, value] = keyval as [
                  keyof SessionPermissions,
                  boolean,
                ];
                if (typeof value !== "boolean") return null;
                if (value === false) return null;

                return (
                  <div
                    key={permissionName}
                    className="flex flex-nowrap items-center gap-2 rounded border border-green-700 px-1 py-0.5 text-green-300"
                  >
                    {permissionName.replace("permission_", "")}{" "}
                    <HoverInfo className="text-white">
                      {permissionDescription[permissionName]}
                    </HoverInfo>
                  </div>
                );
              })}
        </div>
      </div>
      <TrackHistory history={history} />
    </div>
  );
}

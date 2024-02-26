"use client";

import type { Market } from "@spotify/web-api-ts-sdk";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import type { SessionPermissions } from "~/types/permissionTypes";
import HoverInfo from "./HoverInfo";

export default function SessionSettings({
  name: initialName,
  password: initialPassword,
  permissions,
  market,
  availableMarkets,
  onNameChange,
  onPasswordChange,
  onPermissionChange,
  onMarketChange,
}: {
  name: string;
  password: string;
  permissions: SessionPermissions;
  market: Market | null;
  availableMarkets: Market[];
  onNameChange: (name: string) => void;
  onPasswordChange: (password: string) => void;
  onPermissionChange: (permissions: SessionPermissions) => void;
  onMarketChange: (market: Market) => void;
}) {
  const [name, setName] = useState(initialName);
  const [password, setPassword] = useState(initialPassword);

  return (
    <div className="flex h-full w-full grid-cols-2 flex-col gap-8 md:grid lg:gap-20">
      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
        <label htmlFor="" className="w-full">
          <div>Session Name</div>
          <input
            onBlur={() => onNameChange(name)}
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            className="border-slate rounded border bg-black p-2 text-white"
          />
        </label>
        <label htmlFor="" className="w-full">
          <div>Session Passwort</div>
          <input
            onBlur={() => onPasswordChange(password)}
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="text"
            className="border-slate rounded border bg-black p-2 text-white"
          />
        </label>
        <label htmlFor="" className="w-full">
          <div>
            select region{" "}
            <HoverInfo>
              this information is necessary, so that no songs are shown that are
              not avalible to you
            </HoverInfo>
          </div>
          <select
            name="marketSelect"
            id="marketSelect"
            className="border-slate w-full rounded border bg-black p-2 text-white"
            value={market ?? ""}
            onChange={(e) => onMarketChange(e.target.value as Market)}
          >
            <option value="">-</option>
            {availableMarkets.map((market) => (
              <option key={market} value={market}>
                {market}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex h-full  w-full flex-col items-center justify-center gap-2">
        <PermissionSettings
          onChange={onPermissionChange}
          permissions={permissions}
        />
      </div>
    </div>
  );
}

function PermissionSettings({
  onChange,
  permissions,
}: {
  permissions: SessionPermissions;
  onChange: (permissions: SessionPermissions) => void;
}) {
  // TODO: try to optimize this (find a general solution using the permission names and not have a component for each one)
  return (
    <>
      <h2 className="text-xl">User Permissions</h2>
      <ToggleButton
        name={"addToQueue"}
        onChange={(val) =>
          onChange({
            ...permissions,
            permission_addToQueue: val,
          })
        }
        checked={permissions.permission_addToQueue}
      />
      <ToggleButton
        name={"playPause"}
        onChange={(val) =>
          onChange({
            ...permissions,
            permission_playPause: val,
          })
        }
        checked={permissions.permission_playPause}
      />
      <ToggleButton
        name={"skip"}
        onChange={(val) =>
          onChange({
            ...permissions,
            permission_skip: val,
          })
        }
        checked={permissions.permission_skip}
      />
    </>
  );
}

function ToggleButton({
  checked,
  onChange,
  name,
}: {
  checked: boolean;
  onChange: (state: boolean) => void;
  name: string;
}) {
  return (
    <label
      className={twMerge(
        "w-full cursor-pointer rounded border-2 px-2 py-1 text-center [&:has(input:focus)]:outline",
        checked
          ? "border-green-700 text-green-300 hover:bg-green-950 active:bg-green-900"
          : " border-red-800 text-red-300 hover:bg-red-950 active:bg-red-900",
      )}
    >
      {name}
      <input
        type="checkbox"
        name={name}
        className="sr-only"
        checked={checked}
        onChange={() => onChange(!checked)}
      />
    </label>
  );
}

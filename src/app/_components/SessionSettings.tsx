import type { Market } from "@spotify/web-api-ts-sdk";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import {
  defaultPermissions,
  permissionDescription,
  type SessionPermissions,
} from "~/types/permissionTypes";
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
            onKeyDown={(e) =>
              e.key === "Enter" &&
              (e.nativeEvent.target as HTMLInputElement).blur()
            }
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
            onKeyDown={(e) =>
              e.key === "Enter" &&
              (e.nativeEvent.target as HTMLInputElement).blur()
            }
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
  return (
    <>
      <h2 className="text-xl">User Permissions</h2>

      {Object.keys(defaultPermissions).map((pn) => {
        const permissionName = pn as keyof SessionPermissions;

        return (
          <ToggleButton
            key={permissionName}
            name={permissionName}
            info={permissionDescription[permissionName]}
            onChange={(val) =>
              onChange({
                ...permissions,
                [permissionName]: val,
              })
            }
            checked={permissions[permissionName]}
          />
        );
      })}
    </>
  );
}

function ToggleButton({
  checked,
  onChange,
  info,
  name,
}: {
  checked: boolean;
  onChange: (state: boolean) => void;
  info: string;
  name: string;
}) {
  return (
    <label
      className={twMerge(
        "flex w-full cursor-pointer items-center justify-center gap-2 rounded border-2 px-2 py-1 text-center [&:has(input:focus)]:outline",
        checked
          ? "border-green-700 text-green-300 hover:bg-green-950 active:bg-green-900"
          : " border-red-800 text-red-300 hover:bg-red-950 active:bg-red-900",
      )}
    >
      {name} <HoverInfo className="text-white">{info}</HoverInfo>
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

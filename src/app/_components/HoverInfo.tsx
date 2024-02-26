import type { ReactNode } from "react";
import { IoMdInformationCircleOutline } from "react-icons/io";

export default function HoverInfo({ children }: { children: ReactNode }) {
  return (
    <div className="relative inline-block w-min">
      <IoMdInformationCircleOutline className="peer" />
      <div className="pointer-events-none absolute w-40 rounded border border-zinc-600 bg-black p-2 text-xs opacity-0 peer-hover:opacity-100">
        {children}
      </div>
    </div>
  );
}

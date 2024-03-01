import type { ReactNode } from "react";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { twMerge } from "tailwind-merge";

export default function HoverInfo({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="relative inline-block w-min">
      <IoMdInformationCircleOutline className="peer" />
      <div
        className={twMerge(
          "pointer-events-none absolute z-20 w-40 rounded border border-zinc-600 bg-black p-2 text-xs opacity-0 peer-hover:opacity-100",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

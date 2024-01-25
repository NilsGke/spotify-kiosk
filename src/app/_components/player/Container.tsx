import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export default function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="h-full w-full p-2">
      <div
        className={twMerge(
          "h-full w-full rounded-xl border border-zinc-600 p-2",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

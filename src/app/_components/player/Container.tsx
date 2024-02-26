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
    <div
      className={twMerge(
        "w-full rounded-xl border-none border-zinc-600 bg-zinc-900 p-2 lg:h-full",
        className,
      )}
    >
      {children}
    </div>
  );
}

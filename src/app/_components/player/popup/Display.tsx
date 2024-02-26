import type { ReactNode } from "react";
import SlideDisplay from "../../SlideDisplay";

export default function Display({
  imageUrl,
  title,
  subtitle,
  children,
}: {
  imageUrl: string | undefined;
  title: string;
  subtitle: string | ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="grid w-full grid-cols-[auto,1fr] items-center gap-2 md:gap-4">
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="inline-block w-40 rounded-xl"
            src={imageUrl}
            alt="album / playlist / track image"
          />
        )}
        <div>
          <SlideDisplay className="" onlyOnHover>
            {title}
          </SlideDisplay>
          <div className="text-zinc-400">{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

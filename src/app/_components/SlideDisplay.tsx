"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

export default function SlideDisplay({
  children,
  onlyOnHover = false,
}: {
  children: ReactNode;
  onlyOnHover?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [hovering, setHovering] = useState(false);

  const [lastResize, setLastResize] = useState(0);

  useEffect(() => {
    if (
      titleRef.current === null ||
      containerRef.current === null ||
      (onlyOnHover && !hovering)
    )
      return;

    const delta =
      titleRef.current.clientWidth - containerRef.current.clientWidth;

    if (delta <= 0) return;

    const animation = titleRef.current.animate(
      [
        { left: 0 },
        // { left: 0 },
        { left: -delta + "px" },
        // { left: -delta + "px" },
      ],
      {
        duration: 8000,
        iterations: Infinity,
        direction: "alternate",
        endDelay: 1000,
        easing: "ease-in-out",
      },
    );

    return () => animation.cancel();
  }, [children, lastResize, onlyOnHover, hovering]);

  // use effect that has a resize observer that updates the last resize state
  useEffect(() => {
    if (containerRef.current === null) return;

    const observer = new ResizeObserver(() => setLastResize(Date.now()));

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="relative h-10 w-full overflow-hidden"
      ref={containerRef}
      onMouseEnter={(onlyOnHover && (() => setHovering(true))) || undefined}
      onMouseLeave={(onlyOnHover && (() => setHovering(false))) || undefined}
    >
      <h2 className="absolute w-fit text-nowrap text-4xl" ref={titleRef}>
        {children}
      </h2>
    </div>
  );
}

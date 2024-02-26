import { useEffect, useRef } from "react";

const useOutsideClick = (callback: () => unknown, active = true) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      console.log(
        ref.current,
        e.target,
        ref.current?.contains(e.target as Node),
      );
      if (active && ref.current && !ref.current.contains(e.target as Node))
        callback();
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [active, callback]);

  return ref;
};

export default useOutsideClick;

import { useEffect, useRef } from "react";

const useOutsideClick = (callback: () => unknown, active = true) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (active && ref.current && !ref.current.contains(e.target as Node))
        callback();
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [active, callback]);

  return ref;
};

export default useOutsideClick;

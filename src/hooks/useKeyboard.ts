import { useEffect } from "react";

/**
 * A hook that listens for keyboard events and calls a callback with the key and the event.
 *
 * @param callback The callback to call when a key is pressed.
 */
const useKeyboard = (
  callback: (key: KeyboardEvent["key"], e: KeyboardEvent) => void,
) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => callback(e.key, e);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [callback]);
};

export default useKeyboard;

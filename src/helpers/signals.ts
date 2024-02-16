"use client";

import { useEffect } from "react";

console.log("running");

type ItemUri = string;

/**
 * strings are the item `uri`s
 */
interface SignalEventMap {
  updateQueue: CustomEvent<{
    add: ItemUri[];
    remove: ItemUri[];
  }>;
  updatePlaystate: CustomEvent<{
    newItem: ItemUri[];
  }>;
}

interface SignalElement extends Element {
  addEventListener<K extends keyof SignalEventMap>(
    type: K,
    listener: (this: SignalElement, ev: SignalEventMap[K]) => void,
  ): void;

  removeEventListener<K extends keyof SignalEventMap>(
    type: K,
    listener: (this: SignalElement, ev: SignalEventMap[K]) => void,
  ): void;

  dispatchEvent<K extends keyof SignalEventMap>(ev: SignalEventMap[K]): boolean;
}

// cannot just have one element because next executes this file on the server once and there is no (DOM) Element on server
const signalElement: SignalElement = document.createElement("div");

/**
 * my own little signal library to communicate between components that dont live close together
 */
export const useSignal = <K extends keyof SignalEventMap>(
  signalName: K,
  callback: (data: SignalEventMap[K]["detail"]) => void,
) =>
  useEffect(() => {
    const eventCallback = (event: SignalEventMap[K]) => callback(event.detail);

    signalElement.addEventListener(signalName, eventCallback);

    return () => signalElement.removeEventListener(signalName, eventCallback);
  }, [callback, signalName]);

export const sendSignal = <K extends keyof SignalEventMap>(
  signalName: K,
  data: SignalEventMap[K]["detail"],
) =>
  signalElement.dispatchEvent<K>(
    // @ts-expect-error cannot get this to be typesafe, though i am sure it is
    new CustomEvent<typeof data>(signalName, { detail: data }),
  );

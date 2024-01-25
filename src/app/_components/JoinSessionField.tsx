"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { env } from "~/env";

export default function JoinSessionField() {
  const [code, setCode] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);

  const router = useRouter();

  // prefetch session
  useEffect(() => {
    if (code.length >= 4)
      router.prefetch(`${env.NEXT_PUBLIC_APP_URL}/session/${code}`);
  }, [code, router]);

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`${env.NEXT_PUBLIC_APP_URL}/session/${code}`);
      }}
    >
      <input
        ref={inputRef}
        className="noNumberSpinButtons rounded border border-zinc-700 bg-black p-1 text-center text-lg text-white placeholder:text-zinc-700"
        type="number"
        placeholder="1234"
        name="codeinput"
        id="codeInput"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <input
        className="w-full cursor-pointer rounded border border-zinc-700 p-1 text-lg transition hover:bg-zinc-800 disabled:cursor-default disabled:text-zinc-600 disabled:hover:bg-black"
        type="submit"
        value="Join"
        disabled={code.length < 4}
      />
    </form>
  );
}

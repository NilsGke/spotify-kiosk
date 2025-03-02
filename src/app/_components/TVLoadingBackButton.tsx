"use client";

import { useRouter } from "next/navigation";

export default function TVLoadingBackButton() {
  const router = useRouter();

  return (
    <button
      className="absolute left-5 top-5 rounded p-2 backdrop-blur-md backdrop-brightness-95 transition hover:backdrop-brightness-90"
      onClick={() => router.back()}
    >
      &lt;- back to session
    </button>
  );
}

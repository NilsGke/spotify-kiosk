"use client";

import type { ErrorComponent } from "next/dist/client/components/error-boundary";

const HomePageError: ErrorComponent = ({ reset }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-red-900 p-2">
      <h2 className="text-center text-lg underline">Error:</h2>
      <pre className="rounded bg-red-950 px-2 py-1">
        Database connection failed!
      </pre>
      <button
        className="ml-2 rounded border border-zinc-600 px-2 py-1 text-center hover:bg-zinc-800 active:bg-zinc-700"
        onClick={reset}
      >
        try again
      </button>
    </div>
  );
};

export default HomePageError;

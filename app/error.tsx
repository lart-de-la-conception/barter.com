"use client";

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Something slipped</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black">The market did not load cleanly.</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-neutral-600">
        Your filters and navigation are still safe. Retry the route and we will ask the backend for a fresh render.
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-8 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
      >
        Retry
      </button>
    </div>
  );
}

"use client";

import { useEffect } from "react";

export default function ProductsError({
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
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Listings unavailable</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black">The product grid could not refresh.</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">
        This keeps failed backend reads contained to the marketplace surface instead of collapsing the full app shell.
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-8 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
      >
        Try again
      </button>
    </div>
  );
}

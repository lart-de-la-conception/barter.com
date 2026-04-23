import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">404</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black">Listing not found</h1>
      <p className="mt-3 max-w-md text-neutral-600">
        That page does not exist in this mock marketplace yet.
      </p>
      <Link
        href="/products"
        className="mt-8 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
      >
        Browse Listings
      </Link>
    </div>
  );
}

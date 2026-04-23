export function SiteFooter() {
  return (
    <footer className="bg-[var(--background)] px-5 py-6 sm:px-6">
      <div className="mx-auto max-w-[1600px] text-sm text-neutral-500">
        <div className="flex items-center justify-between gap-4">
          <div className="font-semibold uppercase">
            © 2026 Barter
          </div>
          <a
            href="https://dylanroman.co"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-black underline-offset-4 transition hover:underline"
          >
            website by dylan
          </a>
        </div>
      </div>
    </footer>
  );
}

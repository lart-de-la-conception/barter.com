import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FavoritesProvider } from "@/components/favorites-context";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { getViewer, getViewerFavoriteIds } from "@/lib/data/marketplace";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Barter",
  description: "Designer marketplace mockup for trading Chrome Hearts, Supreme, Balenciaga, Maison Margiela, and Enfants Riches Deprimes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [viewer, initialFavoriteIds] = await Promise.all([
    getViewer(),
    getViewerFavoriteIds(),
  ]);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <FavoritesProvider
          key={`${viewer?.profileId ?? "anon"}:${initialFavoriteIds.join(",")}`}
          viewer={viewer}
          initialFavoriteIds={initialFavoriteIds}
        >
          <div className="flex min-h-screen flex-col">
            <SiteNavbar viewer={viewer} />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </FavoritesProvider>
      </body>
    </html>
  );
}

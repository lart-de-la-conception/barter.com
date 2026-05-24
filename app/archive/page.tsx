import { ArchiveIndexPage } from "@/components/marketplace-pages";
import { getArchiveIndexPageData } from "@/lib/data/marketplace";

export const metadata = {
  title: "Archive — Barter",
  description: "Seasonal catalog across all brands. Browse by season and year.",
};

export default async function ArchiveRoute() {
  const entries = await getArchiveIndexPageData();
  return <ArchiveIndexPage entries={entries} />;
}

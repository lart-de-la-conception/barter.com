import { notFound } from "next/navigation";
import { BrandArchivePage } from "@/components/marketplace-pages";
import { getBrandArchivePageData } from "@/lib/data/marketplace";

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function BrandArchiveRoute({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const season = readParam(resolvedSearchParams.season);

  const archiveData = await getBrandArchivePageData(slug, { season });

  if (!archiveData) {
    notFound();
  }

  return (
    <BrandArchivePage
      brand={archiveData.brand}
      pieces={archiveData.pieces}
      seasons={archiveData.seasons}
      activeSeasonKey={season?.toLowerCase()}
    />
  );
}

import { notFound } from "next/navigation";
import { BrandPage } from "@/components/marketplace-pages";
import { getBrandArchivePageData, getCatalogPageData } from "@/lib/data/marketplace";

export default async function BrandRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [archiveData, catalog] = await Promise.all([
    getBrandArchivePageData(slug),
    getCatalogPageData({ brandSlug: slug, searchQuery: "" }),
  ]);

  if (!archiveData) {
    notFound();
  }

  return (
    <BrandPage
      brand={archiveData.brand}
      listings={catalog.products}
      sellersById={catalog.sellersById}
    />
  );
}

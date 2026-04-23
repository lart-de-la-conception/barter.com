import { notFound } from "next/navigation";
import { ProductsPage } from "@/components/marketplace-pages";
import { getCatalogPageData, getProfilesBySlugs } from "@/lib/data/marketplace";

export default async function BrandRoute({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const q = (await searchParams).q;
  const searchQuery = typeof q === "string" ? q : "";
  const { brand, products } = await getCatalogPageData({ brandSlug: slug, searchQuery });

  if (!brand) {
    notFound();
  }

  const sellers = await getProfilesBySlugs(products.map((product) => product.sellerId));
  const sellersById = Object.fromEntries(sellers.map((seller) => [seller.id, seller]));

  return <ProductsPage brand={brand} products={products} searchQuery={searchQuery} sellersById={sellersById} />;
}

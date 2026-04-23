import { ProductsPage } from "@/components/marketplace-pages";
import { getCatalogPageData, getProfilesBySlugs } from "@/lib/data/marketplace";

export default async function ProductsRoute({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const q = (await searchParams).q;
  const searchQuery = typeof q === "string" ? q : "";
  const { brand, products } = await getCatalogPageData({ searchQuery });
  const sellers = await getProfilesBySlugs(products.map((product) => product.sellerId));
  const sellersById = Object.fromEntries(sellers.map((seller) => [seller.id, seller]));

  return <ProductsPage brand={brand} products={products} searchQuery={searchQuery} sellersById={sellersById} />;
}

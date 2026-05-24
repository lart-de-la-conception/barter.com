import { HomePage } from "@/components/marketplace-pages";
import { getHomePageData, getProfilesBySlugs, getViewer } from "@/lib/data/marketplace";

export default async function Home() {
  const [{ heroSlides, featuredProducts, stats }, viewer] = await Promise.all([
    getHomePageData(),
    getViewer(),
  ]);
  const sellers = await getProfilesBySlugs(featuredProducts.map((product) => product.sellerId));
  const sellersById = Object.fromEntries(sellers.map((seller) => [seller.id, seller]));

  return <HomePage heroSlides={heroSlides} featuredProducts={featuredProducts} stats={stats} sellersById={sellersById} viewer={viewer} />;
}

import { HomePage } from "@/components/marketplace-pages";
import { getHomePageData, getProfilesBySlugs } from "@/lib/data/marketplace";

export default async function Home() {
  const { heroSlides, featuredProducts, stats } = await getHomePageData();
  const sellers = await getProfilesBySlugs(featuredProducts.map((product) => product.sellerId));
  const sellersById = Object.fromEntries(sellers.map((seller) => [seller.id, seller]));

  return <HomePage heroSlides={heroSlides} featuredProducts={featuredProducts} stats={stats} sellersById={sellersById} />;
}

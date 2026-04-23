import { FavoritesPage } from "@/components/marketplace-pages";
import { getFavoritesPageData, getProfilesBySlugs } from "@/lib/data/marketplace";

export default async function FavoritesRoute() {
  const { watchedProducts } = await getFavoritesPageData();
  const sellers = await getProfilesBySlugs(watchedProducts.map((product) => product.sellerId));
  const sellersById = Object.fromEntries(sellers.map((seller) => [seller.id, seller]));

  return <FavoritesPage watchedProducts={watchedProducts} sellersById={sellersById} />;
}

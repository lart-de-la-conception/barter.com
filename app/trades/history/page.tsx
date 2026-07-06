import { TradeHistoryPage } from "@/components/marketplace-pages";
import { getProductsByIdsData, getProfilesBySlugs, getTradesPageData, requireViewer } from "@/lib/data/marketplace";

export default async function TradeHistoryRoute() {
  await requireViewer("/trades/history");

  const { trades } = await getTradesPageData();
  const completed = trades.filter((t) => t.status === "completed");

  const [users, products] = await Promise.all([
    getProfilesBySlugs(completed.map((t) => t.userId)),
    getProductsByIdsData(completed.flatMap((t) => [...t.yourItemIds, ...t.theirItemIds])),
  ]);

  const usersById = Object.fromEntries(users.map((u) => [u.id, u]));
  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));

  return (
    <TradeHistoryPage
      trades={completed}
      usersById={usersById}
      productsById={productsById}
    />
  );
}

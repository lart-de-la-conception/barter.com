import { TradesPage } from "@/components/marketplace-pages";
import { getProductsByIdsData, getProfilesBySlugs, getTradesPageData, requireViewer } from "@/lib/data/marketplace";

export default async function TradesRoute({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; filter?: string }>;
}) {
  await requireViewer("/trades");
  const { tab, filter } = await searchParams;
  const { trades } = await getTradesPageData();
  const users = await getProfilesBySlugs(trades.map((trade) => trade.userId));
  const products = await getProductsByIdsData(trades.flatMap((trade) => [...trade.yourItemIds, ...trade.theirItemIds]));
  const usersById = Object.fromEntries(users.map((user) => [user.id, user]));
  const productsById = Object.fromEntries(products.map((product) => [product.id, product]));

  return (
    <TradesPage
      trades={trades}
      usersById={usersById}
      productsById={productsById}
      initialActiveTab={tab === "sent" ? "sent" : "received"}
      initialFilter={filter === "pending" || filter === "accepted" || filter === "declined" ? filter : "all"}
    />
  );
}

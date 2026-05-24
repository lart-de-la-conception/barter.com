import { redirect } from "next/navigation";
import { MyClosetPage } from "@/components/marketplace-pages";
import { getClosetPageData } from "@/lib/data/marketplace";

export default async function ClosetRoute({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const tab = (await searchParams).tab;
  const initialTab =
    tab === "history" || tab === "purchases" || tab === "sales" ? (tab as "history" | "purchases" | "sales") : "all";
  const { currentUser, closetItems, trades, purchases, purchaseOrders, salesOrders, notifications } = await getClosetPageData();

  if (!currentUser) {
    redirect("/");
  }

  return (
    <MyClosetPage
      currentUser={currentUser}
      closetItems={closetItems}
      trades={trades}
      purchases={purchases}
      purchaseOrders={purchaseOrders}
      salesOrders={salesOrders}
      notifications={notifications}
      initialTab={initialTab}
    />
  );
}

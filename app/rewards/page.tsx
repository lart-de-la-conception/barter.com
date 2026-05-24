import { redirect } from "next/navigation";
import { RewardsPage } from "@/components/marketplace-pages";
import { getClosetPageData } from "@/lib/data/marketplace";

export const metadata = {
  title: "Rewards — Barter",
  description: "Earn points for every action on Barter and exchange them for exclusive benefits.",
};

export default async function RewardsRoute() {
  const { currentUser } = await getClosetPageData();

  if (!currentUser) {
    redirect("/login?next=/rewards");
  }

  return <RewardsPage user={currentUser} />;
}

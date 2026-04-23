import { notFound } from "next/navigation";
import { UserClosetPage } from "@/components/marketplace-pages";
import { getPublicProfilePageData, getViewer } from "@/lib/data/marketplace";

export default async function UserRoute({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const [data, viewer] = await Promise.all([
    getPublicProfilePageData(userId),
    getViewer(),
  ]);

  if (!data) {
    notFound();
  }

  return <UserClosetPage user={data.user} listingProducts={data.listingProducts} viewer={viewer} />;
}

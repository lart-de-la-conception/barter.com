import { BrandsIndexPage } from "@/components/marketplace-pages";
import { getBrandsPageData } from "@/lib/data/marketplace";

export const metadata = {
  title: "Brands — Barter",
  description: "Browse all designer brands available on Barter.",
};

export default async function BrandsRoute() {
  const { brands } = await getBrandsPageData();
  return <BrandsIndexPage brands={brands} />;
}

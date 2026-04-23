import { notFound } from "next/navigation";
import { ProductDetailPage } from "@/components/marketplace-pages";
import { getProductPageData } from "@/lib/data/marketplace";

export default async function ProductRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProductPageData(Number(id));

  if (!data) {
    notFound();
  }

  return (
    <ProductDetailPage
      product={data.product}
      seller={data.seller}
      currentCloset={data.currentCloset}
      similar={data.similar}
      viewer={data.viewer}
    />
  );
}

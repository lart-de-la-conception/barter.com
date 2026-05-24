import { notFound } from "next/navigation";
import { BrandArchivePiecePage } from "@/components/marketplace-pages";
import { getArchivePieceDetail } from "@/lib/data/marketplace";

export default async function BrandArchivePieceRoute({
  params,
}: {
  params: Promise<{ slug: string; pieceSlug: string }>;
}) {
  const { slug, pieceSlug } = await params;
  const data = await getArchivePieceDetail(slug, pieceSlug);

  if (!data) {
    notFound();
  }

  return (
    <BrandArchivePiecePage
      brand={data.brand}
      piece={data.piece}
      listings={data.listings}
      sellersById={data.sellersById}
    />
  );
}

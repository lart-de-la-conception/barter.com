import { notFound } from "next/navigation";
import { TradeMeetupPanel } from "@/components/trade-meetup";
import { getTradeDetailData, requireViewer } from "@/lib/data/marketplace";

export default async function TradeDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireViewer(`/trades/${id}`);

  const tradeId = Number(id);
  if (!Number.isInteger(tradeId) || tradeId <= 0) {
    notFound();
  }

  const data = await getTradeDetailData(tradeId);
  if (!data) {
    notFound();
  }

  return <TradeMeetupPanel data={data} />;
}

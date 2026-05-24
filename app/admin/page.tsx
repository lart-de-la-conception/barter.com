import { notFound } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getAdminDashboardData } from "@/lib/data/marketplace";

export default async function AdminRoute() {
  const data = await getAdminDashboardData();

  if (!data) {
    notFound();
  }

  return <AdminDashboard products={data.products} />;
}

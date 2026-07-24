import type { Metadata } from "next";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { getDashboardData, type DashboardPeriod } from "@/lib/data/dashboard";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Inicio" };

const periods: DashboardPeriod[] = ["week", "month", "previous-month", "three-months", "year"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const user = await requireUser();
  const { period: requestedPeriod } = await searchParams;
  const period = periods.includes(requestedPeriod as DashboardPeriod)
    ? (requestedPeriod as DashboardPeriod)
    : "month";
  const data = await getDashboardData(user, period);

  return <DashboardContent data={data} period={period} />;
}


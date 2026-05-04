import { auth } from "@/lib/auth";
import AnalyticsClient from "@/components/analytics/AnalyticsClient";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session) return null;
  return <AnalyticsClient />;
}

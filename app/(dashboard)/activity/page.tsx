import { auth } from "@/lib/auth";
import ActivityClient from "@/components/dashboard/ActivityClient";

export default async function ActivityPage() {
  const session = await auth();
  if (!session) return null;
  return <ActivityClient currentUserId={session.user.id} />;
}

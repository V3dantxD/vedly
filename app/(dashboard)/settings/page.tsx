import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import SettingsClient from "@/components/dashboard/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) return null;

  await connectDB();
  const user = await User.findById(session.user.id);

  return (
    <SettingsClient
      initialUser={{
        name: user?.name ?? session.user.name ?? "",
        email: user?.email ?? session.user.email ?? "",
        image: user?.image ?? session.user.image ?? "",
        timezone: user?.timezone ?? "Asia/Kolkata",
        notificationPrefs: user?.notificationPrefs ?? { email: true, inApp: true },
      }}
    />
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import BottomNav from "@/components/layout/BottomNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div>
      <Sidebar user={session.user} />
      <Topbar user={session.user} />
      <main className="main-content">
        <div style={{ padding: "1.5rem" }}>
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

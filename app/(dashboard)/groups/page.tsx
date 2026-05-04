import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Group from "@/models/Group";
import Link from "next/link";
import { Plus } from "lucide-react";
import UserAvatar from "@/components/layout/UserAvatar";

export default async function GroupsPage() {
  const session = await auth();
  if (!session) return null;

  await connectDB();
  const groups = await Group.find({ "members.userId": session.user.id })
    .populate("members.userId", "name email image")
    .sort({ createdAt: -1 });

  return (
    <div className="fade-in" style={{ maxWidth: "800px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
          Your Groups
        </h2>
        <Link href="/groups/new" style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
            <Plus size={16} /> New Group
          </button>
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
          <h3 style={{ fontFamily: "var(--font-display)", marginBottom: "0.5rem" }}>No groups yet</h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
            Create a group to split expenses with multiple people.
          </p>
          <Link href="/groups/new">
            <button className="btn-primary">Create your first group</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {groups.map((group) => {
            const memberCount = group.members.length;
            const userRole = group.members.find((m) => m.userId?._id?.toString() === session.user.id || m.userId?.toString() === session.user.id)?.role;

            return (
              <Link key={group._id.toString()} href={`/groups/${group._id}`} style={{ textDecoration: "none" }}>
                <div className="card card-hover" style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1rem" }}>
                    <div style={{
                      width: "48px", height: "48px",
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "24px", flexShrink: 0,
                    }}>
                      {group.emoji}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1rem", fontFamily: "var(--font-display)" }}>
                        {group.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {group.type} · {memberCount} member{memberCount !== 1 ? "s" : ""}
                        {userRole === "admin" && (
                          <span style={{
                            marginLeft: "0.5rem", padding: "1px 6px",
                            background: "var(--color-primary-muted)", color: "var(--color-primary)",
                            borderRadius: "99px", fontSize: "0.65rem", fontWeight: 600,
                          }}>Admin</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Member avatars */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {(group.members as unknown as { userId: { _id: string; name: string; image?: string } }[])
                      .slice(0, 5)
                      .map((m, i) => (
                        <div key={i} style={{ marginLeft: i > 0 ? "-8px" : 0, position: "relative", zIndex: 5 - i }}>
                          <UserAvatar name={m.userId?.name} image={m.userId?.image} size={28} />
                        </div>
                      ))}
                    {memberCount > 5 && (
                      <div style={{
                        marginLeft: "-8px", width: "28px", height: "28px",
                        borderRadius: "50%", background: "var(--color-surface-3)",
                        border: "2px solid var(--color-surface)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.65rem", color: "var(--color-text-muted)", fontWeight: 600,
                      }}>
                        +{memberCount - 5}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

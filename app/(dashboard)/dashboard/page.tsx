import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Expense from "@/models/Expense";
import { calculatePairBalance } from "@/lib/balance";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import UserAvatar from "@/components/layout/UserAvatar";
import { ArrowUpRight, ArrowDownRight, Plus, Users, Receipt } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  await connectDB();

  const user = await User.findById(session.user.id).populate("friends", "name email image");
  const friends = (user?.friends as unknown as { _id: string; name: string; email: string; image?: string }[]) ?? [];

  const balances = await Promise.all(
    friends.map(async (friend) => ({
      friend,
      amount: await calculatePairBalance(session.user.id, friend._id.toString()),
    }))
  );

  const totalOwed = balances.filter((b) => b.amount > 0).reduce((s, b) => s + b.amount, 0);
  const totalOwe = balances.filter((b) => b.amount < 0).reduce((s, b) => s + Math.abs(b.amount), 0);
  const net = totalOwed - totalOwe;

  const recentExpenses = await Expense.find({
    $or: [{ "paidBy.userId": session.user.id }, { "splits.userId": session.user.id }],
  })
    .populate("paidBy.userId splits.userId", "name image")
    .sort({ date: -1 })
    .limit(5);

  return (
    <div className="fade-in" style={{ maxWidth: "900px" }}>
      {/* Welcome */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
          Good {getGreeting()}, {session.user.name?.split(" ")[0]} 👋
        </p>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.5rem",
          fontWeight: 700,
          margin: 0,
          color: "var(--color-text-primary)",
        }}>
          Here's your balance overview
        </h2>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <SummaryCard
          label="Total you are owed"
          amount={totalOwed}
          type="positive"
          icon={<ArrowDownRight size={20} />}
        />
        <SummaryCard
          label="Total you owe"
          amount={totalOwe}
          type="negative"
          icon={<ArrowUpRight size={20} />}
        />
        <SummaryCard
          label="Net balance"
          amount={Math.abs(net)}
          type={net >= 0 ? "positive" : "negative"}
          prefix={net >= 0 ? "You are owed" : "You owe"}
        />
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <Link href="/expenses/new" style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
            <Plus size={16} /> Add Expense
          </button>
        </Link>
        <Link href="/groups/new" style={{ textDecoration: "none" }}>
          <button style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.5rem 1rem", borderRadius: "var(--radius-md)",
            background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)", cursor: "pointer", fontSize: "0.875rem",
            fontFamily: "var(--font-body)",
          }}>
            <Users size={16} /> New Group
          </button>
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Friend balances */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600 }}>
              Friend Balances
            </h3>
            <Link href="/friends" style={{ fontSize: "0.8rem", color: "var(--color-primary)", textDecoration: "none" }}>
              View all
            </Link>
          </div>
          {balances.length === 0 ? (
            <EmptyState icon="👥" text="No friends yet" cta="Add a friend" href="/friends" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {balances.filter((b) => Math.abs(b.amount) > 0.01).slice(0, 5).map(({ friend, amount }) => (
                <div key={friend._id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <UserAvatar name={friend.name} image={friend.image} size={34} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)" }}>{friend.name}</div>
                    <div style={{
                      fontSize: "0.75rem",
                      color: amount > 0 ? "var(--color-owed)" : "var(--color-owe)",
                    }}>
                      {amount > 0 ? `owes you ${formatINR(amount)}` : `you owe ${formatINR(Math.abs(amount))}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent expenses */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600 }}>
              Recent Expenses
            </h3>
          </div>
          {recentExpenses.length === 0 ? (
            <EmptyState icon="🧾" text="No expenses yet" cta="Add one" href="/expenses/new" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {recentExpenses.map((exp) => {
                const userSplit = exp.splits.find((s) => s.userId?._id?.toString() === session.user.id || s.userId?.toString() === session.user.id);
                return (
                  <div key={exp._id.toString()} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "var(--radius-md)",
                      background: "var(--color-surface-2)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
                      flexShrink: 0,
                    }}>
                      {getCategoryEmoji(exp.category)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {exp.description}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-owe)", flexShrink: 0 }}>
                      {formatINR(userSplit?.amount ?? 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, amount, type, icon, prefix }: {
  label: string; amount: number; type: "positive" | "negative" | "neutral";
  icon?: React.ReactNode; prefix?: string;
}) {
  const color = type === "positive" ? "var(--color-owed)" : type === "negative" ? "var(--color-owe)" : "var(--color-text-secondary)";
  return (
    <div className="card" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.5rem", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color, fontFamily: "var(--font-display)" }}>
        {formatINR(amount)}
      </div>
      {prefix && <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>{prefix}</div>}
      {icon && <div style={{ position: "absolute", top: "1rem", right: "1rem", color, opacity: 0.3 }}>{icon}</div>}
    </div>
  );
}

function EmptyState({ icon, text, cta, href }: { icon: string; text: string; cta: string; href: string }) {
  return (
    <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{icon}</div>
      <div style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{text}</div>
      <Link href={href} style={{
        fontSize: "0.8rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: 600,
      }}>{cta} →</Link>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function getCategoryEmoji(cat: string) {
  const map: Record<string, string> = {
    Food: "🍕", Travel: "✈️", Accommodation: "🏠", Utilities: "⚡",
    Entertainment: "🎬", Shopping: "🛍️", Healthcare: "💊", Education: "📚", Other: "📦",
  };
  return map[cat] ?? "📦";
}

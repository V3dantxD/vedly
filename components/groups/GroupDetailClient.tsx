"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/layout/UserAvatar";
import { formatINR } from "@/lib/utils";
import { Plus, Copy, UserPlus, Trash2, ArrowRightLeft, Settings } from "lucide-react";
import Link from "next/link";
import SettleUpModal from "@/components/expenses/SettleUpModal";

interface Member {
  userId: { _id: string; name: string; email: string; image?: string };
  role: "admin" | "member";
}

interface Group {
  _id: string;
  name: string;
  emoji: string;
  type: string;
  members: Member[];
  currency: string;
  simplifyDebts: boolean;
  inviteCode: string;
  createdBy: string;
}

interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  paidBy: { userId: { _id: string; name: string } ; amount: number }[];
  splits: { userId: { _id: string; name: string } | string; amount: number }[];
}

interface Balance {
  user: { _id: string; name: string; email: string; image?: string };
  amount: number;
}

interface SimplifiedDebt {
  from: { _id: string; name: string; image?: string };
  to: { _id: string; name: string; image?: string };
  amount: number;
}

export default function GroupDetailClient({
  group: initialGroup,
  currentUserId,
  userRole,
}: {
  group: Group;
  currentUserId: string;
  userRole: "admin" | "member";
}) {
  const router = useRouter();
  const [group, setGroup] = useState(initialGroup);
  const [tab, setTab] = useState<"expenses" | "balances" | "members">("expenses");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [simplified, setSimplified] = useState<SimplifiedDebt[] | null>(null);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [settleTarget, setSettleTarget] = useState<{ friend: { _id: string; name: string; email: string; image?: string }; balance: number } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState(group.name);

  useEffect(() => {
    if (tab === "expenses") fetchExpenses();
    if (tab === "balances") fetchBalances();
  }, [tab]);

  useEffect(() => { fetchExpenses(); }, []);

  async function fetchExpenses() {
    setLoadingExpenses(true);
    try {
      const res = await fetch(`/api/expenses?groupId=${group._id}`);
      const data = await res.json();
      setExpenses(data.expenses ?? []);
    } finally {
      setLoadingExpenses(false);
    }
  }

  async function fetchBalances() {
    setLoadingBalances(true);
    try {
      const res = await fetch(`/api/balances/group/${group._id}`);
      const data = await res.json();
      setBalances(data.balances ?? []);
      setSimplified(data.simplified);
    } finally {
      setLoadingBalances(false);
    }
  }

  async function addMember() {
    if (!inviteEmail.trim()) return;
    try {
      const res = await fetch(`/api/groups/${group._id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Member added!");
      setInviteEmail("");
      router.refresh();
    } catch {
      toast.error("Failed to add member");
    }
  }

  async function removeMember(userId: string) {
    if (!confirm("Remove this member?")) return;
    try {
      const res = await fetch(`/api/groups/${group._id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) { toast.error("Failed to remove member"); return; }
      toast.success("Member removed");
      router.refresh();
    } catch { toast.error("Failed to remove member"); }
  }

  async function deleteGroup() {
    if (!confirm(`Delete "${group.name}"? This will delete all expenses.`)) return;
    try {
      const res = await fetch(`/api/groups/${group._id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete group"); return; }
      toast.success("Group deleted");
      router.push("/groups");
    } catch { toast.error("Failed to delete group"); }
  }

  async function saveGroupName() {
    try {
      const res = await fetch(`/api/groups/${group._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      if (!res.ok) { toast.error("Failed to update"); return; }
      setGroup({ ...group, name: editName });
      toast.success("Group updated");
      setShowSettings(false);
    } catch { toast.error("Failed to update"); }
  }

  async function toggleSimplify() {
    const res = await fetch(`/api/groups/${group._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simplifyDebts: !group.simplifyDebts }),
    });
    if (res.ok) {
      setGroup({ ...group, simplifyDebts: !group.simplifyDebts });
      if (tab === "balances") fetchBalances();
    }
  }

  const getCategoryEmoji = (cat: string) => {
    const m: Record<string, string> = { Food: "🍕", Travel: "✈️", Accommodation: "🏠", Utilities: "⚡", Entertainment: "🎬", Shopping: "🛍️", Healthcare: "💊", Education: "📚", Other: "📦" };
    return m[cat] ?? "📦";
  };

  return (
    <div className="fade-in" style={{ maxWidth: "800px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{
          width: "52px", height: "52px", borderRadius: "var(--radius-md)",
          background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "26px", flexShrink: 0,
        }}>{group.emoji}</div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 700, margin: "0 0 0.125rem" }}>
            {group.name}
          </h2>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            {group.type} · {group.members.length} members
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href={`/expenses/new?groupId=${group._id}`} style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
              <Plus size={15} /> Add Expense
            </button>
          </Link>
          {userRole === "admin" && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                padding: "0.45rem 0.625rem", borderRadius: "var(--radius-md)",
                background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)", cursor: "pointer", display: "flex",
              }}
            >
              <Settings size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Invite code */}
      <div style={{
        display: "flex", alignItems: "center", gap: "1rem",
        padding: "0.875rem 1.25rem",
        background: "linear-gradient(145deg, var(--color-surface-2) 0%, var(--color-surface) 100%)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
        borderRadius: "var(--radius-lg)",
        marginBottom: "1.5rem",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative glow */}
        <div style={{
          position: "absolute", top: "-50%", left: "-10%", width: "120px", height: "120px",
          background: "var(--color-primary)", filter: "blur(60px)", opacity: 0.15, pointerEvents: "none"
        }} />
        
        <div style={{ zIndex: 1, position: "relative" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: "0.25rem" }}>
            Group Invite Code
          </div>
          <div style={{ 
            fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.1rem",
            color: "var(--color-primary)", letterSpacing: "0.15em",
            textShadow: "0 0 12px var(--color-primary-muted)"
          }}>
            {group.inviteCode}
          </div>
        </div>
        
        <button
          onClick={() => { navigator.clipboard.writeText(group.inviteCode); toast.success("Copied!"); }}
          style={{ 
            marginLeft: "auto", background: "var(--color-surface-3)", border: "1px solid var(--color-border-light)", 
            cursor: "pointer", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.5rem 0.875rem", borderRadius: "var(--radius-md)", fontSize: "0.75rem", fontWeight: 600,
            transition: "all 200ms ease",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            zIndex: 1,
            position: "relative"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "var(--color-primary)";
            e.currentTarget.style.color = "#0f1117";
            e.currentTarget.style.borderColor = "var(--color-primary)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "var(--color-surface-3)";
            e.currentTarget.style.color = "var(--color-text-primary)";
            e.currentTarget.style.borderColor = "var(--color-border-light)";
          }}
        >
          <Copy size={14} strokeWidth={2.5} />
          <span>Copy</span>
        </button>
      </div>

      {/* Settings panel (admin only) */}
      {showSettings && userRole === "admin" && (
        <div className="card" style={{ marginBottom: "1.25rem", border: "1px solid var(--color-primary-muted)" }}>
          <h4 style={{ fontFamily: "var(--font-display)", margin: "0 0 1rem", fontWeight: 600 }}>Group Settings</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", display: "block", marginBottom: "0.4rem" }}>Group Name</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    flex: 1, padding: "0.5rem 0.75rem",
                    background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)", color: "var(--color-text-primary)",
                    fontSize: "0.875rem", fontFamily: "var(--font-body)", outline: "none",
                  }}
                />
                <button onClick={saveGroupName} className="btn-primary" style={{ fontSize: "0.8rem" }}>Save</button>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)" }}>Simplify Debts</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Minimize the number of transactions</div>
              </div>
              <button
                onClick={toggleSimplify}
                style={{
                  width: "44px", height: "24px", borderRadius: "99px",
                  background: group.simplifyDebts ? "var(--color-primary)" : "var(--color-surface-3)",
                  border: "none", cursor: "pointer", position: "relative", transition: "background 200ms",
                }}
              >
                <span style={{
                  position: "absolute", top: "3px",
                  left: group.simplifyDebts ? "23px" : "3px",
                  width: "18px", height: "18px", borderRadius: "50%",
                  background: "#fff", transition: "left 200ms",
                }} />
              </button>
            </div>
            <button
              onClick={deleteGroup}
              style={{
                padding: "0.5rem", borderRadius: "var(--radius-md)",
                background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
                color: "var(--color-owe)", cursor: "pointer",
                fontSize: "0.8rem", fontFamily: "var(--font-body)", display: "flex",
                alignItems: "center", justifyContent: "center", gap: "0.4rem",
              }}
            >
              <Trash2 size={14} /> Delete Group
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", padding: "3px" }}>
        {(["expenses", "balances", "members"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: "0.5rem", borderRadius: "8px",
              background: tab === t ? "var(--color-surface)" : "transparent",
              border: "none", cursor: "pointer",
              color: tab === t ? "var(--color-text-primary)" : "var(--color-text-muted)",
              fontSize: "0.8rem", fontWeight: tab === t ? 600 : 400,
              fontFamily: "var(--font-body)", transition: "all 150ms",
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Expenses */}
      {tab === "expenses" && (
        <div>
          {loadingExpenses ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: "72px" }} />)}
            </div>
          ) : expenses.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🧾</div>
              <div style={{ color: "var(--color-text-muted)", marginBottom: "1rem" }}>No expenses yet</div>
              <Link href={`/expenses/new?groupId=${group._id}`} style={{ textDecoration: "none" }}>
                <button className="btn-primary" style={{ fontSize: "0.875rem" }}>Add first expense</button>
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {expenses.map((exp) => {
                const myShare = exp.splits.find((s) => {
                  const uid = typeof s.userId === "string" ? s.userId : s.userId?._id;
                  return uid === currentUserId || uid?.toString() === currentUserId;
                });
                const paidByMe = exp.paidBy.find((p) => {
                  const uid = typeof p.userId === "string" ? p.userId : p.userId?._id;
                  return uid === currentUserId || uid?.toString() === currentUserId;
                });
                return (
                  <div key={exp._id} className="card card-hover" style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.875rem 1rem" }}>
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "var(--radius-md)",
                      background: "var(--color-surface-2)", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: "20px", flexShrink: 0,
                    }}>
                      {getCategoryEmoji(exp.category)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {exp.description}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {" · "}
                        {paidByMe ? "you paid" : `paid by ${exp.paidBy[0]?.userId?.name ?? "someone"}`}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", fontFamily: "var(--font-display)" }}>
                        {formatINR(exp.amount)}
                      </div>
                      {myShare && (
                        <div style={{ fontSize: "0.7rem", color: paidByMe ? "var(--color-owed)" : "var(--color-owe)" }}>
                          {paidByMe ? "you lent" : "your share"} {formatINR(myShare.amount)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Balances */}
      {tab === "balances" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {loadingBalances ? (
            [1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: "60px" }} />)
          ) : (
            <>
              {group.simplifyDebts && simplified && simplified.length > 0 && (
                <div style={{ marginBottom: "0.5rem" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                    Suggested Settlements
                  </div>
                  {simplified.map((debt, i) => (
                    <div key={i} className="card" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", marginBottom: "0.5rem" }}>
                      <UserAvatar name={debt.from?.name} image={debt.from?.image} size={32} />
                      <div style={{ flex: 1, fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                        <strong style={{ color: "var(--color-text-primary)" }}>{debt.from?.name}</strong> pays{" "}
                        <strong style={{ color: "var(--color-text-primary)" }}>{debt.to?.name}</strong>
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--color-owe)", fontFamily: "var(--font-display)" }}>
                        {formatINR(debt.amount)}
                      </div>
                      {(debt.from?._id === currentUserId) && (
                        <button
                          onClick={() => setSettleTarget({ friend: { ...debt.to, email: "" }, balance: -debt.amount })}
                          style={{
                            padding: "4px 8px", borderRadius: "6px",
                            background: "var(--color-primary-muted)", border: "none",
                            color: "var(--color-primary)", cursor: "pointer",
                            fontSize: "0.7rem", fontWeight: 600, fontFamily: "var(--font-body)",
                          }}
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                All Balances
              </div>
              {balances.filter((b) => Math.abs(b.amount) > 0.01).map(({ user, amount }) => (
                <div key={user._id} className="card" style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.75rem 1rem" }}>
                  <UserAvatar name={user.name} image={user.image} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{user.name}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", fontFamily: "var(--font-display)", color: amount > 0 ? "var(--color-owed)" : "var(--color-owe)" }}>
                    {amount > 0 ? "+" : ""}{formatINR(amount)}
                  </div>
                </div>
              ))}
              {balances.every((b) => Math.abs(b.amount) < 0.01) && (
                <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
                  <div style={{ color: "var(--color-owed)", fontWeight: 600 }}>All settled up!</div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Members */}
      {tab === "members" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {userRole === "admin" && (
            <div className="card" style={{ padding: "1rem" }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem" }}>Add Member</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  onKeyDown={(e) => e.key === "Enter" && addMember()}
                  style={{
                    flex: 1, padding: "0.5rem 0.75rem",
                    background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)", color: "var(--color-text-primary)",
                    fontSize: "0.875rem", fontFamily: "var(--font-body)", outline: "none",
                  }}
                />
                <button onClick={addMember} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
                  <UserPlus size={14} /> Add
                </button>
              </div>
            </div>
          )}
          {group.members.map((member) => {
            const u = member.userId;
            const isMe = u?._id === currentUserId;
            return (
              <div key={u?._id} className="card" style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.875rem 1rem" }}>
                <UserAvatar name={u?.name} image={u?.image} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{u?.name} {isMe && <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(you)</span>}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{u?.email}</div>
                </div>
                <span style={{
                  padding: "2px 8px", borderRadius: "99px", fontSize: "0.7rem", fontWeight: 600,
                  background: member.role === "admin" ? "var(--color-primary-muted)" : "var(--color-surface-2)",
                  color: member.role === "admin" ? "var(--color-primary)" : "var(--color-text-muted)",
                }}>
                  {member.role}
                </span>
                {userRole === "admin" && !isMe && (
                  <button
                    onClick={() => removeMember(u?._id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {settleTarget && (
        <SettleUpModal
          friend={settleTarget.friend}
          balance={settleTarget.balance}
          currentUserId={currentUserId}
          groupId={group._id}
          onClose={() => setSettleTarget(null)}
          onSettled={() => { setSettleTarget(null); fetchBalances(); }}
        />
      )}
    </div>
  );
}

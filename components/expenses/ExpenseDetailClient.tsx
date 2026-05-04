"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatDistanceToNow, format } from "date-fns";
import { Trash2, Pencil, ArrowLeft } from "lucide-react";
import UserAvatar from "@/components/layout/UserAvatar";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import { CATEGORY_ICONS } from "@/types";

interface Person {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

interface Expense {
  _id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  paidBy: { userId: Person; amount: number }[];
  splits: { userId: Person; amount: number; splitType: string }[];
  groupId?: string;
  date: string;
  notes?: string;
  createdBy: Person;
  createdAt: string;
  updatedAt: string;
}

export default function ExpenseDetailClient({
  expense,
  currentUserId,
}: {
  expense: Expense;
  currentUserId: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const isCreator =
    expense.createdBy?._id === currentUserId ||
    expense.createdBy?.toString() === currentUserId;

  const myPaid = expense.paidBy.find(
    (p) => p.userId?._id === currentUserId || p.userId?.toString() === currentUserId
  );
  const mySplit = expense.splits.find(
    (s) => s.userId?._id === currentUserId || s.userId?.toString() === currentUserId
  );

  const myNet = (myPaid?.amount ?? 0) - (mySplit?.amount ?? 0);

  async function handleDelete() {
    if (!confirm(`Delete "${expense.description}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/expenses/${expense._id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete expense"); return; }
      toast.success("Expense deleted");
      router.push(expense.groupId ? `/groups/${expense.groupId}` : "/dashboard");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  }

  const categoryEmoji = CATEGORY_ICONS[expense.category as keyof typeof CATEGORY_ICONS] ?? "📦";

  return (
    <div className="fade-in" style={{ maxWidth: "580px" }}>
      {/* Back button */}
      <button
        onClick={() => router.back()}
        style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          background: "none", border: "none", cursor: "pointer",
          color: "var(--color-text-muted)", fontSize: "0.875rem",
          fontFamily: "var(--font-body)", marginBottom: "1.25rem", padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "var(--radius-md)",
            background: "var(--color-surface-2)", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: "28px", flexShrink: 0,
          }}>
            {categoryEmoji}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{
              fontFamily: "var(--font-display)", fontSize: "1.35rem",
              fontWeight: 700, margin: "0 0 0.25rem",
            }}>
              {expense.description}
            </h2>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              <span style={{
                padding: "2px 8px", borderRadius: "99px",
                background: "var(--color-surface-2)", fontSize: "0.75rem",
              }}>
                {expense.category}
              </span>
              <span>{format(new Date(expense.date), "dd MMM yyyy")}</span>
              <span title={new Date(expense.createdAt).toLocaleString()}>
                Added {formatDistanceToNow(new Date(expense.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          {isCreator && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link href={`/expenses/${expense._id}/edit`}>
                <button style={{
                  padding: "6px 8px", borderRadius: "8px",
                  background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
                  cursor: "pointer", color: "var(--color-text-secondary)", display: "flex",
                }}>
                  <Pencil size={15} />
                </button>
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "6px 8px", borderRadius: "8px",
                  background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
                  cursor: "pointer", color: "var(--color-owe)", display: "flex",
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Total + my net */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem", marginTop: "1.25rem",
        }}>
          <div style={{
            background: "var(--color-surface-2)", borderRadius: "var(--radius-md)",
            padding: "0.875rem",
          }}>
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginBottom: "0.25rem", fontWeight: 500 }}>
              TOTAL AMOUNT
            </div>
            <div style={{
              fontSize: "1.5rem", fontWeight: 700,
              fontFamily: "var(--font-display)", color: "var(--color-text-primary)",
            }}>
              {formatINR(expense.amount)}
            </div>
          </div>
          <div style={{
            background: myNet > 0 ? "rgba(91,197,167,0.08)" : myNet < 0 ? "rgba(248,113,113,0.08)" : "var(--color-surface-2)",
            borderRadius: "var(--radius-md)", padding: "0.875rem",
            border: `1px solid ${myNet > 0 ? "rgba(91,197,167,0.2)" : myNet < 0 ? "rgba(248,113,113,0.2)" : "transparent"}`,
          }}>
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginBottom: "0.25rem", fontWeight: 500 }}>
              YOUR NET
            </div>
            <div style={{
              fontSize: "1.5rem", fontWeight: 700,
              fontFamily: "var(--font-display)",
              color: myNet > 0 ? "var(--color-owed)" : myNet < 0 ? "var(--color-owe)" : "var(--color-text-muted)",
            }}>
              {myNet > 0 ? "+" : ""}{formatINR(myNet)}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
              {myNet > 0 ? "you lent" : myNet < 0 ? "you owe" : "settled"}
            </div>
          </div>
        </div>

        {expense.notes && (
          <div style={{
            marginTop: "1rem", padding: "0.75rem",
            background: "var(--color-surface-2)", borderRadius: "var(--radius-md)",
            fontSize: "0.875rem", color: "var(--color-text-secondary)",
            borderLeft: "3px solid var(--color-border)",
          }}>
            {expense.notes}
          </div>
        )}
      </div>

      {/* Paid by */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, margin: "0 0 1rem", fontSize: "0.9rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Paid By
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {expense.paidBy.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <UserAvatar name={p.userId?.name} image={p.userId?.image} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  {p.userId?._id === currentUserId ? "You" : p.userId?.name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{p.userId?.email}</div>
              </div>
              <div style={{
                fontWeight: 700, fontSize: "1rem",
                fontFamily: "var(--font-display)", color: "var(--color-owed)",
              }}>
                {formatINR(p.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Splits */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, margin: "0 0 1rem", fontSize: "0.9rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Split Between
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {expense.splits.map((s, i) => {
            const isMe = s.userId?._id === currentUserId || s.userId?.toString() === currentUserId;
            const paid = expense.paidBy.find(
              (p) => p.userId?._id === s.userId?._id || p.userId?.toString() === s.userId?.toString()
            );
            const net = (paid?.amount ?? 0) - s.amount;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.625rem 0.75rem",
                background: isMe ? "var(--color-surface-2)" : "transparent",
                borderRadius: "var(--radius-md)",
              }}>
                <UserAvatar name={s.userId?.name} image={s.userId?.image} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: isMe ? 700 : 500, fontSize: "0.9rem" }}>
                    {isMe ? "You" : s.userId?.name}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                    {s.splitType} split
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", fontFamily: "var(--font-display)" }}>
                    {formatINR(s.amount)}
                  </div>
                  {Math.abs(net) > 0.01 && (
                    <div style={{
                      fontSize: "0.7rem",
                      color: net > 0 ? "var(--color-owed)" : "var(--color-owe)",
                    }}>
                      {net > 0 ? `gets back ${formatINR(net)}` : `owes ${formatINR(Math.abs(net))}`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metadata */}
      <div className="card" style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
          <span>Added by</span>
          <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
            {expense.createdBy?._id === currentUserId ? "You" : expense.createdBy?.name}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
          <span>Created</span>
          <span>{format(new Date(expense.createdAt), "dd MMM yyyy, hh:mm a")}</span>
        </div>
        {expense.updatedAt !== expense.createdAt && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Last edited</span>
            <span>{format(new Date(expense.updatedAt), "dd MMM yyyy, hh:mm a")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

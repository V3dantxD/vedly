"use client";
import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft, ArrowRightLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/layout/UserAvatar";
import { formatINR } from "@/lib/utils";
import SettleUpModal from "@/components/expenses/SettleUpModal";
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
  category: string;
  date: string;
  paidBy: { userId: Person; amount: number }[];
  splits: { userId: Person | string; amount: number }[];
  createdBy: Person;
}

interface Settlement {
  _id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  paymentMethod: string;
  date: string;
  note?: string;
}

interface Props {
  friend: Person;
  expenses: Expense[];
  settlements: Settlement[];
  balance: number;
  currentUserId: string;
}

type Tab = "expenses" | "settlements";

export default function FriendDetailClient({
  friend,
  expenses,
  settlements,
  balance: initialBalance,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("expenses");
  const [balance, setBalance] = useState(initialBalance);
  const [showSettle, setShowSettle] = useState(false);

  const youOwe = balance < 0;
  const settled = Math.abs(balance) < 0.01;

  return (
    <div className="fade-in" style={{ maxWidth: "640px" }}>
      {/* Back */}
      <button
        onClick={() => router.back()}
        style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          background: "none", border: "none", cursor: "pointer",
          color: "var(--color-text-muted)", fontSize: "0.875rem",
          fontFamily: "var(--font-body)", marginBottom: "1.25rem", padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Friends
      </button>

      {/* Friend card */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <UserAvatar name={friend.name} image={friend.image} size={56} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 700, margin: "0 0 0.2rem" }}>
              {friend.name}
            </h2>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{friend.email}</div>
          </div>
          {!settled && (
            <button
              onClick={() => setShowSettle(true)}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}
            >
              <ArrowRightLeft size={15} />
              Settle Up
            </button>
          )}
        </div>

        {/* Balance banner */}
        <div style={{
          marginTop: "1.25rem",
          padding: "1rem",
          borderRadius: "var(--radius-md)",
          background: settled
            ? "var(--color-surface-2)"
            : youOwe
            ? "rgba(248,113,113,0.08)"
            : "rgba(91,197,167,0.08)",
          border: `1px solid ${settled ? "var(--color-border)" : youOwe ? "rgba(248,113,113,0.25)" : "rgba(91,197,167,0.25)"}`,
          textAlign: "center",
        }}>
          {settled ? (
            <>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>✅</div>
              <div style={{ fontWeight: 600, color: "var(--color-owed)" }}>All settled up!</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                {youOwe ? `You owe ${friend.name}` : `${friend.name} owes you`}
              </div>
              <div style={{
                fontSize: "2rem", fontWeight: 700,
                fontFamily: "var(--font-display)",
                color: youOwe ? "var(--color-owe)" : "var(--color-owed)",
              }}>
                {formatINR(Math.abs(balance))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", padding: "3px" }}>
        {(["expenses", "settlements"] as Tab[]).map((t) => (
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
            {t} {t === "expenses" ? `(${expenses.length})` : `(${settlements.length})`}
          </button>
        ))}
      </div>

      {/* Expenses tab */}
      {tab === "expenses" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {expenses.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🧾</div>
              <div style={{ color: "var(--color-text-muted)" }}>No shared expenses yet</div>
              <div style={{ marginTop: "1rem" }}>
                <Link href={`/expenses/new`} style={{ textDecoration: "none" }}>
                  <button className="btn-primary" style={{ fontSize: "0.875rem" }}>Add expense</button>
                </Link>
              </div>
            </div>
          ) : (
            expenses.map((exp) => {
              const myPaid = exp.paidBy.find(
                (p) => p.userId?._id === currentUserId || p.userId?.toString() === currentUserId
              );
              const mySplit = exp.splits.find((s) => {
                const uid = typeof s.userId === "string" ? s.userId : s.userId?._id;
                return uid === currentUserId || uid?.toString() === currentUserId;
              });
              const friendPaid = exp.paidBy.find(
                (p) => p.userId?._id === friend._id || p.userId?.toString() === friend._id
              );
              const iLent = !!myPaid && !!(mySplit && (myPaid.amount > mySplit.amount));
              const emoji = CATEGORY_ICONS[exp.category as keyof typeof CATEGORY_ICONS] ?? "📦";

              return (
                <Link key={exp._id} href={`/expenses/${exp._id}`} style={{ textDecoration: "none" }}>
                  <div className="card card-hover" style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.875rem 1rem", cursor: "pointer" }}>
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "var(--radius-md)",
                      background: "var(--color-surface-2)", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: "20px", flexShrink: 0,
                    }}>
                      {emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {exp.description}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {format(new Date(exp.date), "dd MMM yyyy")}
                        {" · "}
                        {myPaid
                          ? "you paid"
                          : friendPaid
                          ? `${friend.name} paid`
                          : "split"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.875rem", fontFamily: "var(--font-display)" }}>
                        {formatINR(exp.amount)}
                      </div>
                      {mySplit && (
                        <div style={{
                          fontSize: "0.7rem",
                          color: iLent ? "var(--color-owed)" : "var(--color-owe)",
                        }}>
                          {iLent ? `you lent ${formatINR((myPaid?.amount ?? 0) - mySplit.amount)}` : `your share ${formatINR(mySplit.amount)}`}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* Settlements tab */}
      {tab === "settlements" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {settlements.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>💸</div>
              <div style={{ color: "var(--color-text-muted)" }}>No settlements yet</div>
            </div>
          ) : (
            settlements.map((s) => {
              const iPaid = s.fromUserId === currentUserId || s.fromUserId?.toString() === currentUserId;
              return (
                <div key={s._id} className="card" style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.875rem 1rem" }}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "50%",
                    background: iPaid ? "rgba(91,197,167,0.15)" : "rgba(248,113,113,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "20px", flexShrink: 0,
                  }}>
                    💸
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      {iPaid ? `You paid ${friend.name}` : `${friend.name} paid you`}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {format(new Date(s.date), "dd MMM yyyy")} · {s.paymentMethod}
                      {s.note && ` · "${s.note}"`}
                    </div>
                  </div>
                  <div style={{
                    fontWeight: 700, fontSize: "1rem",
                    fontFamily: "var(--font-display)",
                    color: iPaid ? "var(--color-owe)" : "var(--color-owed)",
                  }}>
                    {formatINR(s.amount)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Settle up modal */}
      {showSettle && (
        <SettleUpModal
          friend={friend}
          balance={balance}
          currentUserId={currentUserId}
          onClose={() => setShowSettle(false)}
          onSettled={(newBalance) => {
            setBalance(newBalance);
            setShowSettle(false);
          }}
        />
      )}
    </div>
  );
}

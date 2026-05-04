"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import UserAvatar from "@/components/layout/UserAvatar";
import { formatINR } from "@/lib/utils";
import { UserPlus, Trash2, ArrowRightLeft } from "lucide-react";
import SettleUpModal from "@/components/expenses/SettleUpModal";

interface FriendBalance {
  friend: { _id: string; name: string; email: string; image?: string };
  amount: number;
}

interface Props {
  initialBalances: FriendBalance[];
  currentUserId: string;
}

export default function FriendsClient({ initialBalances, currentUserId }: Props) {
  const [balances, setBalances] = useState(initialBalances);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [settleTarget, setSettleTarget] = useState<FriendBalance | null>(null);

  async function addFriend() {
    if (!email.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setBalances((prev) => [...prev, { friend: data.friend, amount: 0 }]);
      setEmail("");
      toast.success(`${data.friend.name} added as friend!`);
    } catch {
      toast.error("Failed to add friend");
    } finally {
      setAdding(false);
    }
  }

  async function removeFriend(id: string) {
    if (!confirm("Remove this friend?")) return;
    try {
      const res = await fetch(`/api/friends/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to remove friend"); return; }
      setBalances((prev) => prev.filter((b) => b.friend._id !== id));
      toast.success("Friend removed");
    } catch {
      toast.error("Failed to remove friend");
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: "700px" }}>
      {/* Add friend */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontFamily: "var(--font-display)", margin: "0 0 1rem", fontWeight: 600 }}>Add a Friend</h3>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter their email address"
            onKeyDown={(e) => e.key === "Enter" && addFriend()}
            style={{
              flex: 1,
              padding: "0.625rem 0.875rem",
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-primary)",
              fontSize: "0.875rem",
              fontFamily: "var(--font-body)",
              outline: "none",
            }}
          />
          <button
            onClick={addFriend}
            disabled={adding || !email.trim()}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}
          >
            <UserPlus size={16} />
            {adding ? "Adding..." : "Add Friend"}
          </button>
        </div>
      </div>

      {/* Friends list */}
      {balances.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
          <h3 style={{ fontFamily: "var(--font-display)", marginBottom: "0.5rem" }}>No friends yet</h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
            Add friends by their email to start splitting expenses together.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {balances.map(({ friend, amount }) => (
            <div
              key={friend._id}
              className="card card-hover"
              style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem" }}
            >
              <UserAvatar name={friend.name} image={friend.image} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--color-text-primary)" }}>
                  {friend.name}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{friend.email}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {Math.abs(amount) < 0.01 ? (
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Settled up</div>
                ) : (
                  <>
                    <div style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: amount > 0 ? "var(--color-owed)" : "var(--color-owe)",
                      fontFamily: "var(--font-display)",
                    }}>
                      {formatINR(Math.abs(amount))}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {amount > 0 ? "owes you" : "you owe"}
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {Math.abs(amount) > 0.01 && (
                  <button
                    onClick={() => setSettleTarget({ friend, amount })}
                    title="Settle up"
                    style={{
                      padding: "6px 8px", borderRadius: "8px",
                      background: "var(--color-primary-muted)",
                      border: "none", cursor: "pointer", color: "var(--color-primary)",
                      display: "flex",
                    }}
                  >
                    <ArrowRightLeft size={14} />
                  </button>
                )}
                <button
                  onClick={() => removeFriend(friend._id)}
                  title="Remove friend"
                  style={{
                    padding: "6px 8px", borderRadius: "8px",
                    background: "transparent",
                    border: "none", cursor: "pointer", color: "var(--color-text-muted)",
                    display: "flex",
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {settleTarget && (
        <SettleUpModal
          friend={settleTarget.friend}
          balance={settleTarget.amount}
          currentUserId={currentUserId}
          onClose={() => setSettleTarget(null)}
          onSettled={(newAmount) => {
            setBalances((prev) =>
              prev.map((b) =>
                b.friend._id === settleTarget.friend._id ? { ...b, amount: newAmount } : b
              )
            );
            setSettleTarget(null);
          }}
        />
      )}
    </div>
  );
}

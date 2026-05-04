"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { formatINR } from "@/lib/utils";
import { X } from "lucide-react";

interface Props {
  friend: { _id: string; name: string; email: string; image?: string };
  balance: number; // positive = they owe you, negative = you owe them
  currentUserId: string;
  groupId?: string;
  onClose: () => void;
  onSettled?: (newBalance: number) => void;
}

const PAYMENT_METHODS = ["Cash", "UPI", "Bank Transfer", "PayPal", "Other"] as const;

export default function SettleUpModal({ friend, balance, currentUserId, groupId, onClose, onSettled }: Props) {
  const youOwe = balance < 0;
  const absAmount = Math.abs(balance);

  const [amount, setAmount] = useState(absAmount.toFixed(2));
  const [method, setMethod] = useState<typeof PAYMENT_METHODS[number]>("UPI");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSettle() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: youOwe ? friend._id : currentUserId,
          fromUserId: youOwe ? currentUserId : friend._id,
          amount: amt,
          paymentMethod: method,
          note,
          groupId,
        }),
      });

      if (!res.ok) { toast.error("Settlement failed"); return; }
      toast.success("Settlement recorded! 🎉");
      onSettled?.(youOwe ? balance + amt : balance - amt);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: "1rem",
    }} onClick={onClose}>
      <div
        className="card fade-in"
        style={{ width: "100%", maxWidth: "420px", padding: "1.5rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700 }}>Settle Up</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{
          background: "var(--color-surface-2)",
          borderRadius: "var(--radius-md)",
          padding: "1rem",
          marginBottom: "1.25rem",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
            {youOwe ? `You owe ${friend.name}` : `${friend.name} owes you`}
          </div>
          <div style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            color: youOwe ? "var(--color-owe)" : "var(--color-owed)",
          }}>
            {formatINR(absAmount)}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", display: "block", marginBottom: "0.4rem", fontWeight: 500 }}>
              Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              style={{
                width: "100%",
                padding: "0.625rem 0.875rem",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text-primary)",
                fontSize: "1.1rem",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", display: "block", marginBottom: "0.4rem", fontWeight: 500 }}>
              Payment Method
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: "99px",
                    border: "1px solid",
                    borderColor: method === m ? "var(--color-primary)" : "var(--color-border)",
                    background: method === m ? "var(--color-primary-muted)" : "transparent",
                    color: method === m ? "var(--color-primary)" : "var(--color-text-secondary)",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: method === m ? 600 : 400,
                    fontFamily: "var(--font-body)",
                    transition: "all 150ms",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", display: "block", marginBottom: "0.4rem", fontWeight: 500 }}>
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              style={{
                width: "100%",
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
          </div>

          <button
            onClick={handleSettle}
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem" }}
          >
            {loading ? "Recording..." : `Record Payment of ₹${parseFloat(amount || "0").toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

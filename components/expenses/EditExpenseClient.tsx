"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import UserAvatar from "@/components/layout/UserAvatar";
import { formatINR } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

type SplitType = "equal" | "exact" | "percent" | "shares" | "adjustment";
type Category =
  | "Food" | "Travel" | "Accommodation" | "Utilities"
  | "Entertainment" | "Shopping" | "Healthcare" | "Education" | "Other";

const CATEGORIES: { value: Category; emoji: string }[] = [
  { value: "Food", emoji: "🍕" },
  { value: "Travel", emoji: "✈️" },
  { value: "Accommodation", emoji: "🏠" },
  { value: "Utilities", emoji: "⚡" },
  { value: "Entertainment", emoji: "🎬" },
  { value: "Shopping", emoji: "🛍️" },
  { value: "Healthcare", emoji: "💊" },
  { value: "Education", emoji: "📚" },
  { value: "Other", emoji: "📦" },
];

interface Person {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

interface ExpenseData {
  _id: string;
  description: string;
  amount: number;
  category: Category;
  date: string;
  notes?: string;
  groupId?: string;
  splitType?: SplitType;
  paidBy: { userId: Person; amount: number }[];
  splits: { userId: Person; amount: number; splitType: SplitType }[];
}

interface Props {
  expense: ExpenseData;
  currentUser: Person;
  friends: Person[];
  groupMembers: Person[];
}

export default function EditExpenseClient({
  expense,
  currentUser,
  friends,
  groupMembers,
}: Props) {
  const router = useRouter();

  const allPeople = expense.groupId
    ? [currentUser, ...groupMembers]
    : [currentUser, ...friends];

  // Pre-fill from existing expense
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(String(expense.amount));
  const [category, setCategory] = useState<Category>(expense.category);
  const [date, setDate] = useState(expense.date.split("T")[0]);
  const [notes, setNotes] = useState(expense.notes ?? "");
  const [splitType, setSplitType] = useState<SplitType>(
    expense.splits[0]?.splitType ?? "equal"
  );

  // Pre-fill paid by
  const [paidById, setPaidById] = useState(
    expense.paidBy[0]?.userId?._id ?? currentUser._id
  );

  // Pre-fill split values
  const [splitValues, setSplitValues] = useState<Record<string, string>>(() => {
    const vals: Record<string, string> = {};
    for (const s of expense.splits) {
      if (s.userId?._id) vals[s.userId._id] = String(s.amount);
    }
    return vals;
  });

  const [selectedPeople, setSelectedPeople] = useState<string[]>(
    expense.splits.map((s) => s.userId?._id).filter(Boolean) as string[]
  );

  const [loading, setLoading] = useState(false);

  const totalAmount = parseFloat(amount) || 0;

  function computeSplits(): { userId: string; amount: number }[] {
    const people = allPeople.filter((p) => selectedPeople.includes(p._id));
    if (people.length === 0) return [];

    if (splitType === "equal") {
      const share = totalAmount / people.length;
      const base = Math.floor(share * 100) / 100;
      const remainder = Math.round((totalAmount - base * people.length) * 100) / 100;
      return people.map((p, i) => ({
        userId: p._id,
        amount: i === 0 ? base + remainder : base,
      }));
    }
    if (splitType === "exact") {
      return people.map((p) => ({
        userId: p._id,
        amount: parseFloat(splitValues[p._id] ?? "0") || 0,
      }));
    }
    if (splitType === "percent") {
      return people.map((p) => ({
        userId: p._id,
        amount:
          Math.round(
            totalAmount * ((parseFloat(splitValues[p._id] ?? "0") / 100) * 100)
          ) / 100,
      }));
    }
    if (splitType === "shares") {
      const totalShares = people.reduce(
        (s, p) => s + (parseFloat(splitValues[p._id] ?? "1") || 1),
        0
      );
      return people.map((p) => ({
        userId: p._id,
        amount:
          Math.round(
            ((totalAmount * (parseFloat(splitValues[p._id] ?? "1") || 1)) /
              totalShares) *
              100
          ) / 100,
      }));
    }
    if (splitType === "adjustment") {
      const n = people.length;
      const base = totalAmount / n;
      return people.map((p) => ({
        userId: p._id,
        amount:
          Math.round((base + (parseFloat(splitValues[p._id] ?? "0") || 0)) * 100) /
          100,
      }));
    }
    return [];
  }

  async function handleSave() {
    if (!description.trim()) { toast.error("Description is required"); return; }
    if (totalAmount <= 0) { toast.error("Enter a valid amount"); return; }

    const splits = computeSplits();
    const splitSum = splits.reduce((s, sp) => s + sp.amount, 0);
    if (splitType === "exact" && Math.abs(splitSum - totalAmount) > 0.02) {
      toast.error(`Split total ${formatINR(splitSum)} must equal ${formatINR(totalAmount)}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/expenses/${expense._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          amount: totalAmount,
          category,
          date,
          notes,
          paidBy: [{ userId: paidById, amount: totalAmount }],
          splits,
        }),
      });

      if (!res.ok) { toast.error("Failed to update expense"); return; }
      toast.success("Expense updated!");
      router.push(`/expenses/${expense._id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function togglePerson(id: string) {
    if (id === currentUser._id) return;
    setSelectedPeople((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  const splits = computeSplits();
  const splitSum = splits.reduce((s, sp) => s + sp.amount, 0);

  const inputStyle = {
    width: "100%", padding: "0.625rem 0.875rem",
    background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)", color: "var(--color-text-primary)",
    fontSize: "0.875rem", fontFamily: "var(--font-body)", outline: "none",
  };

  const labelStyle = {
    fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)",
    display: "block", marginBottom: "0.4rem",
    textTransform: "uppercase" as const, letterSpacing: "0.04em",
  };

  return (
    <div className="fade-in" style={{ maxWidth: "640px" }}>
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

      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, margin: "0 0 1.5rem" }}>
        Edit Expense
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Description + Amount */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Description *</label>
            <input
              type="text" value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <div>
              <label style={labelStyle}>Amount (₹) *</label>
              <input
                type="number" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0" step="0.01"
                style={{ ...inputStyle, fontSize: "1.1rem", fontFamily: "var(--font-mono)", fontWeight: 600 }}
              />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {CATEGORIES.map(({ value, emoji }) => (
                <button
                  key={value}
                  onClick={() => setCategory(value)}
                  style={{
                    padding: "0.35rem 0.7rem", borderRadius: "99px",
                    border: "1px solid",
                    borderColor: category === value ? "var(--color-primary)" : "var(--color-border)",
                    background: category === value ? "var(--color-primary-muted)" : "transparent",
                    color: category === value ? "var(--color-primary)" : "var(--color-text-secondary)",
                    cursor: "pointer", fontSize: "0.78rem",
                    fontWeight: category === value ? 600 : 400,
                    fontFamily: "var(--font-body)", transition: "all 150ms",
                  }}
                >
                  {emoji} {value}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <input
              type="text" value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note..."
              style={inputStyle}
            />
          </div>
        </div>

        {/* Paid by (single only for edit simplicity) */}
        <div className="card">
          <label style={{ ...labelStyle, marginBottom: "0.875rem" }}>Paid By</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {allPeople.map((p) => (
              <button
                key={p._id}
                onClick={() => setPaidById(p._id)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.4rem 0.75rem", borderRadius: "99px",
                  border: "1px solid",
                  borderColor: paidById === p._id ? "var(--color-primary)" : "var(--color-border)",
                  background: paidById === p._id ? "var(--color-primary-muted)" : "transparent",
                  cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 150ms",
                }}
              >
                <UserAvatar name={p.name} image={p.image} size={20} />
                <span style={{
                  fontSize: "0.8rem",
                  fontWeight: paidById === p._id ? 600 : 400,
                  color: paidById === p._id ? "var(--color-primary)" : "var(--color-text-secondary)",
                }}>
                  {p._id === currentUser._id ? "You" : p.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Split */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
            <label style={{ ...labelStyle, margin: 0 }}>Split</label>
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
              {(["equal", "exact", "percent", "shares", "adjustment"] as SplitType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setSplitType(t)}
                  style={{
                    padding: "3px 10px", borderRadius: "99px", fontSize: "0.7rem",
                    border: "1px solid",
                    borderColor: splitType === t ? "var(--color-primary)" : "var(--color-border)",
                    background: splitType === t ? "var(--color-primary-muted)" : "transparent",
                    color: splitType === t ? "var(--color-primary)" : "var(--color-text-muted)",
                    cursor: "pointer", fontFamily: "var(--font-body)",
                    fontWeight: splitType === t ? 600 : 400,
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Person selector */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.875rem" }}>
            {allPeople.map((p) => (
              <button
                key={p._id}
                onClick={() => togglePerson(p._id)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.3rem 0.6rem", borderRadius: "99px",
                  border: "1px solid",
                  borderColor: selectedPeople.includes(p._id) ? "var(--color-primary)" : "var(--color-border)",
                  background: selectedPeople.includes(p._id) ? "var(--color-primary-muted)" : "transparent",
                  cursor: p._id === currentUser._id ? "default" : "pointer",
                  fontFamily: "var(--font-body)", transition: "all 150ms",
                  opacity: p._id === currentUser._id ? 0.7 : 1,
                }}
              >
                <UserAvatar name={p.name} image={p.image} size={18} />
                <span style={{
                  fontSize: "0.75rem",
                  fontWeight: selectedPeople.includes(p._id) ? 600 : 400,
                  color: selectedPeople.includes(p._id) ? "var(--color-primary)" : "var(--color-text-muted)",
                }}>
                  {p._id === currentUser._id ? "You" : p.name}
                </span>
              </button>
            ))}
          </div>

          {/* Split rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {allPeople.filter((p) => selectedPeople.includes(p._id)).map((p) => {
              const split = splits.find((s) => s.userId === p._id);
              return (
                <div key={p._id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <UserAvatar name={p.name} image={p.image} size={28} />
                  <span style={{ flex: 1, fontSize: "0.85rem" }}>
                    {p._id === currentUser._id ? "You" : p.name}
                  </span>

                  {splitType === "equal" && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                      {formatINR(split?.amount ?? 0)}
                    </span>
                  )}

                  {(splitType === "exact" || splitType === "adjustment") && (
                    <input
                      type="number" step="0.01"
                      placeholder={splitType === "exact" ? "0.00" : "0"}
                      value={splitValues[p._id] ?? ""}
                      onChange={(e) => setSplitValues((prev) => ({ ...prev, [p._id]: e.target.value }))}
                      style={{ ...inputStyle, width: "100px", textAlign: "right", fontFamily: "var(--font-mono)" }}
                    />
                  )}

                  {splitType === "percent" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <input
                        type="number" placeholder="0" min="0" max="100" step="0.1"
                        value={splitValues[p._id] ?? ""}
                        onChange={(e) => setSplitValues((prev) => ({ ...prev, [p._id]: e.target.value }))}
                        style={{ ...inputStyle, width: "70px", textAlign: "right", fontFamily: "var(--font-mono)" }}
                      />
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>%</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-muted)", minWidth: "60px", textAlign: "right" }}>
                        {formatINR(split?.amount ?? 0)}
                      </span>
                    </div>
                  )}

                  {splitType === "shares" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <input
                        type="number" placeholder="1" min="1" step="1"
                        value={splitValues[p._id] ?? ""}
                        onChange={(e) => setSplitValues((prev) => ({ ...prev, [p._id]: e.target.value }))}
                        style={{ ...inputStyle, width: "60px", textAlign: "right", fontFamily: "var(--font-mono)" }}
                      />
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>shares</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-muted)", minWidth: "60px", textAlign: "right" }}>
                        {formatINR(split?.amount ?? 0)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Validation bar */}
          {totalAmount > 0 && (
            <div style={{
              marginTop: "0.875rem", padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-md)",
              background: Math.abs(splitSum - totalAmount) < 0.02 ? "rgba(91,197,167,0.1)" : "rgba(248,113,113,0.1)",
              border: `1px solid ${Math.abs(splitSum - totalAmount) < 0.02 ? "rgba(91,197,167,0.3)" : "rgba(248,113,113,0.3)"}`,
              fontSize: "0.75rem",
              color: Math.abs(splitSum - totalAmount) < 0.02 ? "var(--color-owed)" : "var(--color-owe)",
            }}>
              Split total: {formatINR(splitSum)} of {formatINR(totalAmount)}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => router.back()}
            style={{
              flex: 1, padding: "0.75rem",
              background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)",
              cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !description || totalAmount <= 0}
            className="btn-primary"
            style={{ flex: 2, padding: "0.75rem", fontSize: "0.95rem" }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

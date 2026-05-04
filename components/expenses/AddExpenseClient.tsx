"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import UserAvatar from "@/components/layout/UserAvatar";
import { formatINR } from "@/lib/utils";

type SplitType = "equal" | "exact" | "percent" | "shares" | "adjustment";
type Category = "Food" | "Travel" | "Accommodation" | "Utilities" | "Entertainment" | "Shopping" | "Healthcare" | "Education" | "Other";

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

interface Props {
  currentUser: Person;
  friends: Person[];
  groupMembers: Person[];
  groupData: { _id: string; name: string; emoji: string } | null;
  preselectedGroupId?: string;
}

export default function AddExpenseClient({ currentUser, friends, groupMembers, groupData, preselectedGroupId }: Props) {
  const router = useRouter();
  const allPeople = preselectedGroupId
    ? [currentUser, ...groupMembers]
    : [currentUser, ...friends];

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Other");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [selectedPeople, setSelectedPeople] = useState<string[]>([currentUser._id, ...allPeople.slice(1).map((p) => p._id)]);
  const [paidByMode, setPaidByMode] = useState<"single" | "multiple">("single");
  const [paidById, setPaidById] = useState(currentUser._id);
  const [paidByAmounts, setPaidByAmounts] = useState<Record<string, string>>({});
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const totalAmount = parseFloat(amount) || 0;

  // Compute splits based on splitType
  function computeSplits(): { userId: string; amount: number }[] {
    const people = allPeople.filter((p) => selectedPeople.includes(p._id));
    if (people.length === 0) return [];

    if (splitType === "equal") {
      const share = totalAmount / people.length;
      const base = Math.floor(share * 100) / 100;
      const remainder = Math.round((totalAmount - base * people.length) * 100) / 100;
      return people.map((p, i) => ({ userId: p._id, amount: i === 0 ? base + remainder : base }));
    }

    if (splitType === "exact") {
      return people.map((p) => ({ userId: p._id, amount: parseFloat(splitValues[p._id] ?? "0") || 0 }));
    }

    if (splitType === "percent") {
      return people.map((p) => ({
        userId: p._id,
        amount: Math.round(totalAmount * (parseFloat(splitValues[p._id] ?? "0") / 100) * 100) / 100,
      }));
    }

    if (splitType === "shares") {
      const totalShares = people.reduce((s, p) => s + (parseFloat(splitValues[p._id] ?? "1") || 1), 0);
      return people.map((p) => ({
        userId: p._id,
        amount: Math.round((totalAmount * ((parseFloat(splitValues[p._id] ?? "1") || 1) / totalShares)) * 100) / 100,
      }));
    }

    if (splitType === "adjustment") {
      const n = people.length;
      const baseEqual = totalAmount / n;
      return people.map((p) => {
        const adj = parseFloat(splitValues[p._id] ?? "0") || 0;
        return { userId: p._id, amount: Math.round((baseEqual + adj) * 100) / 100 };
      });
    }

    return [];
  }

  function validateSplits(): string | null {
    const splits = computeSplits();
    const sum = splits.reduce((s, sp) => s + sp.amount, 0);

    if (splitType === "exact") {
      if (Math.abs(sum - totalAmount) > 0.02) return `Sum (${formatINR(sum)}) must equal total (${formatINR(totalAmount)})`;
    }
    if (splitType === "percent") {
      const pctSum = Object.values(splitValues).reduce((s, v) => s + (parseFloat(v) || 0), 0);
      if (Math.abs(pctSum - 100) > 0.01) return `Percentages must sum to 100% (currently ${pctSum.toFixed(1)}%)`;
    }
    if (splits.some((s) => s.amount < 0)) return "Split amounts cannot be negative";
    return null;
  }

  async function handleSubmit() {
    if (!description.trim()) { toast.error("Description is required"); return; }
    if (totalAmount <= 0) { toast.error("Enter a valid amount"); return; }
    if (selectedPeople.length === 0) { toast.error("Select at least one person"); return; }

    const splitError = validateSplits();
    if (splitError) { toast.error(splitError); return; }

    const splits = computeSplits();

    let paidBy: { userId: string; amount: number }[];
    if (paidByMode === "single") {
      paidBy = [{ userId: paidById, amount: totalAmount }];
    } else {
      paidBy = Object.entries(paidByAmounts)
        .map(([userId, amt]) => ({ userId, amount: parseFloat(amt) || 0 }))
        .filter((p) => p.amount > 0);
      const paidSum = paidBy.reduce((s, p) => s + p.amount, 0);
      if (Math.abs(paidSum - totalAmount) > 0.02) {
        toast.error(`Paid amounts (${formatINR(paidSum)}) must equal total (${formatINR(totalAmount)})`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          amount: totalAmount,
          category,
          date,
          notes,
          groupId: preselectedGroupId,
          splitType,
          paidBy,
          splits,
        }),
      });

      if (!res.ok) { toast.error("Failed to add expense"); return; }
      toast.success("Expense added!");
      router.push(preselectedGroupId ? `/groups/${preselectedGroupId}` : "/dashboard");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const splits = computeSplits();
  const splitSum = splits.reduce((s, sp) => s + sp.amount, 0);
  const pctSum = Object.values(splitValues).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  function togglePerson(id: string) {
    setSelectedPeople((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  const inputStyle = {
    width: "100%", padding: "0.625rem 0.875rem",
    background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)", color: "var(--color-text-primary)",
    fontSize: "0.875rem", fontFamily: "var(--font-body)", outline: "none",
  };

  const labelStyle = {
    fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)",
    display: "block", marginBottom: "0.4rem", textTransform: "uppercase" as const, letterSpacing: "0.04em",
  };

  return (
    <div className="fade-in" style={{ maxWidth: "640px" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, margin: "0 0 1.5rem" }}>
        {groupData ? `Add Expense to ${groupData.emoji} ${groupData.name}` : "Add Expense"}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Description + Amount */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Description *</label>
            <input
              type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this for?" autoFocus style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <div>
              <label style={labelStyle}>Amount (₹) *</label>
              <input
                type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" min="0" step="0.01"
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
                    cursor: "pointer", fontSize: "0.78rem", fontWeight: category === value ? 600 : 400,
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
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note..." style={inputStyle} />
          </div>
        </div>

        {/* Paid by */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
            <label style={{ ...labelStyle, margin: 0 }}>Paid By</label>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              {(["single", "multiple"] as const).map((m) => (
                <button key={m} onClick={() => setPaidByMode(m)} style={{
                  padding: "3px 10px", borderRadius: "99px", fontSize: "0.7rem",
                  border: "1px solid",
                  borderColor: paidByMode === m ? "var(--color-primary)" : "var(--color-border)",
                  background: paidByMode === m ? "var(--color-primary-muted)" : "transparent",
                  color: paidByMode === m ? "var(--color-primary)" : "var(--color-text-muted)",
                  cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: paidByMode === m ? 600 : 400,
                  textTransform: "capitalize",
                }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {paidByMode === "single" ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {allPeople.map((p) => (
                <button key={p._id} onClick={() => setPaidById(p._id)} style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.4rem 0.75rem", borderRadius: "99px",
                  border: "1px solid",
                  borderColor: paidById === p._id ? "var(--color-primary)" : "var(--color-border)",
                  background: paidById === p._id ? "var(--color-primary-muted)" : "transparent",
                  cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 150ms",
                }}>
                  <UserAvatar name={p.name} image={p.image} size={20} />
                  <span style={{ fontSize: "0.8rem", fontWeight: paidById === p._id ? 600 : 400, color: paidById === p._id ? "var(--color-primary)" : "var(--color-text-secondary)" }}>
                    {p._id === currentUser._id ? "You" : p.name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {allPeople.map((p) => (
                <div key={p._id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <UserAvatar name={p.name} image={p.image} size={28} />
                  <span style={{ flex: 1, fontSize: "0.85rem" }}>{p._id === currentUser._id ? "You" : p.name}</span>
                  <input
                    type="number" placeholder="0.00" min="0" step="0.01"
                    value={paidByAmounts[p._id] ?? ""}
                    onChange={(e) => setPaidByAmounts((prev) => ({ ...prev, [p._id]: e.target.value }))}
                    style={{ ...inputStyle, width: "100px", textAlign: "right", fontFamily: "var(--font-mono)" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Split engine */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
            <label style={{ ...labelStyle, margin: 0 }}>Split</label>
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
              {(["equal", "exact", "percent", "shares", "adjustment"] as SplitType[]).map((t) => (
                <button key={t} onClick={() => setSplitType(t)} style={{
                  padding: "3px 10px", borderRadius: "99px", fontSize: "0.7rem",
                  border: "1px solid",
                  borderColor: splitType === t ? "var(--color-primary)" : "var(--color-border)",
                  background: splitType === t ? "var(--color-primary-muted)" : "transparent",
                  color: splitType === t ? "var(--color-primary)" : "var(--color-text-muted)",
                  cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: splitType === t ? 600 : 400,
                  textTransform: "capitalize",
                }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Person selector */}
          {!preselectedGroupId && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.875rem" }}>
              {allPeople.map((p) => (
                <button key={p._id} onClick={() => p._id !== currentUser._id && togglePerson(p._id)} style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.3rem 0.6rem", borderRadius: "99px",
                  border: "1px solid",
                  borderColor: selectedPeople.includes(p._id) ? "var(--color-primary)" : "var(--color-border)",
                  background: selectedPeople.includes(p._id) ? "var(--color-primary-muted)" : "transparent",
                  cursor: p._id === currentUser._id ? "default" : "pointer",
                  fontFamily: "var(--font-body)", transition: "all 150ms",
                  opacity: p._id === currentUser._id ? 0.7 : 1,
                }}>
                  <UserAvatar name={p.name} image={p.image} size={18} />
                  <span style={{ fontSize: "0.75rem", fontWeight: selectedPeople.includes(p._id) ? 600 : 400, color: selectedPeople.includes(p._id) ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                    {p._id === currentUser._id ? "You" : p.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Split inputs per type */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {allPeople.filter((p) => selectedPeople.includes(p._id)).map((p) => {
              const split = splits.find((s) => s.userId === p._id);
              return (
                <div key={p._id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <UserAvatar name={p.name} image={p.image} size={28} />
                  <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--color-text-primary)" }}>
                    {p._id === currentUser._id ? "You" : p.name}
                  </span>

                  {splitType === "equal" && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                      {formatINR(split?.amount ?? 0)}
                    </span>
                  )}

                  {splitType === "exact" && (
                    <input
                      type="number" placeholder="0.00" min="0" step="0.01"
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

                  {splitType === "adjustment" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <input
                        type="number" placeholder="0" step="0.01"
                        value={splitValues[p._id] ?? ""}
                        onChange={(e) => setSplitValues((prev) => ({ ...prev, [p._id]: e.target.value }))}
                        style={{ ...inputStyle, width: "80px", textAlign: "right", fontFamily: "var(--font-mono)" }}
                      />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-muted)", minWidth: "60px", textAlign: "right" }}>
                        {formatINR(split?.amount ?? 0)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Validation feedback */}
          {totalAmount > 0 && (
            <div style={{
              marginTop: "0.875rem", padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-md)",
              background: Math.abs(splitSum - totalAmount) < 0.02 ? "rgba(91,197,167,0.1)" : "rgba(248,113,113,0.1)",
              border: `1px solid ${Math.abs(splitSum - totalAmount) < 0.02 ? "rgba(91,197,167,0.3)" : "rgba(248,113,113,0.3)"}`,
              fontSize: "0.75rem",
              color: Math.abs(splitSum - totalAmount) < 0.02 ? "var(--color-owed)" : "var(--color-owe)",
            }}>
              {splitType === "percent"
                ? `${pctSum.toFixed(1)}% of 100%`
                : `Split total: ${formatINR(splitSum)} of ${formatINR(totalAmount)}`}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => router.back()} style={{
            flex: 1, padding: "0.75rem",
            background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)",
            cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500,
          }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !description || totalAmount <= 0}
            className="btn-primary"
            style={{ flex: 2, padding: "0.75rem", fontSize: "0.95rem" }}
          >
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const GROUP_TYPES = [
  { type: "Home", emoji: "🏠" },
  { type: "Trip", emoji: "✈️" },
  { type: "Couple", emoji: "💑" },
  { type: "Work", emoji: "💼" },
  { type: "Other", emoji: "👥" },
] as const;

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<"Home" | "Trip" | "Couple" | "Work" | "Other">("Other");
  const [loading, setLoading] = useState(false);

  const selectedEmoji = GROUP_TYPES.find((t) => t.type === type)?.emoji ?? "👥";

  async function handleCreate() {
    if (!name.trim()) { toast.error("Group name is required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, emoji: selectedEmoji, type }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Group created!");
      router.push(`/groups/${data.group._id}`);
    } catch {
      toast.error("Failed to create group");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: "480px" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, margin: "0 0 1.5rem" }}>
        Create a New Group
      </h2>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Preview */}
        <div style={{
          display: "flex", alignItems: "center", gap: "1rem",
          padding: "1rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)",
        }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "var(--radius-md)",
            background: "var(--color-surface-3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px",
          }}>
            {selectedEmoji}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: name ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
              {name || "Group Name"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{type}</div>
          </div>
        </div>

        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.4rem" }}>
            Group Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Goa Trip 2025, Flat 4B..."
            autoFocus
            style={{
              width: "100%", padding: "0.625rem 0.875rem",
              background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)", color: "var(--color-text-primary)",
              fontSize: "0.95rem", fontFamily: "var(--font-body)", outline: "none",
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text-secondary)", display: "block", marginBottom: "0.75rem" }}>
            Group Type
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
            {GROUP_TYPES.map(({ type: t, emoji }) => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: "0.35rem", padding: "0.75rem 0.25rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid",
                  borderColor: type === t ? "var(--color-primary)" : "var(--color-border)",
                  background: type === t ? "var(--color-primary-muted)" : "var(--color-surface-2)",
                  cursor: "pointer", transition: "all 150ms",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>{emoji}</span>
                <span style={{
                  fontSize: "0.65rem", fontWeight: 600,
                  color: type === t ? "var(--color-primary)" : "var(--color-text-muted)",
                  fontFamily: "var(--font-body)",
                }}>{t}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
          <button
            onClick={() => router.back()}
            style={{
              flex: 1, padding: "0.75rem",
              background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)",
              cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: "0.875rem",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="btn-primary"
            style={{ flex: 2, padding: "0.75rem", fontSize: "0.95rem" }}
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

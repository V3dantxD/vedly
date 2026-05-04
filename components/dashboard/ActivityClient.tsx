"use client";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import UserAvatar from "@/components/layout/UserAvatar";

type Filter = "all" | "friends" | "groups" | "settlements";

interface ActivityItem {
  _id: string;
  actorId: { _id: string; name: string; email: string; image?: string };
  action: string;
  entityType: string;
  metadata?: Record<string, unknown>;
  groupId?: string;
  createdAt: string;
}

function getActionDescription(item: ActivityItem): string {
  const { action, metadata } = item;
  switch (action) {
    case "added_expense": return `added expense "${metadata?.description}" · ₹${Number(metadata?.amount ?? 0).toFixed(2)}`;
    case "settled_up": return `settled up ₹${Number(metadata?.amount ?? 0).toFixed(2)} with ${metadata?.toUserName ?? "someone"}`;
    case "added_friend": return `added ${metadata?.friendName ?? "someone"} as a friend`;
    case "created_group": return `created group "${metadata?.groupName ?? ""}"`;
    default: return action.replace(/_/g, " ");
  }
}

function getActionEmoji(action: string): string {
  const m: Record<string, string> = {
    added_expense: "🧾",
    settled_up: "💸",
    added_friend: "👋",
    created_group: "👥",
  };
  return m[action] ?? "📋";
}

export default function ActivityClient({ currentUserId }: { currentUserId: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setActivities([]);
    setNextCursor(null);
    fetchActivity(null, true);
  }, [filter]);

  async function fetchActivity(cursor: string | null, reset = false) {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({ filter });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/activity?${params}`);
      const data = await res.json();
      setActivities((prev) => reset ? data.activities : [...prev, ...data.activities]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  const FILTERS: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "friends", label: "Friends" },
    { value: "groups", label: "Groups" },
    { value: "settlements", label: "Settlements" },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: "680px" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, margin: "0 0 1.25rem" }}>Activity Feed</h2>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", padding: "3px" }}>
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            style={{
              flex: 1, padding: "0.5rem", borderRadius: "8px",
              background: filter === value ? "var(--color-surface)" : "transparent",
              border: "none", cursor: "pointer",
              color: filter === value ? "var(--color-text-primary)" : "var(--color-text-muted)",
              fontSize: "0.8rem", fontWeight: filter === value ? 600 : 400,
              fontFamily: "var(--font-body)", transition: "all 150ms",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton" style={{ height: "68px" }} />)}
        </div>
      ) : activities.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📋</div>
          <div style={{ color: "var(--color-text-muted)" }}>No activity yet</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {activities.map((item) => {
            const isMe = item.actorId?._id === currentUserId;
            return (
              <div key={item._id} className="card" style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start", padding: "0.875rem 1rem" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <UserAvatar name={item.actorId?.name} image={item.actorId?.image} size={38} />
                  <span style={{
                    position: "absolute", bottom: "-2px", right: "-2px",
                    fontSize: "14px", lineHeight: 1,
                  }}>
                    {getActionEmoji(item.action)}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.875rem", color: "var(--color-text-primary)", lineHeight: 1.4 }}>
                    <strong>{isMe ? "You" : item.actorId?.name}</strong>{" "}
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {getActionDescription(item)}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            );
          })}

          {nextCursor && (
            <button
              onClick={() => fetchActivity(nextCursor)}
              disabled={loadingMore}
              style={{
                width: "100%", padding: "0.75rem",
                background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)",
                cursor: "pointer", fontSize: "0.875rem", fontFamily: "var(--font-body)",
                marginTop: "0.5rem",
              }}
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

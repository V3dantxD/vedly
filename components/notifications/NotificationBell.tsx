"use client";
import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const TYPE_EMOJI: Record<string, string> = {
  expense_added: "🧾",
  expense_edited: "✏️",
  settlement_received: "💸",
  added_to_group: "👥",
  friend_added: "👋",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch {}
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    setUnread((prev) => Math.max(0, prev - 1));
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen(!open); }}
        style={{
          position: "relative",
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          width: "36px", height: "36px",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "var(--color-text-secondary)",
          transition: "all 150ms",
        }}
      >
        <Bell size={17} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: "-6px", right: "-6px",
            background: "#ef4444", color: "#fff",
            borderRadius: "99px", fontSize: "0.65rem",
            fontWeight: 700, minWidth: "18px", height: "18px",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
            border: "2px solid var(--color-background)",
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: "340px", maxHeight: "420px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          zIndex: 100,
          overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "0.875rem 1rem",
            borderBottom: "1px solid var(--color-border)",
          }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", fontFamily: "var(--font-display)" }}>Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--color-primary)", fontSize: "0.75rem", fontWeight: 600,
                  fontFamily: "var(--font-body)",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.read && markRead(n._id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid var(--color-border)",
                    background: n.read ? "transparent" : "rgba(91,197,167,0.04)",
                    cursor: n.read ? "default" : "pointer",
                    transition: "background 150ms",
                  }}
                >
                  <span style={{ fontSize: "20px", flexShrink: 0, marginTop: "1px" }}>
                    {TYPE_EMOJI[n.type] ?? "🔔"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "0.8rem",
                      color: n.read ? "var(--color-text-secondary)" : "var(--color-text-primary)",
                      lineHeight: 1.4,
                    }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  {!n.read && (
                    <div style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: "var(--color-primary)", flexShrink: 0, marginTop: "4px",
                    }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

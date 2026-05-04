"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import UserAvatar from "@/components/layout/UserAvatar";
import { signOut } from "next-auth/react";

interface Props {
  initialUser: {
    name: string;
    email: string;
    image: string;
    timezone: string;
    notificationPrefs: { email: boolean; inApp: boolean };
  };
}

const TIMEZONES = [
  "Asia/Kolkata", "Asia/Mumbai", "Asia/Delhi",
  "UTC", "America/New_York", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Singapore",
];

export default function SettingsClient({ initialUser }: Props) {
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(initialUser.name);
  const [timezone, setTimezone] = useState(initialUser.timezone);
  const [notifEmail, setNotifEmail] = useState(initialUser.notificationPrefs.email);
  const [notifInApp, setNotifInApp] = useState(initialUser.notificationPrefs.inApp);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          timezone,
          notificationPrefs: { email: notifEmail, inApp: notifInApp },
        }),
      });
      if (!res.ok) { toast.error("Failed to save"); return; }
      toast.success("Settings saved!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "0.625rem 0.875rem",
    background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)", color: "var(--color-text-primary)",
    fontSize: "0.875rem", fontFamily: "var(--font-body)", outline: "none",
  };

  const labelStyle = {
    fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)",
    display: "block", marginBottom: "0.4rem",
  };

  return (
    <div className="fade-in" style={{ maxWidth: "520px" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, margin: "0 0 1.5rem" }}>Settings</h2>

      {/* Profile card */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, margin: "0 0 1.25rem", fontSize: "0.95rem" }}>Profile</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
          <UserAvatar name={user.name} image={user.image} size={56} />
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>{user.name}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{user.email}</div>
            <div style={{
              marginTop: "0.25rem", fontSize: "0.7rem",
              padding: "2px 8px", borderRadius: "99px",
              background: "var(--color-surface-2)", color: "var(--color-text-muted)",
              display: "inline-block",
            }}>
              Signed in with Google
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Display Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={user.email} disabled style={{ ...inputStyle, opacity: 0.5 }} />
          </div>

          <div>
            <label style={labelStyle}>Currency</label>
            <input type="text" value="₹ INR — Indian Rupee" disabled style={{ ...inputStyle, opacity: 0.5 }} />
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
              Vedly uses INR for all transactions
            </div>
          </div>

          <div>
            <label style={labelStyle}>Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, margin: "0 0 1.25rem", fontSize: "0.95rem" }}>Notifications</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {[
            { label: "Email Notifications", desc: "Get emails for new expenses, settlements, group invites", value: notifEmail, set: setNotifEmail },
            { label: "In-App Notifications", desc: "See notifications in the bell icon", value: notifInApp, set: setNotifInApp },
          ].map(({ label, desc, value, set }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)" }}>{label}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{desc}</div>
              </div>
              <button
                onClick={() => set(!value)}
                style={{
                  width: "44px", height: "24px", borderRadius: "99px",
                  background: value ? "var(--color-primary)" : "var(--color-surface-3)",
                  border: "none", cursor: "pointer", position: "relative", transition: "background 200ms",
                  flexShrink: 0,
                }}
              >
                <span style={{
                  position: "absolute", top: "3px",
                  left: value ? "23px" : "3px",
                  width: "18px", height: "18px", borderRadius: "50%",
                  background: "#fff", transition: "left 200ms",
                }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem" }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            width: "100%", padding: "0.75rem",
            background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
            borderRadius: "var(--radius-md)", color: "var(--color-owe)",
            cursor: "pointer", fontSize: "0.875rem", fontFamily: "var(--font-body)", fontWeight: 500,
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

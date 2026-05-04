"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UsersRound, Activity,
  BarChart3, Settings, LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import UserAvatar from "./UserAvatar";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/groups", label: "Groups", icon: UsersRound },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null; id: string };
}

export default function Sidebar({ user }: Props) {
  const pathname = usePathname();

  return (
    <nav className="sidebar">
      {/* Logo */}
      <div style={{
        padding: "1.25rem 1.25rem 0.75rem",
        borderBottom: "1px solid var(--color-border)",
      }}>
        <Link href="/dashboard" style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          textDecoration: "none",
        }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
          }}>
            💸
          </div>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            letterSpacing: "-0.02em",
          }}>
            Vedly
          </span>
        </Link>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: "0.75rem 0.75rem", display: "flex", flexDirection: "column", gap: "2px" }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.625rem 0.875rem",
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                background: active ? "var(--color-primary-muted)" : "transparent",
                transition: "all 150ms ease",
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* User section */}
      <div style={{
        padding: "0.75rem",
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}>
        <UserAvatar name={user.name} image={user.image} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {user.name}
          </div>
          <div style={{
            fontSize: "0.7rem",
            color: "var(--color-text-muted)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {user.email}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign out"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-muted)",
            padding: "4px",
            borderRadius: "6px",
            transition: "color 150ms",
            display: "flex",
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}

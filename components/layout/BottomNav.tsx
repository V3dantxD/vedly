"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UsersRound, Activity, User } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/groups", label: "Groups", icon: UsersRound },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/settings", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" style={{ justifyContent: "space-around", alignItems: "center", padding: "0 0.5rem" }}>
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-md)",
              textDecoration: "none",
              color: active ? "var(--color-primary)" : "var(--color-text-muted)",
              fontSize: "0.65rem",
              fontWeight: active ? 600 : 400,
              transition: "color 150ms",
              flex: 1,
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

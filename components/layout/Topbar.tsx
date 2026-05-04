"use client";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import UserAvatar from "./UserAvatar";
import Link from "next/link";
import { useState } from "react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/friends": "Friends",
  "/groups": "Groups",
  "/groups/new": "New Group",
  "/expenses/new": "Add Expense",
  "/activity": "Activity",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function Topbar({ user }: Props) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Vedly";

  return (
    <header className="topbar">
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontSize: "1.125rem",
        fontWeight: 700,
        color: "var(--color-text-primary)",
        margin: 0,
        flex: 1,
        letterSpacing: "-0.01em",
      }}>
        {title}
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Link
          href="/expenses/new"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.45rem 0.875rem",
            background: "var(--color-primary)",
            color: "#0f1117",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
            fontSize: "0.8rem",
            fontWeight: 700,
            transition: "all 150ms",
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span style={{ display: "none" }} className="sm-show">Add Expense</span>
        </Link>

        <NotificationBell />

        <Link href="/settings">
          <UserAvatar name={user.name} image={user.image} size={34} />
        </Link>
      </div>
    </header>
  );
}

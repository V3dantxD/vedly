import { useState, useEffect } from "react";

interface GroupMember {
  userId: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  role: "admin" | "member";
}

interface Group {
  _id: string;
  name: string;
  emoji: string;
  type: "Home" | "Trip" | "Couple" | "Work" | "Other";
  members: GroupMember[];
  currency: string;
  simplifyDebts: boolean;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
}

interface UseGroupsReturn {
  groups: Group[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGroups(): UseGroupsReturn {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const res = await globalThis.fetch("/api/groups");
        if (!res.ok) throw new Error("Failed to fetch groups");
        const data = await res.json();
        setGroups(data.groups ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [tick]);

  return { groups, loading, error, refetch: () => setTick((t) => t + 1) };
}

interface UseGroupReturn {
  group: Group | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGroup(groupId: string): UseGroupReturn {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!groupId) return;
    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const res = await globalThis.fetch(`/api/groups/${groupId}`);
        if (!res.ok) throw new Error("Group not found");
        const data = await res.json();
        setGroup(data.group);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [groupId, tick]);

  return { group, loading, error, refetch: () => setTick((t) => t + 1) };
}

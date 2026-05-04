import { useState, useEffect } from "react";

interface UserInfo {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

interface GroupBalance {
  user: UserInfo;
  amount: number;
}

interface SimplifiedDebt {
  from: UserInfo;
  to: UserInfo;
  amount: number;
}

interface UseGroupBalancesReturn {
  balances: GroupBalance[];
  simplified: SimplifiedDebt[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGroupBalances(groupId: string): UseGroupBalancesReturn {
  const [balances, setBalances] = useState<GroupBalance[]>([]);
  const [simplified, setSimplified] = useState<SimplifiedDebt[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!groupId) return;
    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const res = await globalThis.fetch(`/api/balances/group/${groupId}`);
        if (!res.ok) throw new Error("Failed to fetch balances");
        const data = await res.json();
        setBalances(data.balances ?? []);
        setSimplified(data.simplified ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [groupId, tick]);

  return { balances, simplified, loading, error, refetch: () => setTick((t) => t + 1) };
}

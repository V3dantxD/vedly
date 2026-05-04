import { useState, useEffect } from "react";

interface FriendBalance {
  friend: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  amount: number;
}

interface BalanceSummary {
  totalOwed: number;
  totalOwe: number;
  net: number;
}

interface UseBalanceReturn {
  balances: FriendBalance[];
  summary: BalanceSummary;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBalance(): UseBalanceReturn {
  const [balances, setBalances] = useState<FriendBalance[]>([]);
  const [summary, setSummary] = useState<BalanceSummary>({ totalOwed: 0, totalOwe: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const res = await globalThis.fetch("/api/balances");
        if (!res.ok) throw new Error("Failed to fetch balances");
        const data = await res.json();
        setBalances(data.balances ?? []);
        setSummary(data.summary ?? { totalOwed: 0, totalOwe: 0, net: 0 });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [tick]);

  return { balances, summary, loading, error, refetch: () => setTick((t) => t + 1) };
}

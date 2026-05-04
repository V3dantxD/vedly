import { useState, useEffect, useCallback } from "react";

interface PaidBy {
  userId: { _id: string; name: string; image?: string };
  amount: number;
}

interface Split {
  userId: { _id: string; name: string; image?: string } | string;
  amount: number;
  splitType: string;
}

interface Expense {
  _id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  paidBy: PaidBy[];
  splits: Split[];
  groupId?: string;
  date: string;
  notes?: string;
  createdBy: { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

interface UseExpensesOptions {
  groupId?: string;
  limit?: number;
}

interface UseExpensesReturn {
  expenses: Expense[];
  total: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
  deleteExpense: (id: string) => Promise<boolean>;
}

export function useExpenses({ groupId, limit = 20 }: UseExpensesOptions = {}): UseExpensesReturn {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const fetchExpenses = useCallback(
    async (currentSkip: number, reset: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ limit: String(limit), skip: String(currentSkip) });
        if (groupId) params.set("groupId", groupId);
        const res = await fetch(`/api/expenses?${params}`);
        if (!res.ok) throw new Error("Failed to fetch expenses");
        const data = await res.json();
        setExpenses((prev) => (reset ? data.expenses : [...prev, ...data.expenses]));
        setTotal(data.total ?? 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [groupId, limit]
  );

  useEffect(() => {
    setSkip(0);
    setExpenses([]);
    fetchExpenses(0, true);
  }, [groupId, tick]);

  function loadMore() {
    const nextSkip = skip + limit;
    setSkip(nextSkip);
    fetchExpenses(nextSkip, false);
  }

  async function deleteExpense(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) return false;
      setExpenses((prev) => prev.filter((e) => e._id !== id));
      setTotal((prev) => prev - 1);
      return true;
    } catch {
      return false;
    }
  }

  return {
    expenses,
    total,
    loading,
    error,
    hasMore: expenses.length < total,
    loadMore,
    refetch: () => setTick((t) => t + 1),
    deleteExpense,
  };
}

import { useState, useEffect, useCallback } from "react";

type ActivityFilter = "all" | "friends" | "groups" | "settlements";

interface Actor {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

interface ActivityItem {
  _id: string;
  actorId: Actor;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  groupId?: string;
  createdAt: string;
}

interface UseActivityReturn {
  activities: ActivityItem[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  setFilter: (filter: ActivityFilter) => void;
  filter: ActivityFilter;
  refetch: () => void;
}

export function useActivity(): UseActivityReturn {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilterState] = useState<ActivityFilter>("all");
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const fetchActivity = useCallback(
    async (currentCursor: string | null, reset: boolean) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const params = new URLSearchParams({ filter });
        if (currentCursor) params.set("cursor", currentCursor);

        const res = await fetch(`/api/activity?${params}`);
        if (!res.ok) throw new Error("Failed to fetch activity");
        const data = await res.json();

        setActivities((prev) =>
          reset ? data.activities : [...prev, ...data.activities]
        );
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter]
  );

  // Reset and refetch when filter or tick changes
  useEffect(() => {
    setCursor(null);
    setActivities([]);
    fetchActivity(null, true);
  }, [filter, tick]);

  function setFilter(f: ActivityFilter) {
    setFilterState(f);
  }

  function loadMore() {
    if (cursor && !loadingMore) fetchActivity(cursor, false);
  }

  return {
    activities,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    setFilter,
    filter,
    refetch: () => setTick((t) => t + 1),
  };
}

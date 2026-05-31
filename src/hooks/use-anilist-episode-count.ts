import { useCallback, useEffect, useState } from "react";

type UseEpisodeCountResult = {
  count: number | null;
  status: string | null;
  loading: boolean;
  error: boolean;
  retry: () => void;
};

export function useAnilistEpisodeCount(animeId: string): UseEpisodeCountResult {
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchCount = useCallback(async () => {
    if (!animeId) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/episodes/count/${animeId}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCount(data.count ?? null);
      setStatus(data.status ?? null);
    } catch {
      setError(true);
      setCount(null);
    } finally {
      setLoading(false);
    }
  }, [animeId]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, status, loading, error, retry: fetchCount };
}

import { useState, useEffect, useCallback } from 'react';
import { stampTypeApi, type StampType } from '../api';

export function useStampTypes(activeOnly = false) {
  const [stampTypes, setStampTypes] = useState<StampType[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await stampTypeApi.list(activeOnly);
      setStampTypes(result.results);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => { fetch(); }, [fetch]);

  return { stampTypes, loading, error, refresh: fetch };
}

import { useState, useEffect, useCallback } from 'react';
import {
  applicationApi,
  type ApplicationSummary,
  type ApplicationStatus,
} from '../api';

interface Filters {
  status?: ApplicationStatus;
  priority?: string;
  stamp_type?: number;
  search?: string;
  page?: number;
}

export function useApplications(initialFilters: Filters = {}) {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [count, setCount]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [filters, setFilters]           = useState<Filters>(initialFilters);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await applicationApi.list(filters);
      setApplications(result.results);
      setCount(result.count);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return {
    applications,
    count,
    loading,
    error,
    filters,
    setFilters,
    refresh: fetch,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { applicantApi, type Applicant } from '../api';

export function useApplicants(initialSearch = '') {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState(initialSearch);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await applicantApi.list(search || undefined);
      setApplicants(result.results);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  const createApplicant = async (data: Partial<Applicant>) => {
    const created = await applicantApi.create(data);
    await fetch();
    return created;
  };

  return { applicants, loading, error, search, setSearch, createApplicant, refresh: fetch };
}

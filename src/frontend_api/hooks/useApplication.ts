import { useState, useEffect, useCallback } from 'react';
import { applicationApi, type ApplicationDetail } from '../api';

export function useApplication(id: number | null) {
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading]         = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await applicationApi.get(id);
      setApplication(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  // Wrap every button action: show loading, update state, surface errors
  const doAction = useCallback(
    async (fn: () => Promise<ApplicationDetail>) => {
      setActionLoading(true);
      setError(null);
      try {
        const updated = await fn();
        setApplication(updated);
        return updated;
      } catch (e: any) {
        setError(e.message);
        throw e;
      } finally {
        setActionLoading(false);
      }
    },
    []
  );

  // ── Button Actions ──────────────────────────────────────────────────────

  const submit = (performedBy?: string) =>
    doAction(() => applicationApi.submit(id!, performedBy));

  const startReview = (performedBy?: string) =>
    doAction(() => applicationApi.startReview(id!, performedBy));

  const approve = (performedBy?: string, notes?: string) =>
    doAction(() => applicationApi.approve(id!, performedBy, notes));

  const reject = (performedBy?: string, notes?: string) =>
    doAction(() => applicationApi.reject(id!, performedBy, notes));

  const cancel = (performedBy?: string) =>
    doAction(() => applicationApi.cancel(id!, performedBy));

  const recordPayment = (paymentRef: string, performedBy?: string) =>
    doAction(() => applicationApi.recordPayment(id!, paymentRef, performedBy));

  const issueStamp = (data: {
    issued_by: string;
    valid_from: string;
    valid_until?: string;
  }) =>
    doAction(async () => {
      const result = await applicationApi.issueStamp(id!, data);
      return result.application;
    });

  return {
    application,
    loading,
    actionLoading,
    error,
    refresh: fetch,
    // actions
    submit,
    startReview,
    approve,
    reject,
    cancel,
    recordPayment,
    issueStamp,
  };
}

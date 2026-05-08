/**
 * KCCP API Service
 * All communication between the React frontend and Django backend.
 *
 * Base URL points to Django dev server (port 8000).
 * Change API_BASE for production.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

// ─── Generic fetch helper ─────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody?.error ?? errorBody?.detail ?? `API error ${res.status}`
    );
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

const get  = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
const put  = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
const del  = <T>(path: string) =>
  request<T>(path, { method: 'DELETE' });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StampType {
  id: number;
  name: string;
  code: string;
  description: string;
  fee: string;
  is_active: boolean;
}

export interface Applicant {
  id: number;
  full_name: string;
  applicant_type: 'individual' | 'company' | 'government';
  id_number: string;
  email: string;
  phone: string;
  address: string;
}

export type ApplicationStatus =
  | 'draft' | 'submitted' | 'under_review'
  | 'approved' | 'rejected' | 'issued' | 'cancelled';

export interface ApplicationSummary {
  id: number;
  reference_number: string;
  applicant_name: string;
  stamp_type_name: string;
  status: ApplicationStatus;
  status_display: string;
  priority: 'normal' | 'urgent' | 'express';
  fee_paid: boolean;
  submitted_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  application: number;
  action: string;
  performed_by: string;
  old_value: string;
  new_value: string;
  note: string;
  timestamp: string;
}

export interface StampRecord {
  id: number;
  stamp_number: string;
  issued_by: string;
  issued_at: string;
  valid_from: string;
  valid_until: string | null;
  is_revoked: boolean;
}

export interface ApplicationDetail extends ApplicationSummary {
  applicant: Applicant;
  stamp_type: StampType;
  purpose: string;
  notes: string;
  fee_amount: string;
  payment_reference: string;
  reviewed_by: string;
  reviewed_at: string | null;
  decision_notes: string;
  created_at: string;
  updated_at: string;
  audit_logs: AuditLog[];
  stamp_record?: StampRecord;
}

export interface Dashboard {
  total: number;
  draft: number;
  submitted: number;
  under_review: number;
  approved: number;
  rejected: number;
  issued: number;
  cancelled: number;
  fee_collected: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getSummary: () => get<Dashboard>('/dashboard/'),
};

// ─── Stamp Types ──────────────────────────────────────────────────────────────

export const stampTypeApi = {
  list: (activeOnly = false) =>
    get<PaginatedResponse<StampType>>(`/stamp-types/${activeOnly ? '?active_only=1' : ''}`),

  get: (id: number) => get<StampType>(`/stamp-types/${id}/`),

  create: (data: Partial<StampType>) => post<StampType>('/stamp-types/', data),

  update: (id: number, data: Partial<StampType>) =>
    put<StampType>(`/stamp-types/${id}/`, data),

  delete: (id: number) => del<void>(`/stamp-types/${id}/`),
};

// ─── Applicants ───────────────────────────────────────────────────────────────

export const applicantApi = {
  list: (search?: string) =>
    get<PaginatedResponse<Applicant>>(
      `/applicants/${search ? `?search=${encodeURIComponent(search)}` : ''}`
    ),

  get: (id: number) => get<Applicant>(`/applicants/${id}/`),

  create: (data: Partial<Applicant>) => post<Applicant>('/applicants/', data),

  update: (id: number, data: Partial<Applicant>) =>
    put<Applicant>(`/applicants/${id}/`, data),

  getApplications: (id: number) =>
    get<ApplicationSummary[]>(`/applicants/${id}/applications/`),
};

// ─── Applications ─────────────────────────────────────────────────────────────

export const applicationApi = {
  list: (params: {
    status?: ApplicationStatus;
    priority?: string;
    stamp_type?: number;
    search?: string;
    page?: number;
  } = {}) => {
    const qs = new URLSearchParams();
    if (params.status)     qs.set('status', params.status);
    if (params.priority)   qs.set('priority', params.priority);
    if (params.stamp_type) qs.set('stamp_type', String(params.stamp_type));
    if (params.search)     qs.set('search', params.search);
    if (params.page)       qs.set('page', String(params.page));
    const q = qs.toString();
    return get<PaginatedResponse<ApplicationSummary>>(`/applications/${q ? `?${q}` : ''}`);
  },

  get: (id: number) => get<ApplicationDetail>(`/applications/${id}/`),

  create: (data: {
    applicant: number;
    stamp_type: number;
    purpose: string;
    notes?: string;
    priority?: string;
    fee_amount?: number;
  }) => post<ApplicationDetail>('/applications/', data),

  update: (id: number, data: Partial<ApplicationDetail>) =>
    put<ApplicationDetail>(`/applications/${id}/`, data),

  delete: (id: number) => del<void>(`/applications/${id}/`),

  // ── Button Actions ──────────────────────────────────────────────────────

  /** SUBMIT button */
  submit: (id: number, performedBy = 'applicant') =>
    post<ApplicationDetail>(`/applications/${id}/submit/`, { performed_by: performedBy }),

  /** START REVIEW button */
  startReview: (id: number, performedBy = 'officer') =>
    post<ApplicationDetail>(`/applications/${id}/review/`, { performed_by: performedBy }),

  /** APPROVE button */
  approve: (id: number, performedBy = 'officer', decisionNotes = '') =>
    post<ApplicationDetail>(`/applications/${id}/approve/`, {
      performed_by: performedBy,
      decision_notes: decisionNotes,
    }),

  /** REJECT button */
  reject: (id: number, performedBy = 'officer', decisionNotes = 'Rejected.') =>
    post<ApplicationDetail>(`/applications/${id}/reject/`, {
      performed_by: performedBy,
      decision_notes: decisionNotes,
    }),

  /** CANCEL button */
  cancel: (id: number, performedBy = 'officer') =>
    post<ApplicationDetail>(`/applications/${id}/cancel/`, { performed_by: performedBy }),

  /** MARK PAID button */
  recordPayment: (id: number, paymentReference: string, performedBy = 'cashier') =>
    post<ApplicationDetail>(`/applications/${id}/record_payment/`, {
      payment_reference: paymentReference,
      performed_by: performedBy,
    }),

  /** ISSUE STAMP button */
  issueStamp: (id: number, data: {
    issued_by: string;
    valid_from: string;        // YYYY-MM-DD
    valid_until?: string;      // YYYY-MM-DD
  }) => post<{ application: ApplicationDetail; stamp: StampRecord }>(
    `/applications/${id}/issue_stamp/`, data
  ),

  /** Audit trail */
  getAuditLog: (id: number) => get<AuditLog[]>(`/applications/${id}/audit_log/`),
};

// ─── Issued Stamps ────────────────────────────────────────────────────────────

export const stampRecordApi = {
  list: () => get<PaginatedResponse<StampRecord>>('/stamps/'),
  get: (id: number) => get<StampRecord>(`/stamps/${id}/`),
};

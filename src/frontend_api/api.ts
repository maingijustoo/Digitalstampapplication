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

// ─── Businesses ───────────────────────────────────────────────────────────────

export interface Business {
  id: number;
  name: string;
  handle: string;
  website: string;
  category: string;
  county: string;
  description: string;
  badge: 'verified' | 'pending' | 'at-risk' | 'flagged' | 'unverified';
  verified_year: number | null;
  year_established: number | null;
  has_physical_address: boolean;
}

export const businessApi = {
  list: (params: { badge?: string; search?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.badge)  qs.set('badge',  params.badge);
    if (params.search) qs.set('search', params.search);
    const q = qs.toString();
    return get<PaginatedResponse<Business>>(`/businesses/${q ? `?${q}` : ''}`);
  },
  get:    (id: number) => get<Business>(`/businesses/${id}/`),
  verify: (q: string)  => get<Business[]>(`/businesses/verify/?q=${encodeURIComponent(q)}`),
};

// ─── Fraud Reports ────────────────────────────────────────────────────────────

export interface FraudReport {
  id: number;
  business: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'investigating' | 'resolved';
  description: string;
  amount_lost: string | null;
  location: string;
  evidence_url: string;
  reporter_email: string;
  created_at: string;
}

export const fraudReportApi = {
  list: (params: { severity?: string; status?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.severity) qs.set('severity', params.severity);
    if (params.status)   qs.set('status',   params.status);
    const q = qs.toString();
    return get<PaginatedResponse<FraudReport>>(`/fraud-reports/${q ? `?${q}` : ''}`);
  },
  submit: (data: {
    business: string;
    report_type: string;
    severity: string;
    description: string;
    amount_lost?: number;
    location: string;
    evidence_url?: string;
    reporter_email?: string;
  }) => post<FraudReport>('/fraud-reports/', { ...data, is_public: true }),
};

// ─── Scam Alerts ──────────────────────────────────────────────────────────────

export interface ScamAlert {
  id: number;
  title: string;
  type: string;
  description: string;
  location: string;
  date: string;
  is_active: boolean;
}

export const scamAlertApi = {
  list: () => get<PaginatedResponse<ScamAlert>>('/scam-alerts/'),
  get:  (id: number) => get<ScamAlert>(`/scam-alerts/${id}/`),
};

// ─── ADD TO BOTTOM OF api.ts ──────────────────────────────────────────────────

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

/** Authenticated request — attaches Bearer token for /portal/ and /admin/ routes. */
async function authRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    // Token expired — clear storage and redirect to portal login
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/business-portal';
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error ?? errorBody?.detail ?? `API error ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

const authGet  = <T>(path: string) => authRequest<T>(path);
const authPost = <T>(path: string, body?: unknown) =>
  authRequest<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
const authDel  = <T>(path: string) =>
  authRequest<T>(path, { method: 'DELETE' });

// ─── New Types ────────────────────────────────────────────────────────────────

export interface BusinessProfile {
  id: number;
  username: string;
  business_name: string;
  business_handle: string;
  category: string;
  county: string;
  description: string;
  mpesa_paybill: string;
  phone: string;
  website: string;
  is_verified: boolean;
  badge_status: string;
  certificate_id: string | null;
  trust_score: number;
}

export interface ProfileFraudReport {
  id: number;
  business: number;
  report_type: string;
  location: string;
  description: string;
  is_anonymous: boolean;
  reporter_phone: string | null;
  severity_category: 'low' | 'medium' | 'high';
  severity_score: number;
  status: 'open' | 'investigating' | 'resolved';
  created_at: string;
}

export interface BusinessNotification {
  id: number;
  title: string;
  message: string;
  type: 'stamp_approved' | 'stamp_renewal' | 'new_report' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface PortalDashboard {
  business_name: string;
  business_handle: string;
  is_verified: boolean;
  badge_status: string;
  certificate_id: string | null;
  trust_score: number;
  open_reports: number;
  resolved_reports: number;
  total_reports: number;
  unread_notifications: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

/** Decode a JWT payload (no verification — for UI routing only). */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  /** POST /api/token/ — returns access + refresh tokens. */
  login: async (username: string, password: string): Promise<AuthTokens> => {
    const tokens = await post<AuthTokens>('/token/', { username, password });
    localStorage.setItem('access_token',  tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    return tokens;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  /** Returns true if the logged-in user is a staff/admin. */
  isAdmin: (): boolean => {
    const token = getAccessToken();
    if (!token) return false;
    const payload = decodeJwtPayload(token);
    return payload.is_staff === true;
  },
};

// ─── Directory API (Public) ───────────────────────────────────────────────────

export const directoryApi = {
  search: (q: string) =>
    get<BusinessProfile[]>(`/directory/search/?q=${encodeURIComponent(q)}`),
};

// ─── Reports API (Public) ─────────────────────────────────────────────────────

export const reportsApi = {
  submit: (data: {
    business: number;
    report_type: string;
    location: string;
    description: string;
    is_anonymous: boolean;
    reporter_phone?: string;
  }) => post<ProfileFraudReport>('/reports/', data),

  publicFeed: () => get<ProfileFraudReport[]>('/reports/public/'),
};

// ─── Portal API (JWT Required) ────────────────────────────────────────────────

export const portalApi = {
  getDashboard:     () => authGet<PortalDashboard>('/portal/dashboard/'),
  getNotifications: () => authGet<BusinessNotification[]>('/portal/notifications/'),
  getMyReports:     () => authGet<ProfileFraudReport[]>('/portal/my-reports/'),
};

// ─── Admin API (JWT + IsAdminUser Required) ───────────────────────────────────

export const adminApi = {
  getAllReports: (params: { status?: string; severity?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.status)   qs.set('status',   params.status);
    if (params.severity) qs.set('severity', params.severity);
    const q = qs.toString();
    return authGet<ProfileFraudReport[]>(`/admin/reports/${q ? `?${q}` : ''}`);
  },

  deleteReport: (id: number) =>
    authDel<{ success: boolean; deleted_id: number }>(`/admin/reports/${id}/`),

  flagBusiness: (id: number, reason: string) =>
    authPost<{ success: boolean; business_id: number; badge_status: string; trust_score: number }>(
      `/admin/businesses/${id}/flag/`, { reason }
    ),

  approveApplication: (id: number, performedBy = 'admin', decisionNotes = '') =>
    authPost(`/applications/${id}/approve/`, {
      performed_by: performedBy,
      decision_notes: decisionNotes,
    }),

  issueStamp: (id: number, data: { issued_by: string; valid_from: string; valid_until?: string }) =>
    authPost(`/applications/${id}/issue_stamp/`, data),
};
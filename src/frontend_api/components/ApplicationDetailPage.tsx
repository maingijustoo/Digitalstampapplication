/**
 * ApplicationDetailPage
 * Full detail view for a single application.
 * Combines: detail fields + action buttons + audit timeline.
 */

import React, { useState } from 'react';
import { useApplication } from '../hooks/useApplication';
import { ApplicationActions } from './ApplicationActions';
import { AuditLogTimeline } from './AuditLogTimeline';
import type { ApplicationDetail } from '../api';

const STATUS_COLORS: Record<string, string> = {
  draft:        'bg-gray-100 text-gray-700',
  submitted:    'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-800',
  approved:     'bg-green-100 text-green-700',
  rejected:     'bg-red-100 text-red-700',
  issued:       'bg-emerald-100 text-emerald-700',
  cancelled:    'bg-gray-100 text-gray-400',
};

interface Props {
  applicationId: number;
  currentUser?: string;
  onBack?: () => void;
}

export function ApplicationDetailPage({ applicationId, currentUser = 'officer', onBack }: Props) {
  const { application, loading, error, refresh } = useApplication(applicationId);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="grid grid-cols-2 gap-4 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-600 text-sm">{error ?? 'Application not found.'}</p>
        {onBack && (
          <button onClick={onBack} className="mt-3 btn-ghost text-sm">
            ← Back
          </button>
        )}
      </div>
    );
  }

  const handleSuccess = (updated: ApplicationDetail) => {
    setSuccessMsg(`Status updated to "${updated.status_display}"`);
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 4000);
    refresh();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          {onBack && (
            <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1">
              ← Back to list
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900 font-mono">
            {application.reference_number || `#${application.id}`}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Created {new Date(application.created_at).toLocaleDateString('en-KE')}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              STATUS_COLORS[application.status] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {application.status_display}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
              application.priority === 'urgent'
                ? 'bg-orange-100 text-orange-700'
                : application.priority === 'express'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {application.priority}
          </span>
        </div>
      </div>

      {/* ── Feedback banners ── */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {errorMsg}
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Details */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Applicant card */}
          <Section title="Applicant">
            <Row label="Name"        value={application.applicant?.full_name} />
            <Row label="Type"        value={application.applicant?.applicant_type} capitalize />
            <Row label="ID / Reg"    value={application.applicant?.id_number || '—'} />
            <Row label="Email"       value={application.applicant?.email || '—'} />
            <Row label="Phone"       value={application.applicant?.phone || '—'} />
            <Row label="Address"     value={application.applicant?.address || '—'} />
          </Section>

          {/* Stamp details card */}
          <Section title="Stamp Details">
            <Row label="Stamp Type"  value={application.stamp_type?.name} />
            <Row label="Code"        value={application.stamp_type?.code} mono />
            <Row label="Fee"         value={`KES ${parseFloat(application.fee_amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`} />
            <Row
              label="Payment"
              value={
                application.fee_paid
                  ? `✓ Paid (${application.payment_reference || 'ref not recorded'})`
                  : 'Pending'
              }
              highlight={application.fee_paid ? 'green' : 'gray'}
            />
          </Section>

          {/* Purpose / notes card */}
          <Section title="Purpose & Notes">
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{application.purpose}</div>
            {application.notes && (
              <>
                <hr className="my-2" />
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{application.notes}</p>
              </>
            )}
          </Section>

          {/* Decision card (if reviewed) */}
          {(application.reviewed_by || application.decision_notes) && (
            <Section title="Review Decision">
              {application.reviewed_by && (
                <Row
                  label="Reviewed by"
                  value={`${application.reviewed_by}${
                    application.reviewed_at
                      ? ` on ${new Date(application.reviewed_at).toLocaleDateString('en-KE')}`
                      : ''
                  }`}
                />
              )}
              {application.decision_notes && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-gray-600">{application.decision_notes}</p>
                </div>
              )}
            </Section>
          )}

          {/* Issued stamp card */}
          {application.stamp_record && (
            <Section title="Issued Stamp">
              <Row label="Stamp No."   value={application.stamp_record.stamp_number} mono />
              <Row label="Issued by"   value={application.stamp_record.issued_by} />
              <Row label="Valid from"  value={application.stamp_record.valid_from} />
              <Row label="Valid until" value={application.stamp_record.valid_until ?? 'No expiry'} />
              <Row
                label="Status"
                value={application.stamp_record.is_revoked ? '⚠️ Revoked' : '✓ Active'}
                highlight={application.stamp_record.is_revoked ? 'red' : 'green'}
              />
            </Section>
          )}
        </div>

        {/* Right: Actions + Audit */}
        <div className="flex flex-col gap-6">
          <Section title="Actions">
            <ApplicationActions
              application={application}
              currentUser={currentUser}
              onSuccess={handleSuccess}
              onError={setErrorMsg}
            />
          </Section>

          <Section title="Audit Trail">
            <AuditLogTimeline logs={application.audit_logs ?? []} />
          </Section>
        </div>
      </div>
    </div>
  );
}

// ─── Small layout helpers ─────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  capitalize,
  highlight,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  capitalize?: boolean;
  highlight?: 'green' | 'red' | 'gray';
}) {
  const valueClass = [
    'text-sm',
    mono ? 'font-mono' : 'font-medium',
    capitalize ? 'capitalize' : '',
    highlight === 'green'
      ? 'text-green-700'
      : highlight === 'red'
      ? 'text-red-600'
      : 'text-gray-800',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex justify-between items-start py-1 border-b border-gray-50 last:border-0 gap-4">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className={valueClass}>{value ?? '—'}</span>
    </div>
  );
}

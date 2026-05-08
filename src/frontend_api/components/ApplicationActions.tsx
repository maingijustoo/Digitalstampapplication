/**
 * ApplicationActions
 * Renders the correct set of action buttons for each application status.
 * Every button calls the Django API via the useApplication hook.
 */

import React, { useState } from 'react';
import { useApplication, type ApplicationDetail } from '../api';

interface Props {
  application: ApplicationDetail;
  currentUser?: string;
  onSuccess?: (updated: ApplicationDetail) => void;
  onError?: (msg: string) => void;
}

export function ApplicationActions({
  application,
  currentUser = 'officer',
  onSuccess,
  onError,
}: Props) {
  const {
    actionLoading,
    error,
    submit,
    startReview,
    approve,
    reject,
    cancel,
    recordPayment,
    issueStamp,
  } = useApplication(application.id);

  const [paymentRef, setPaymentRef]     = useState('');
  const [rejectNote, setRejectNote]     = useState('');
  const [approveNote, setApproveNote]   = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showIssueModal, setShowIssueModal]   = useState(false);
  const [issueData, setIssueData] = useState({
    issued_by: currentUser,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
  });

  const handle = async (fn: () => Promise<ApplicationDetail>) => {
    try {
      const updated = await fn();
      onSuccess?.(updated);
    } catch (e: any) {
      onError?.(e.message);
    }
  };

  const s = application.status;
  const disabled = actionLoading;

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      {/* ── DRAFT: Submit ─────────────────────────────────────── */}
      {s === 'draft' && (
        <button
          disabled={disabled}
          onClick={() => handle(() => submit(currentUser))}
          className="btn-primary"
        >
          {actionLoading ? 'Submitting…' : '📤 Submit Application'}
        </button>
      )}

      {/* ── SUBMITTED: Start Review ───────────────────────────── */}
      {s === 'submitted' && (
        <>
          <button
            disabled={disabled}
            onClick={() => handle(() => startReview(currentUser))}
            className="btn-primary"
          >
            {actionLoading ? 'Processing…' : '🔍 Start Review'}
          </button>
          <button
            disabled={disabled}
            onClick={() => setShowRejectModal(true)}
            className="btn-danger"
          >
            ✕ Reject
          </button>
        </>
      )}

      {/* ── UNDER REVIEW: Approve / Reject ────────────────────── */}
      {s === 'under_review' && (
        <>
          <button
            disabled={disabled}
            onClick={() => handle(() => approve(currentUser, approveNote))}
            className="btn-success"
          >
            {actionLoading ? 'Approving…' : '✓ Approve'}
          </button>
          <input
            className="input-field text-sm"
            placeholder="Approval note (optional)"
            value={approveNote}
            onChange={e => setApproveNote(e.target.value)}
          />
          <button
            disabled={disabled}
            onClick={() => setShowRejectModal(true)}
            className="btn-danger"
          >
            ✕ Reject
          </button>
        </>
      )}

      {/* ── APPROVED: Record Payment then Issue Stamp ─────────── */}
      {s === 'approved' && (
        <>
          {!application.fee_paid ? (
            <button
              disabled={disabled}
              onClick={() => setShowPayModal(true)}
              className="btn-warning"
            >
              💳 Record Payment
            </button>
          ) : (
            <span className="text-sm text-green-700 font-medium">✓ Fee Paid</span>
          )}
          <button
            disabled={disabled || !application.fee_paid}
            onClick={() => setShowIssueModal(true)}
            className="btn-primary disabled:opacity-40"
            title={!application.fee_paid ? 'Record payment first' : ''}
          >
            🏷 Issue Stamp
          </button>
        </>
      )}

      {/* ── ISSUED: read-only ─────────────────────────────────── */}
      {s === 'issued' && (
        <span className="text-sm text-green-700 font-semibold">
          ✅ Stamp Issued — {application.stamp_record?.stamp_number}
        </span>
      )}

      {/* ── REJECTED / CANCELLED: read-only ───────────────────── */}
      {(s === 'rejected' || s === 'cancelled') && (
        <span className="text-sm text-gray-500 italic capitalize">
          Application {s}
        </span>
      )}

      {/* ── Cancel button (all non-final states) ──────────────── */}
      {!['issued', 'rejected', 'cancelled'].includes(s) && (
        <button
          disabled={disabled}
          onClick={() => handle(() => cancel(currentUser))}
          className="btn-ghost text-sm"
        >
          Cancel Application
        </button>
      )}

      {/* ── Payment Modal ──────────────────────────────────────── */}
      {showPayModal && (
        <Modal title="Record Payment" onClose={() => setShowPayModal(false)}>
          <label className="label">Payment Reference (e.g. MPesa code)</label>
          <input
            className="input-field"
            value={paymentRef}
            onChange={e => setPaymentRef(e.target.value)}
            placeholder="e.g. QHJ4T9WXYZ"
          />
          <div className="flex gap-2 mt-4">
            <button
              disabled={!paymentRef.trim() || disabled}
              onClick={async () => {
                await handle(() => recordPayment(paymentRef.trim(), currentUser));
                setShowPayModal(false);
                setPaymentRef('');
              }}
              className="btn-primary flex-1"
            >
              {actionLoading ? 'Saving…' : 'Confirm Payment'}
            </button>
            <button onClick={() => setShowPayModal(false)} className="btn-ghost flex-1">
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* ── Reject Modal ───────────────────────────────────────── */}
      {showRejectModal && (
        <Modal title="Reject Application" onClose={() => setShowRejectModal(false)}>
          <label className="label">Reason for rejection</label>
          <textarea
            className="input-field min-h-[80px]"
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            placeholder="Explain why this application is being rejected…"
          />
          <div className="flex gap-2 mt-4">
            <button
              disabled={!rejectNote.trim() || disabled}
              onClick={async () => {
                await handle(() => reject(currentUser, rejectNote));
                setShowRejectModal(false);
              }}
              className="btn-danger flex-1"
            >
              {actionLoading ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
            <button onClick={() => setShowRejectModal(false)} className="btn-ghost flex-1">
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* ── Issue Stamp Modal ──────────────────────────────────── */}
      {showIssueModal && (
        <Modal title="Issue Stamp" onClose={() => setShowIssueModal(false)}>
          <div className="flex flex-col gap-3">
            <div>
              <label className="label">Issued By</label>
              <input
                className="input-field"
                value={issueData.issued_by}
                onChange={e => setIssueData(d => ({ ...d, issued_by: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Valid From</label>
              <input
                type="date"
                className="input-field"
                value={issueData.valid_from}
                onChange={e => setIssueData(d => ({ ...d, valid_from: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Valid Until (optional)</label>
              <input
                type="date"
                className="input-field"
                value={issueData.valid_until}
                onChange={e => setIssueData(d => ({ ...d, valid_until: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              disabled={!issueData.issued_by || !issueData.valid_from || disabled}
              onClick={async () => {
                await handle(() =>
                  issueStamp({
                    issued_by: issueData.issued_by,
                    valid_from: issueData.valid_from,
                    valid_until: issueData.valid_until || undefined,
                  })
                );
                setShowIssueModal(false);
              }}
              className="btn-primary flex-1"
            >
              {actionLoading ? 'Issuing…' : '🏷 Issue Stamp'}
            </button>
            <button onClick={() => setShowIssueModal(false)} className="btn-ghost flex-1">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Tiny inline modal ────────────────────────────────────────────────────────

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

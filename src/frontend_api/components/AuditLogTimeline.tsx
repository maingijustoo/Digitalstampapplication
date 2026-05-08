/**
 * AuditLogTimeline
 * Renders the full audit trail for a stamp application.
 * Data comes from GET /api/applications/{id}/audit_log/
 */

import React from 'react';
import type { AuditLog } from '../api';

const ACTION_META: Record<string, { icon: string; color: string; label: string }> = {
  created:           { icon: '🆕', color: 'bg-gray-100',    label: 'Created' },
  submitted:         { icon: '📤', color: 'bg-blue-100',    label: 'Submitted' },
  status_changed:    { icon: '🔄', color: 'bg-yellow-100',  label: 'Status Changed' },
  document_uploaded: { icon: '📎', color: 'bg-purple-100',  label: 'Document Uploaded' },
  payment_recorded:  { icon: '💳', color: 'bg-green-100',   label: 'Payment Recorded' },
  stamp_issued:      { icon: '🏷',  color: 'bg-emerald-100', label: 'Stamp Issued' },
  stamp_revoked:     { icon: '🚫', color: 'bg-red-100',     label: 'Stamp Revoked' },
  note_added:        { icon: '📝', color: 'bg-indigo-100',  label: 'Note Added' },
};

interface Props {
  logs: AuditLog[];
  loading?: boolean;
}

export function AuditLogTimeline({ logs, loading }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!logs.length) {
    return <p className="text-sm text-gray-400 italic">No audit history yet.</p>;
  }

  return (
    <ol className="relative border-l-2 border-gray-200 ml-4 flex flex-col gap-0">
      {logs.map((log, idx) => {
        const meta = ACTION_META[log.action] ?? {
          icon: '•',
          color: 'bg-gray-100',
          label: log.action,
        };

        return (
          <li key={log.id} className="mb-6 ml-6">
            {/* Dot */}
            <span
              className={`absolute -left-4 flex items-center justify-center w-8 h-8 rounded-full text-sm ${meta.color} border-2 border-white shadow`}
            >
              {meta.icon}
            </span>

            <div className="bg-white border border-gray-100 rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-sm font-semibold text-gray-800">{meta.label}</h4>
                <time className="text-xs text-gray-400">
                  {new Date(log.timestamp).toLocaleString('en-KE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>

              {/* Status change arrow */}
              {log.old_value && log.new_value && (
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-medium capitalize">{log.old_value.replace('_', ' ')}</span>
                  {' → '}
                  <span className="font-medium capitalize">{log.new_value.replace('_', ' ')}</span>
                </p>
              )}

              {/* Note */}
              {log.note && (
                <p className="text-xs text-gray-600 mt-1 italic">"{log.note}"</p>
              )}

              {/* Officer */}
              <p className="text-xs text-gray-400 mt-1">by {log.performed_by}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

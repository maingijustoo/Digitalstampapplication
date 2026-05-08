/**
 * ApplicationsTable
 * Displays a filterable, searchable list of stamp applications.
 */

import React from 'react';
import { useApplications } from '../hooks/useApplications';
import type { ApplicationStatus } from '../api';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft:        'bg-gray-100 text-gray-700',
  submitted:    'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-800',
  approved:     'bg-green-100 text-green-700',
  rejected:     'bg-red-100 text-red-700',
  issued:       'bg-emerald-100 text-emerald-700',
  cancelled:    'bg-gray-100 text-gray-500 line-through',
};

const ALL_STATUSES: ApplicationStatus[] = [
  'draft', 'submitted', 'under_review', 'approved', 'rejected', 'issued', 'cancelled',
];

interface Props {
  onSelect?: (id: number) => void;
}

export function ApplicationsTable({ onSelect }: Props) {
  const { applications, count, loading, error, filters, setFilters, refresh } =
    useApplications();

  return (
    <div className="flex flex-col gap-4">
      {/* ── Filters bar ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="input-field max-w-xs"
          placeholder="Search ref. no. or name…"
          value={filters.search ?? ''}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
        />

        <select
          className="input-field w-auto"
          value={filters.status ?? ''}
          onChange={e =>
            setFilters(f => ({
              ...f,
              status: (e.target.value as ApplicationStatus) || undefined,
              page: 1,
            }))
          }
        >
          <option value="">All statuses</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>

        <select
          className="input-field w-auto"
          value={filters.priority ?? ''}
          onChange={e =>
            setFilters(f => ({ ...f, priority: e.target.value || undefined, page: 1 }))
          }
        >
          <option value="">All priorities</option>
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
          <option value="express">Express</option>
        </select>

        <button onClick={refresh} className="btn-ghost text-sm ml-auto">
          ↻ Refresh
        </button>
      </div>

      {/* ── Count ── */}
      <p className="text-sm text-gray-500">
        {loading ? 'Loading…' : `${count} application${count !== 1 ? 's' : ''}`}
      </p>

      {/* ── Error ── */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              {['Reference', 'Applicant', 'Stamp Type', 'Priority', 'Status', 'Fee Paid', 'Date', ''].map(
                h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!loading && applications.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-8">
                  No applications found.
                </td>
              </tr>
            )}
            {applications.map(app => (
              <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono font-medium text-blue-700">
                  {app.reference_number || '—'}
                </td>
                <td className="px-4 py-3">{app.applicant_name}</td>
                <td className="px-4 py-3 text-gray-600">{app.stamp_type_name}</td>
                <td className="px-4 py-3 capitalize">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      app.priority === 'urgent'
                        ? 'bg-orange-100 text-orange-700'
                        : app.priority === 'express'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {app.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      STATUS_COLORS[app.status]
                    }`}
                  >
                    {app.status_display}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {app.fee_paid ? (
                    <span className="text-green-600 font-medium">✓ Paid</span>
                  ) : (
                    <span className="text-gray-400">Pending</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {new Date(app.created_at).toLocaleDateString('en-KE')}
                </td>
                <td className="px-4 py-3">
                  {onSelect && (
                    <button
                      onClick={() => onSelect(app.id)}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      View →
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {count > 20 && (
        <div className="flex gap-2 items-center text-sm">
          <button
            disabled={!filters.page || filters.page <= 1}
            onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}
            className="btn-ghost disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-gray-500">Page {filters.page ?? 1}</span>
          <button
            onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}
            className="btn-ghost"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

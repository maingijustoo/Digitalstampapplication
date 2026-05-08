/**
 * DashboardStats
 * Fetches summary counts from GET /api/dashboard/ and renders stat cards.
 */

import React from 'react';
import { useDashboard } from '../hooks/useDashboard';

interface StatCardProps {
  label: string;
  value: number | string;
  color: string;
  icon: string;
  onClick?: () => void;
}

function StatCard({ label, value, color, icon, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-shadow hover:shadow-md ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      } ${color}`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-3xl font-bold tabular-nums">{value}</span>
      <span className="text-sm font-medium opacity-80">{label}</span>
    </button>
  );
}

interface Props {
  /** Called with a status filter when a card is clicked */
  onFilterByStatus?: (status: string) => void;
}

export function DashboardStats({ onFilterByStatus }: Props) {
  const { data, loading, error, refresh } = useDashboard();

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 animate-pulse bg-gray-100 h-28" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        Failed to load dashboard: {error}{' '}
        <button onClick={refresh} className="underline ml-2">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    { label: 'Total Applications', value: data.total,        color: 'bg-white border-gray-200 text-gray-800',          icon: '📋', status: '' },
    { label: 'Draft',              value: data.draft,         color: 'bg-gray-50 border-gray-200 text-gray-700',         icon: '📝', status: 'draft' },
    { label: 'Submitted',          value: data.submitted,     color: 'bg-blue-50 border-blue-200 text-blue-800',          icon: '📤', status: 'submitted' },
    { label: 'Under Review',       value: data.under_review,  color: 'bg-yellow-50 border-yellow-200 text-yellow-800',    icon: '🔍', status: 'under_review' },
    { label: 'Approved',           value: data.approved,      color: 'bg-green-50 border-green-200 text-green-800',       icon: '✅', status: 'approved' },
    { label: 'Issued',             value: data.issued,        color: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: '🏷', status: 'issued' },
    { label: 'Rejected',           value: data.rejected,      color: 'bg-red-50 border-red-200 text-red-800',             icon: '✕', status: 'rejected' },
    {
      label: 'Fees Collected (KES)',
      value: `${parseFloat(data.fee_collected).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      icon: '💰',
      status: '',
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Overview</h2>
        <button onClick={refresh} className="text-sm text-gray-400 hover:text-gray-600">
          ↻ Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            color={card.color}
            icon={card.icon}
            onClick={
              card.status && onFilterByStatus
                ? () => onFilterByStatus(card.status)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

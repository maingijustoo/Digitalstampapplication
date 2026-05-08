/**
 * KCCP – Digital Stamp Application
 * Root component: ties dashboard, list, detail, and new-form together.
 *
 * Drop this file into src/App.tsx in your React project.
 * All API calls go to Django on http://localhost:8000/api/
 */

import React, { useState } from 'react';
import { DashboardStats }       from '../frontend_api/components/DashboardStats';
import { ApplicationsTable }    from '../frontend_api/components/ApplicationsTable';
import { ApplicationDetailPage } from '../frontend_api/components/ApplicationDetailPage';
import { NewApplicationForm }   from '../frontend_api/components/NewApplicationForm';

type View = 'dashboard' | 'list' | 'detail' | 'new';

export default function App() {
  const [view, setView]           = useState<View>('dashboard');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const navigate = (v: View, id?: number) => {
    setSelectedId(id ?? null);
    setView(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDashboardFilter = (status: string) => {
    setStatusFilter(status);
    navigate('list');
  };

  const handleNewSuccess = (refNumber: string) => {
    setSuccessBanner(`Application ${refNumber} created successfully!`);
    navigate('list');
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ── Top nav ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏛</span>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">KCCP</h1>
              <p className="text-xs text-gray-400">Digital Stamp Platform</p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {(
              [
                { v: 'dashboard', label: '📊 Dashboard' },
                { v: 'list',      label: '📋 Applications' },
                { v: 'new',       label: '+ New' },
              ] as { v: View; label: string }[]
            ).map(({ v, label }) => (
              <button
                key={v}
                onClick={() => navigate(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === v
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Success banner ── */}
      {successBanner && (
        <div className="bg-green-600 text-white text-sm text-center py-2 px-4">
          ✓ {successBanner}
          <button
            onClick={() => setSuccessBanner(null)}
            className="ml-4 underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Page content ── */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Dashboard */}
        {view === 'dashboard' && (
          <div className="flex flex-col gap-8">
            <DashboardStats onFilterByStatus={handleDashboardFilter} />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Recent Applications</h2>
                <button
                  onClick={() => navigate('list')}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View all →
                </button>
              </div>
              <ApplicationsTable onSelect={id => navigate('detail', id)} />
            </div>
          </div>
        )}

        {/* Applications list */}
        {view === 'list' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">All Applications</h2>
              <button
                onClick={() => navigate('new')}
                className="btn-primary text-sm"
              >
                + New Application
              </button>
            </div>
            <ApplicationsTable onSelect={id => navigate('detail', id)} />
          </div>
        )}

        {/* Application detail */}
        {view === 'detail' && selectedId && (
          <ApplicationDetailPage
            applicationId={selectedId}
            currentUser="officer"
            onBack={() => navigate('list')}
          />
        )}

        {/* New application form */}
        {view === 'new' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-gray-800">New Application</h2>
            <NewApplicationForm
              onSuccess={handleNewSuccess}
              onCancel={() => navigate('list')}
            />
          </div>
        )}
      </main>
    </div>
  );
}

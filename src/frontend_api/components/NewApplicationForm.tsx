/**
 * NewApplicationForm
 * Creates a new stamp application (POST /api/applications/).
 * Fetches stamp types + applicants from the backend to populate dropdowns.
 */

import React, { useState } from 'react';
import { applicationApi } from '../api';
import { useStampTypes } from '../hooks/useStampTypes';
import { useApplicants } from '../hooks/useApplicants';

interface Props {
  onSuccess?: (refNumber: string) => void;
  onCancel?: () => void;
}

export function NewApplicationForm({ onSuccess, onCancel }: Props) {
  const { stampTypes, loading: stLoading } = useStampTypes(true);
  const {
    applicants,
    loading: appLoading,
    search,
    setSearch,
    createApplicant,
  } = useApplicants();

  const [step, setStep] = useState<'applicant' | 'form'>('applicant');
  const [selectedApplicant, setSelectedApplicant] = useState<number | null>(null);
  const [newApplicant, setNewApplicant] = useState({
    full_name: '',
    id_number: '',
    email: '',
    phone: '',
    applicant_type: 'individual' as const,
    address: '',
  });
  const [creatingNew, setCreatingNew] = useState(false);

  const [form, setForm] = useState({
    stamp_type: '',
    purpose: '',
    notes: '',
    priority: 'normal',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Step 1: pick / create applicant ──────────────────────────────────────

  const handleSelectApplicant = (id: number) => {
    setSelectedApplicant(id);
    setStep('form');
  };

  const handleCreateApplicant = async () => {
    if (!newApplicant.full_name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createApplicant(newApplicant);
      setSelectedApplicant(created.id);
      setStep('form');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Step 2: submit application ────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant || !form.stamp_type || !form.purpose.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const stampType = stampTypes.find(st => st.id === Number(form.stamp_type));
      const app = await applicationApi.create({
        applicant: selectedApplicant,
        stamp_type: Number(form.stamp_type),
        purpose: form.purpose,
        notes: form.notes,
        priority: form.priority,
        fee_amount: stampType ? parseFloat(stampType.fee) : 0,
      });
      onSuccess?.(app.reference_number);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-xl w-full mx-auto">
      <h2 className="text-xl font-semibold mb-4">New Stamp Application</h2>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {/* ── Step 1: Applicant ── */}
      {step === 'applicant' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Search existing applicant</label>
            <input
              className="input-field"
              placeholder="Name, ID number, or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {appLoading ? (
            <p className="text-sm text-gray-500">Loading applicants…</p>
          ) : (
            <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
              {applicants.map(a => (
                <button
                  key={a.id}
                  onClick={() => handleSelectApplicant(a.id)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between items-center"
                >
                  <span className="font-medium">{a.full_name}</span>
                  <span className="text-xs text-gray-400">{a.id_number}</span>
                </button>
              ))}
              {applicants.length === 0 && (
                <p className="text-sm text-gray-400 px-4 py-3">No results</p>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <button
              className="text-sm font-medium text-blue-600 hover:underline mb-3"
              onClick={() => setCreatingNew(v => !v)}
            >
              + Register new applicant
            </button>

            {creatingNew && (
              <div className="flex flex-col gap-3">
                {[
                  { key: 'full_name', label: 'Full Name *', placeholder: 'John Doe' },
                  { key: 'id_number', label: 'ID / Registration No.', placeholder: '12345678' },
                  { key: 'email', label: 'Email', placeholder: 'john@example.com' },
                  { key: 'phone', label: 'Phone', placeholder: '+254700000000' },
                  { key: 'address', label: 'Address', placeholder: 'Nairobi, Kenya' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input
                      className="input-field"
                      placeholder={placeholder}
                      value={(newApplicant as any)[key]}
                      onChange={e =>
                        setNewApplicant(d => ({ ...d, [key]: e.target.value }))
                      } 
                    />
                  </div>
                ))}
                <div>
                  <label className="label">Type</label>
                  <select
                    className="input-field"
                    value={newApplicant.applicant_type}
                    onChange={e =>
                      setNewApplicant(d => ({
                        ...d,
                        applicant_type: e.target.value as any,
                      }))
                    }
                  >
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                    <option value="government">Government Body</option>
                  </select>
                </div>
                <button
                  disabled={saving || !newApplicant.full_name.trim()}
                  onClick={handleCreateApplicant}
                  className="btn-primary"
                >
                  {saving ? 'Saving…' : 'Save & Continue →'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 2: Application form ── */}
      {step === 'form' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Stamp Type *</label>
            {stLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : (
              <select
                required
                className="input-field"
                value={form.stamp_type}
                onChange={e => setForm(d => ({ ...d, stamp_type: e.target.value }))}
              >
                <option value="">Select stamp type…</option>
                {stampTypes.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.name} — KES {parseFloat(st.fee).toLocaleString()}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="label">Priority</label>
            <select
              className="input-field"
              value={form.priority}
              onChange={e => setForm(d => ({ ...d, priority: e.target.value }))}
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="express">Express</option>
            </select>
          </div>

          <div>
            <label className="label">Purpose *</label>
            <textarea
              required
              className="input-field min-h-[80px]"
              placeholder="Describe why this stamp is needed…"
              value={form.purpose}
              onChange={e => setForm(d => ({ ...d, purpose: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Additional Notes</label>
            <textarea
              className="input-field"
              placeholder="Optional…"
              value={form.notes}
              onChange={e => setForm(d => ({ ...d, notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Creating…' : '✓ Create Application'}
            </button>
            <button
              type="button"
              onClick={() => setStep('applicant')}
              className="btn-ghost"
            >
              ← Back
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="btn-ghost">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

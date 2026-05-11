import { useState } from "react";
import { Flag, AlertTriangle, CheckCircle } from "lucide-react";
import { reportsApi, directoryApi, type BusinessProfile } from "../api";

interface ReportForm {
  business_query: string;   // what the user types to find the business
  report_type: string;
  description: string;
  amount_lost: string;
  location: string;
  is_anonymous: boolean;
  reporter_phone: string;
}

const REPORT_TYPES = [
  "Non-delivery", "Fake Products", "Payment Fraud",
  "Identity Theft", "Investment Scam", "Phishing", "Impersonation", "Other",
];

const COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika",
  "Machakos", "Nyeri", "Meru", "Kakamega", "Kilifi", "Garissa", "Other",
];

export function ReportFraud() {
  const [form, setForm] = useState<ReportForm>({
    business_query: "",
    report_type: "",
    description: "",
    amount_lost: "",
    location: "",
    is_anonymous: false,
    reporter_phone: "",
  });

  // Business lookup state
  const [bizResults, setBizResults]       = useState<BusinessProfile[]>([]);
  const [selectedBiz, setSelectedBiz]     = useState<BusinessProfile | null>(null);
  const [bizSearching, setBizSearching]   = useState(false);
  const [bizSearched, setBizSearched]     = useState(false);

  const [errors, setErrors]           = useState<Partial<Record<keyof ReportForm | "business_id", string>>>({});
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted]     = useState(false);

  // ── Business search ─────────────────────────────────────────────────────────
  const handleBizSearch = async () => {
    if (!form.business_query.trim()) return;
    setBizSearching(true);
    setBizSearched(false);
    setSelectedBiz(null);
    setBizResults([]);
    try {
      const data = await directoryApi.search(form.business_query.trim());
      setBizResults(data);
      setBizSearched(true);
      if (data.length === 1) setSelectedBiz(data[0]);
    } finally {
      setBizSearching(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((f) => ({ ...f, [name]: newValue }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!selectedBiz)                                        e.business_id    = "Select a business from the search results";
    if (!form.report_type)                                   e.report_type    = "Required";
    if (!form.description.trim() || form.description.length < 30)
                                                             e.description    = "At least 30 characters required";
    if (!form.location)                                      e.location       = "Required";
    if (!form.is_anonymous && !form.reporter_phone.trim())   e.reporter_phone = "Phone number required for non-anonymous reports";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await reportsApi.submit({
        business:       selectedBiz!.id,
        report_type:    form.report_type,
        location:       form.location,
        description:    form.description.trim(),
        is_anonymous:   form.is_anonymous,
        reporter_phone: form.is_anonymous ? undefined : form.reporter_phone.trim(),
      });
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      business_query: "", report_type: "", description: "",
      amount_lost: "", location: "", is_anonymous: false, reporter_phone: "",
    });
    setBizResults([]); setSelectedBiz(null); setBizSearched(false);
    setSubmitted(false); setErrors({}); setSubmitError(null);
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="rounded-xl p-8 shadow-lg" style={{ background: "#fff", border: "2px solid #2ecc71" }}>
          <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#2ecc71" }} />
          <h1 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.4rem" }}>Report Submitted!</h1>
          <p className="mt-3" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            Thank you for helping protect other Kenyan consumers. Our team will review your report
            and take appropriate action.
          </p>
          <div className="mt-5 p-4 rounded-lg text-left" style={{ background: "#f8f9fc" }}>
            <p style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "0.85rem" }}>
              Business Reported: {selectedBiz?.business_name}
            </p>
            <p style={{ color: "#9aa3b5", fontSize: "0.8rem" }}>Type: {form.report_type}</p>
            <p style={{ color: "#9aa3b5", fontSize: "0.8rem" }}>
              Submitted: {form.is_anonymous ? "Anonymously" : "With contact info"}
            </p>
          </div>
          <div className="flex gap-3 mt-6 justify-center">
            <a href="/" className="px-5 py-2 rounded-lg font-bold text-sm text-white"
              style={{ background: "#1a2f5e" }}>
              Back to Home
            </a>
            <button onClick={resetForm}
              className="px-5 py-2 rounded-lg font-bold text-sm"
              style={{ background: "#f4f6fb", color: "#1a2f5e", border: "1px solid #e0e4ed" }}>
              Report Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Flag className="w-12 h-12 mx-auto mb-3" style={{ color: "#e67e22" }} />
        <h1 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.6rem" }}>Report a Fraud</h1>
        <p className="mt-2" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
          Help protect other Kenyan consumers by reporting suspicious or fraudulent businesses.
        </p>
      </div>

      <div className="flex gap-3 p-4 rounded-xl mb-6"
        style={{ background: "#fff3e0", border: "1px solid #e67e22" }}>
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#e67e22" }} />
        <p style={{ fontSize: "0.82rem", color: "#7d4e00" }}>
          <strong>Important:</strong> False reports are a violation of KCPP's Terms of Service.
          Only report businesses where you have genuine evidence of fraudulent activity.
        </p>
      </div>

      {submitError && (
        <div className="rounded-lg p-3 mb-4 text-sm"
          style={{ background: "#fce4ec", color: "#c0392b", border: "1px solid #e74c3c" }}>
          ⚠️ {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl shadow p-6 flex flex-col gap-5"
          style={{ background: "#fff", border: "1px solid #e0e4ed" }}>

          {/* ── Step 1: Find the business ─────────────────────────────── */}
          <div>
            <label className="block mb-1"
              style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
              Business Name / Handle *
            </label>
            <div className="flex gap-2">
              <input
                name="business_query"
                value={form.business_query}
                onChange={(e) => {
                  setForm((f) => ({ ...f, business_query: e.target.value }));
                  setSelectedBiz(null);
                  setBizSearched(false);
                }}
                placeholder="e.g., @FakeShop254 or QuickCash Kenya"
                className="flex-1 px-3 py-2 rounded-lg outline-none"
                style={{
                  border: `1px solid ${errors.business_id ? "#e74c3c" : "#e0e4ed"}`,
                  fontSize: "0.88rem",
                }}
              />
              <button
                type="button"
                onClick={handleBizSearch}
                disabled={bizSearching || !form.business_query.trim()}
                className="px-4 py-2 rounded-lg font-bold text-white text-sm shrink-0"
                style={{ background: "#1a2f5e", opacity: bizSearching ? 0.6 : 1 }}>
                {bizSearching ? "…" : "Find"}
              </button>
            </div>
            {errors.business_id && (
              <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">
                {errors.business_id}
              </p>
            )}

            {/* Business search results dropdown */}
            {bizSearched && bizResults.length === 0 && (
              <p style={{ fontSize: "0.75rem", color: "#e67e22" }} className="mt-1">
                No registered business found with that name. Check the spelling or{" "}
                <a href="/verify" style={{ color: "#1a2f5e", textDecoration: "underline" }}>
                  use the verify page
                </a>.
              </p>
            )}
            {bizResults.length > 0 && !selectedBiz && (
              <div className="mt-2 rounded-lg overflow-hidden"
                style={{ border: "1px solid #e0e4ed" }}>
                {bizResults.map((biz) => (
                  <button
                    key={biz.id}
                    type="button"
                    onClick={() => setSelectedBiz(biz)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
                    style={{ borderColor: "#f0f0f0" }}>
                    <div className="flex-1">
                      <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1a2f5e" }}>
                        {biz.business_name}
                      </p>
                      <p style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>
                        @{biz.business_handle} · {biz.county}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedBiz && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: "#e8eaf6", border: "1px solid #1a2f5e" }}>
                <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#1a2f5e" }} />
                <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1a2f5e", flex: 1 }}>
                  {selectedBiz.business_name} (@{selectedBiz.business_handle})
                </p>
                <button
                  type="button"
                  onClick={() => { setSelectedBiz(null); setBizSearched(false); }}
                  style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>
                  Change
                </button>
              </div>
            )}
          </div>

          {/* ── Fraud type ────────────────────────────────────────────── */}
          <div>
            <label className="block mb-1"
              style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
              Fraud Type *
            </label>
            <select
              name="report_type" value={form.report_type} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={{
                border: `1px solid ${errors.report_type ? "#e74c3c" : "#e0e4ed"}`,
                fontSize: "0.88rem", background: "#fff",
              }}>
              <option value="">Select type...</option>
              {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.report_type && (
              <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">
                {errors.report_type}
              </p>
            )}
          </div>

          {/* ── Description ───────────────────────────────────────────── */}
          <div>
            <label className="block mb-1"
              style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
              Description *{" "}
              <span style={{ color: "#9aa3b5", fontWeight: 400 }}>
                ({form.description.length}/1000)
              </span>
            </label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              rows={5} maxLength={1000}
              placeholder="Describe what happened in detail. Include dates, amounts, what was promised vs what was received…"
              className="w-full px-3 py-2 rounded-lg outline-none resize-none"
              style={{
                border: `1px solid ${errors.description ? "#e74c3c" : "#e0e4ed"}`,
                fontSize: "0.88rem",
              }}
            />
            {errors.description && (
              <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">
                {errors.description}
              </p>
            )}
          </div>

          {/* ── Amount + Location ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1"
                style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                Amount Lost (KES)
              </label>
              <input
                type="number" name="amount_lost" value={form.amount_lost}
                onChange={handleChange} placeholder="e.g., 5000" min="0"
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem" }}
              />
            </div>
            <div>
              <label className="block mb-1"
                style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                Your County *
              </label>
              <select
                name="location" value={form.location} onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{
                  border: `1px solid ${errors.location ? "#e74c3c" : "#e0e4ed"}`,
                  fontSize: "0.88rem", background: "#fff",
                }}>
                <option value="">Select county...</option>
                {COUNTIES.map((c) => <option key={c} value={`${c}, Kenya`}>{c}</option>)}
              </select>
              {errors.location && (
                <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">
                  {errors.location}
                </p>
              )}
            </div>
          </div>

          {/* ── Anonymous toggle ──────────────────────────────────────── */}
          <div className="rounded-lg p-4" style={{ background: "#f8f9fc", border: "1px solid #e0e4ed" }}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_anonymous"
                checked={form.is_anonymous}
                onChange={handleChange}
                className="mt-0.5 w-4 h-4 shrink-0"
                style={{ accentColor: "#1a2f5e" }}
              />
              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1a2f5e" }}>
                  Submit Anonymously
                </p>
                <p style={{ fontSize: "0.75rem", color: "#9aa3b5", marginTop: 2 }}>
                  Note: Anonymous reports may receive lower priority as they carry less weight
                  in our severity scoring.
                </p>
              </div>
            </label>
          </div>

          {/* ── Phone (hidden when anonymous) ─────────────────────────── */}
          {!form.is_anonymous && (
            <div>
              <label className="block mb-1"
                style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                Phone Number *
              </label>
              <input
                type="tel" name="reporter_phone" value={form.reporter_phone}
                onChange={handleChange} placeholder="e.g., 0712 345 678"
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{
                  border: `1px solid ${errors.reporter_phone ? "#e74c3c" : "#e0e4ed"}`,
                  fontSize: "0.88rem",
                }}
              />
              {errors.reporter_phone && (
                <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">
                  {errors.reporter_phone}
                </p>
              )}
              <p style={{ fontSize: "0.72rem", color: "#9aa3b5", marginTop: 4 }}>
                For follow-up only. Your number will never be published.
              </p>
            </div>
          )}

          <button
            type="submit" disabled={submitting}
            className="w-full py-3 rounded-lg font-bold text-white transition-colors"
            style={{
              background: submitting ? "#b8940f" : "#e74c3c",
              cursor: submitting ? "not-allowed" : "pointer",
            }}>
            {submitting ? "Submitting Report…" : "🚩 Submit Fraud Report"}
          </button>
        </div>
      </form>
    </div>
  );
}
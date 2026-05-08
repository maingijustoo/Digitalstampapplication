import { useState } from "react";
import { Flag, AlertTriangle, CheckCircle } from "lucide-react";
import { fraudReportApi } from "../../frontend_api/api";

interface ReportForm {
  business: string;
  report_type: string;
  severity: string;
  description: string;
  amount_lost: string;
  location: string;
  evidence_url: string;
  reporter_email: string;
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
    business: "", report_type: "", severity: "medium",
    description: "", amount_lost: "", location: "",
    evidence_url: "", reporter_email: "",
  });
  const [errors, setErrors]   = useState<Partial<ReportForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted]   = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: undefined }));
  };

  const validate = () => {
    const e: Partial<ReportForm> = {};
    if (!form.business.trim())    e.business     = "Required";
    if (!form.report_type)        e.report_type  = "Required";
    if (!form.description.trim() || form.description.length < 30)
                                  e.description  = "At least 30 characters required";
    if (!form.location)           e.location     = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await fraudReportApi.submit({
        business:       form.business.trim(),
        report_type:    form.report_type,
        severity:       form.severity,
        description:    form.description.trim(),
        amount_lost:    form.amount_lost ? parseFloat(form.amount_lost) : undefined,
        location:       form.location,
        evidence_url:   form.evidence_url.trim() || undefined,
        reporter_email: form.reporter_email.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="rounded-xl p-8 shadow-lg" style={{ background: "#fff", border: "2px solid #2ecc71" }}>
          <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#2ecc71" }} />
          <h1 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.4rem" }}>Report Submitted!</h1>
          <p className="mt-3" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            Thank you for helping protect other Kenyan consumers. Our team will review your report and take
            appropriate action.
          </p>
          <div className="mt-5 p-4 rounded-lg text-left" style={{ background: "#f8f9fc" }}>
            <p style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "0.85rem" }}>Business Reported: {form.business}</p>
            <p style={{ color: "#9aa3b5", fontSize: "0.8rem" }}>Type: {form.report_type}</p>
            <p style={{ color: "#9aa3b5", fontSize: "0.8rem" }}>Severity: {form.severity.toUpperCase()}</p>
          </div>
          <div className="flex gap-3 mt-6 justify-center">
            <a href="/" className="px-5 py-2 rounded-lg font-bold text-sm text-white" style={{ background: "#1a2f5e" }}>
              Back to Home
            </a>
            <button onClick={() => { setSubmitted(false); setForm({ business: "", report_type: "", severity: "medium", description: "", amount_lost: "", location: "", evidence_url: "", reporter_email: "" }); }}
              className="px-5 py-2 rounded-lg font-bold text-sm" style={{ background: "#f4f6fb", color: "#1a2f5e", border: "1px solid #e0e4ed" }}>
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
          All reports are anonymous by default.
        </p>
      </div>

      {/* Warning box */}
      <div className="flex gap-3 p-4 rounded-xl mb-6" style={{ background: "#fff3e0", border: "1px solid #e67e22" }}>
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#e67e22" }} />
        <p style={{ fontSize: "0.82rem", color: "#7d4e00" }}>
          <strong>Important:</strong> False reports are a violation of KCPP's Terms of Service. Only report
          businesses where you have genuine evidence of fraudulent activity.
        </p>
      </div>

      {submitError && (
        <div className="rounded-lg p-3 mb-4 text-sm" style={{ background: "#fce4ec", color: "#c0392b", border: "1px solid #e74c3c" }}>
          ⚠️ {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl shadow p-6 flex flex-col gap-5" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>

          {/* Business */}
          <div>
            <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
              Business Name / Handle *
            </label>
            <input name="business" value={form.business} onChange={handleChange}
              placeholder="e.g., @FakeShop254 or quickcash.co.ke"
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={{ border: `1px solid ${errors.business ? "#e74c3c" : "#e0e4ed"}`, fontSize: "0.88rem" }} />
            {errors.business && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.business}</p>}
          </div>

          {/* Type + Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                Fraud Type *
              </label>
              <select name="report_type" value={form.report_type} onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{ border: `1px solid ${errors.report_type ? "#e74c3c" : "#e0e4ed"}`, fontSize: "0.88rem", background: "#fff" }}>
                <option value="">Select type...</option>
                {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.report_type && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.report_type}</p>}
            </div>
            <div>
              <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                Severity
              </label>
              <select name="severity" value={form.severity} onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem", background: "#fff" }}>
                <option value="low">Low – Minor inconvenience</option>
                <option value="medium">Medium – Financial loss or fake goods</option>
                <option value="high">High – Significant money lost or identity theft</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
              Description * <span style={{ color: "#9aa3b5", fontWeight: 400 }}>({form.description.length}/1000)</span>
            </label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={5} maxLength={1000}
              placeholder="Describe what happened in detail. Include dates, amounts, what was promised vs what was received..."
              className="w-full px-3 py-2 rounded-lg outline-none resize-none"
              style={{ border: `1px solid ${errors.description ? "#e74c3c" : "#e0e4ed"}`, fontSize: "0.88rem" }} />
            {errors.description && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.description}</p>}
          </div>

          {/* Amount + Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                Amount Lost (KES)
              </label>
              <input type="number" name="amount_lost" value={form.amount_lost} onChange={handleChange}
                placeholder="e.g., 5000" min="0"
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem" }} />
            </div>
            <div>
              <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                Your County *
              </label>
              <select name="location" value={form.location} onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{ border: `1px solid ${errors.location ? "#e74c3c" : "#e0e4ed"}`, fontSize: "0.88rem", background: "#fff" }}>
                <option value="">Select county...</option>
                {COUNTIES.map((c) => <option key={c} value={`${c}, Kenya`}>{c}</option>)}
              </select>
              {errors.location && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.location}</p>}
            </div>
          </div>

          {/* Evidence + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                Evidence Link (optional)
              </label>
              <input name="evidence_url" value={form.evidence_url} onChange={handleChange}
                placeholder="Screenshot URL or social media link"
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem" }} />
            </div>
            <div>
              <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                Your Email (optional)
              </label>
              <input type="email" name="reporter_email" value={form.reporter_email} onChange={handleChange}
                placeholder="For follow-up only, never published"
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem" }} />
            </div>
          </div>

          <p style={{ fontSize: "0.75rem", color: "#9aa3b5" }}>
            * Your identity and email will never be published. Reports are anonymised before display.
          </p>

          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-lg font-bold text-white transition-colors"
            style={{ background: submitting ? "#b8940f" : "#e74c3c", cursor: submitting ? "not-allowed" : "pointer" }}>
            {submitting ? "Submitting Report…" : "🚩 Submit Fraud Report"}
          </button>
        </div>
      </form>
    </div>
  );
}

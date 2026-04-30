import { useState } from "react";
import { useSearchParams } from "react-router";
import { Flag, CheckCircle, AlertTriangle, Upload, Info } from "lucide-react";
import { businesses } from "../data/mockData";

interface FormData {
  businessName: string;
  businessHandle: string;
  fraudType: string;
  incidentDate: string;
  location: string;
  description: string;
  amountLost: string;
  currency: string;
  evidenceType: string;
  anonymous: boolean;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  consent: boolean;
}

export function ReportFraud() {
  const [searchParams] = useSearchParams();
  const prefillBusiness = searchParams.get("business") || "";

  const [form, setForm] = useState<FormData>({
    businessName: prefillBusiness,
    businessHandle: "",
    fraudType: "",
    incidentDate: "",
    location: "",
    description: "",
    amountLost: "",
    currency: "KES",
    evidenceType: "",
    anonymous: true,
    reporterName: "",
    reporterEmail: "",
    reporterPhone: "",
    consent: false,
  });
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const fraudTypes = [
    "Social Media Scam",
    "Non-Delivery of Goods",
    "Counterfeit Products",
    "Financial Fraud",
    "Identity Theft / Impersonation",
    "Tech Support Scam",
    "Investment Scam",
    "Romance Scam",
    "Phishing",
    "Other",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setForm((f) => ({ ...f, [target.name]: value }));
    setErrors((err) => ({ ...err, [target.name]: undefined }));
  };

  const validateStep1 = () => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.businessName.trim()) e.businessName = "Business name is required";
    if (!form.fraudType) e.fraudType = "Please select a fraud type";
    if (!form.incidentDate) e.incidentDate = "Incident date is required";
    if (!form.description.trim() || form.description.length < 30)
      e.description = "Please provide at least 30 characters of description";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.anonymous) {
      if (!form.reporterName.trim()) e.reporterName = "Name is required";
      if (!form.reporterEmail.trim()) e.reporterEmail = "Email is required";
    }
    if (!form.consent) e.consent = "You must agree to the terms";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div
          className="rounded-xl p-8 shadow-lg"
          style={{ background: "#fff", border: "2px solid #2ecc71" }}
        >
          <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#2ecc71" }} />
          <h1 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.4rem" }}>
            Report Submitted Successfully
          </h1>
          <p className="mt-3" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            Your fraud report has been submitted to KCPP for investigation. You will receive a case reference number via email (if provided).
          </p>
          <div
            className="mt-5 p-4 rounded-lg"
            style={{ background: "#f8f9fc" }}
          >
            <p style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "0.85rem" }}>
              Case Reference: KCPP-{new Date().getFullYear()}-{Math.floor(Math.random() * 90000 + 10000)}
            </p>
            <p className="mt-1" style={{ color: "#9aa3b5", fontSize: "0.8rem" }}>
              Status: Under Review | Estimated response: 3–5 business days
            </p>
          </div>
          <button
            onClick={() => { setSubmitted(false); setStep(1); setForm({ ...form, businessName: "", fraudType: "", description: "", amountLost: "", incidentDate: "" }); }}
            className="mt-6 px-6 py-3 rounded-lg"
            style={{ background: "#1a2f5e", color: "#fff", fontWeight: 700 }}
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Flag className="w-6 h-6" style={{ color: "#e74c3c" }} />
        <h1 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.4rem" }}>Report Fraud</h1>
      </div>
      <p className="mb-6" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
        Help protect other consumers by reporting suspicious or fraudulent businesses.
      </p>

      {/* Warning Banner */}
      <div
        className="flex gap-3 p-4 rounded-lg mb-6"
        style={{ background: "#fff3e0", border: "1px solid #e67e22" }}
      >
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#e67e22" }} />
        <p style={{ color: "#7a4f01", fontSize: "0.82rem" }}>
          <strong>Important:</strong> Only report verified fraudulent activity. False reports undermine the platform and may have legal consequences. All reports are reviewed by KCPP investigators.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-6">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: s <= step ? "#1a2f5e" : "#e0e4ed",
                color: s <= step ? "#fff" : "#9aa3b5",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              {s < step ? "✓" : s}
            </div>
            <span style={{ fontSize: "0.8rem", color: s <= step ? "#1a2f5e" : "#9aa3b5", fontWeight: s <= step ? 600 : 400 }}>
              {s === 1 ? "Incident Details" : "Your Details"}
            </span>
            {s < 2 && <div className="h-px w-8" style={{ background: step > 1 ? "#1a2f5e" : "#e0e4ed" }} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl shadow p-6" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                    Business Name *
                  </label>
                  <input
                    name="businessName"
                    value={form.businessName}
                    onChange={handleChange}
                    placeholder="e.g., ShopSmart"
                    className="w-full px-3 py-2 rounded-lg outline-none"
                    style={{
                      border: `1px solid ${errors.businessName ? "#e74c3c" : "#e0e4ed"}`,
                      fontSize: "0.88rem",
                      color: "#1a2f5e",
                    }}
                    list="business-list"
                  />
                  <datalist id="business-list">
                    {businesses.map((b) => <option key={b.id} value={b.name} />)}
                  </datalist>
                  {errors.businessName && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.businessName}</p>}
                </div>
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                    Business Handle / URL
                  </label>
                  <input
                    name="businessHandle"
                    value={form.businessHandle}
                    onChange={handleChange}
                    placeholder="@handle or website.co.ke"
                    className="w-full px-3 py-2 rounded-lg outline-none"
                    style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem", color: "#1a2f5e" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                    Type of Fraud *
                  </label>
                  <select
                    name="fraudType"
                    value={form.fraudType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg outline-none"
                    style={{ border: `1px solid ${errors.fraudType ? "#e74c3c" : "#e0e4ed"}`, fontSize: "0.88rem", color: "#1a2f5e", background: "#fff" }}
                  >
                    <option value="">Select fraud type...</option>
                    {fraudTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.fraudType && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.fraudType}</p>}
                </div>
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                    Date of Incident *
                  </label>
                  <input
                    type="date"
                    name="incidentDate"
                    value={form.incidentDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg outline-none"
                    style={{ border: `1px solid ${errors.incidentDate ? "#e74c3c" : "#e0e4ed"}`, fontSize: "0.88rem", color: "#1a2f5e" }}
                  />
                  {errors.incidentDate && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.incidentDate}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                    Location of Incident
                  </label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g., Nairobi, Kenya"
                    className="w-full px-3 py-2 rounded-lg outline-none"
                    style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem", color: "#1a2f5e" }}
                  />
                </div>
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                    Amount Lost (KES)
                  </label>
                  <div className="flex">
                    <span className="px-2 py-2 rounded-l-lg" style={{ background: "#f4f6fb", border: "1px solid #e0e4ed", borderRight: "none", fontSize: "0.82rem", color: "#6b7280" }}>
                      KES
                    </span>
                    <input
                      type="number"
                      name="amountLost"
                      value={form.amountLost}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-r-lg outline-none"
                      style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem", color: "#1a2f5e" }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                  Describe the Incident * <span style={{ color: "#9aa3b5", fontWeight: 400 }}>({form.description.length}/500)</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  placeholder="Describe in detail what happened — what was advertised, how payment was made, what was (not) delivered..."
                  className="w-full px-3 py-2 rounded-lg outline-none resize-none"
                  style={{ border: `1px solid ${errors.description ? "#e74c3c" : "#e0e4ed"}`, fontSize: "0.88rem", color: "#1a2f5e" }}
                />
                {errors.description && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                  Evidence Type (optional)
                </label>
                <select
                  name="evidenceType"
                  value={form.evidenceType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg outline-none"
                  style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem", color: "#1a2f5e", background: "#fff" }}
                >
                  <option value="">Select evidence type...</option>
                  {["Screenshots", "M-Pesa Transaction Records", "Chat Logs", "Email Correspondence", "Video Evidence", "Witness Statement"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <div
                  className="mt-2 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer"
                  style={{ borderColor: "#e0e4ed" }}
                >
                  <Upload className="w-6 h-6 mx-auto mb-1" style={{ color: "#9aa3b5" }} />
                  <p style={{ fontSize: "0.78rem", color: "#9aa3b5" }}>Drag & drop files here or click to upload (Max 10MB)</p>
                  <p style={{ fontSize: "0.7rem", color: "#bfc5d0" }}>Supported: PNG, JPG, PDF, MP4</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3 rounded-lg transition-colors"
                style={{ background: "#1a2f5e", color: "#fff", fontWeight: 700 }}
              >
                Continue to Step 2 →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    name="anonymous"
                    id="anonymous"
                    checked={form.anonymous}
                    onChange={handleChange}
                    className="rounded"
                    style={{ width: 18, height: 18 }}
                  />
                  <label htmlFor="anonymous" style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1a2f5e" }}>
                    Submit anonymously
                  </label>
                </div>
                <div
                  className="flex gap-2 p-3 rounded-lg"
                  style={{ background: "#e3f2fd", border: "1px solid #90caf9" }}
                >
                  <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#1565c0" }} />
                  <p style={{ fontSize: "0.78rem", color: "#1565c0" }}>
                    Anonymous reports are published without personal details. Providing your contact info helps KCPP investigators follow up for more evidence.
                  </p>
                </div>
              </div>

              {!form.anonymous && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                      Full Name *
                    </label>
                    <input
                      name="reporterName"
                      value={form.reporterName}
                      onChange={handleChange}
                      placeholder="John Kamau"
                      className="w-full px-3 py-2 rounded-lg outline-none"
                      style={{ border: `1px solid ${errors.reporterName ? "#e74c3c" : "#e0e4ed"}`, fontSize: "0.88rem", color: "#1a2f5e" }}
                    />
                    {errors.reporterName && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.reporterName}</p>}
                  </div>
                  <div>
                    <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="reporterEmail"
                      value={form.reporterEmail}
                      onChange={handleChange}
                      placeholder="john@email.com"
                      className="w-full px-3 py-2 rounded-lg outline-none"
                      style={{ border: `1px solid ${errors.reporterEmail ? "#e74c3c" : "#e0e4ed"}`, fontSize: "0.88rem", color: "#1a2f5e" }}
                    />
                    {errors.reporterEmail && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.reporterEmail}</p>}
                  </div>
                  <div>
                    <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                      Phone Number (optional)
                    </label>
                    <input
                      name="reporterPhone"
                      value={form.reporterPhone}
                      onChange={handleChange}
                      placeholder="+254 7XX XXX XXX"
                      className="w-full px-3 py-2 rounded-lg outline-none"
                      style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem", color: "#1a2f5e" }}
                    />
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="rounded-lg p-4" style={{ background: "#f8f9fc", border: "1px solid #e0e4ed" }}>
                <h3 style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "0.85rem", marginBottom: 8 }}>Report Summary</h3>
                <div className="flex flex-col gap-1">
                  {[
                    ["Business", form.businessName],
                    ["Fraud Type", form.fraudType],
                    ["Date", form.incidentDate],
                    ["Location", form.location || "Not specified"],
                    ["Amount Lost", form.amountLost ? `KES ${parseInt(form.amountLost).toLocaleString()}` : "Not specified"],
                    ["Submission", form.anonymous ? "Anonymous" : form.reporterName],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span style={{ fontSize: "0.78rem", color: "#9aa3b5", minWidth: 100 }}>{k}:</span>
                      <span style={{ fontSize: "0.78rem", color: "#1a2f5e", fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="consent"
                  id="consent"
                  checked={form.consent}
                  onChange={handleChange}
                  style={{ width: 18, height: 18, marginTop: 2 }}
                />
                <label htmlFor="consent" style={{ fontSize: "0.8rem", color: "#4b5563" }}>
                  I confirm that the information provided is accurate to the best of my knowledge. I understand that submitting false reports may be subject to legal action. *
                </label>
              </div>
              {errors.consent && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }}>{errors.consent}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-lg transition-colors"
                  style={{ background: "#f4f6fb", color: "#1a2f5e", fontWeight: 700, border: "1px solid #e0e4ed" }}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-lg transition-colors"
                  style={{ background: "#e74c3c", color: "#fff", fontWeight: 700 }}
                >
                  Submit Fraud Report
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

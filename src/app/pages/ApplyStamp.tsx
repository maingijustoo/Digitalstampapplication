import { useState } from "react";
import { Shield, CheckCircle, FileText, Clock, Award, ChevronRight } from "lucide-react";
import { TrustBadge } from "../components/TrustBadge";

interface AppForm {
  businessName: string;
  businessHandle: string;
  website: string;
  category: string;
  yearEstablished: string;
  regNumber: string;
  location: string;
  county: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  mpesaPaybill: string;
  hasPhysicalAddress: boolean;
  agreedToTerms: boolean;
  agreedToAudit: boolean;
}

const steps = [
  { label: "Business Info", icon: FileText },
  { label: "Contact Details", icon: "👤" },
  { label: "Review & Submit", icon: Award },
];

export function ApplyStamp() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<AppForm>({
    businessName: "",
    businessHandle: "",
    website: "",
    category: "",
    yearEstablished: "",
    regNumber: "",
    location: "",
    county: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    description: "",
    mpesaPaybill: "",
    hasPhysicalAddress: false,
    agreedToTerms: false,
    agreedToAudit: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AppForm, string>>>({});

  const categories = [
    "Fashion & Retail", "E-Commerce", "Food & Grocery", "Technology",
    "Fintech / Mobile Money", "Travel & Tourism", "Health & Wellness",
    "Education", "Consumer Services", "Real Estate", "Automotive", "Other"
  ];

  const counties = [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Machakos",
    "Nyeri", "Meru", "Kakamega", "Kilifi", "Garissa", "Other"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setForm((f) => ({ ...f, [target.name]: value }));
    setErrors((err) => ({ ...err, [target.name]: undefined }));
  };

  const validateStep0 = () => {
    const e: Partial<Record<keyof AppForm, string>> = {};
    if (!form.businessName.trim()) e.businessName = "Required";
    if (!form.category) e.category = "Required";
    if (!form.yearEstablished) e.yearEstablished = "Required";
    if (!form.county) e.county = "Required";
    if (!form.description.trim() || form.description.length < 50) e.description = "At least 50 characters required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = () => {
    const e: Partial<Record<keyof AppForm, string>> = {};
    if (!form.contactName.trim()) e.contactName = "Required";
    if (!form.contactEmail.trim()) e.contactEmail = "Required";
    if (!form.contactPhone.trim()) e.contactPhone = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Partial<Record<keyof AppForm, string>> = {};
    if (!form.agreedToTerms) e.agreedToTerms = "You must agree to the terms";
    if (!form.agreedToAudit) e.agreedToAudit = "You must agree to the audit process";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && validateStep0()) setStep(1);
    else if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="rounded-xl p-8 shadow-lg" style={{ background: "#fff", border: "2px solid #2ecc71" }}>
          <TrustBadge type="pending" size="lg" showLabel={true} />
          <h1 className="mt-5" style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.4rem" }}>
            Application Submitted!
          </h1>
          <p className="mt-3" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            Your application for a KCPP Digital Trust Stamp has been received. Our team will review your submission within 5–10 business days.
          </p>
          <div className="mt-5 p-4 rounded-lg text-left" style={{ background: "#f8f9fc" }}>
            <p style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "0.85rem" }}>
              Application Reference: KCPP-APP-{new Date().getFullYear()}-{Math.floor(Math.random() * 90000 + 10000)}
            </p>
            <p className="mt-1" style={{ color: "#9aa3b5", fontSize: "0.8rem" }}>Business: {form.businessName}</p>
            <p style={{ color: "#9aa3b5", fontSize: "0.8rem" }}>Status: Pending Review</p>
          </div>

          <div className="mt-5 text-left">
            <h3 style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "0.9rem", marginBottom: 8 }}>What happens next?</h3>
            {[
              "KCPP reviews your business documentation",
              "Background check and fraud database search",
              "Possible audit of your operations",
              "Digital stamp issued upon successful verification",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#1a2f5e" }}>
                  <span style={{ color: "#fff", fontSize: "0.65rem", fontWeight: 700 }}>{i + 1}</span>
                </div>
                <span style={{ fontSize: "0.82rem", color: "#4b5563" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <TrustBadge type="verified" size="lg" showLabel={true} />
        </div>
        <h1 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.6rem" }}>
          Apply for KCPP Digital Trust Stamp
        </h1>
        <p className="mt-2 max-w-lg mx-auto" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
          Get your business verified by KCPP to build consumer trust, increase credibility, and protect your brand from fraud allegations.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { icon: "🛡️", label: "Fraud Protection" },
          { icon: "✅", label: "Consumer Trust" },
          { icon: "📈", label: "Brand Credibility" },
          { icon: "🔍", label: "Due Diligence" },
        ].map((b) => (
          <div key={b.label} className="flex flex-col items-center p-3 rounded-lg text-center" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
            <span className="text-2xl">{b.icon}</span>
            <p className="mt-1" style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1a2f5e" }}>{b.label}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-0 mb-6">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: i < step ? "#2ecc71" : i === step ? "#1a2f5e" : "#e0e4ed",
                  color: i <= step ? "#fff" : "#9aa3b5",
                  fontWeight: 700,
                }}
              >
                {i < step ? <CheckCircle className="w-5 h-5" /> : <span>{i + 1}</span>}
              </div>
              <span style={{ fontSize: "0.68rem", color: i === step ? "#1a2f5e" : "#9aa3b5", fontWeight: i === step ? 700 : 400, marginTop: 4 }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="h-px w-12 mx-1 mb-4" style={{ background: i < step ? "#2ecc71" : "#e0e4ed" }} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl shadow p-6" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
          {/* Step 0: Business Info */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <h2 style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "1rem" }}>Business Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>Business Name *</label>
                  <input name="businessName" value={form.businessName} onChange={handleChange} placeholder="Your Business Name" className="w-full px-3 py-2 rounded-lg outline-none" style={{ border: `1px solid ${errors.businessName ? "#e74c3c" : "#e0e4ed"}`, fontSize: "0.88rem" }} />
                  {errors.businessName && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.businessName}</p>}
                </div>
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>Social Media Handle</label>
                  <input name="businessHandle" value={form.businessHandle} onChange={handleChange} placeholder="@YourHandle" className="w-full px-3 py-2 rounded-lg outline-none" style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem" }} />
                </div>
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>Website (if any)</label>
                  <input name="website" value={form.website} onChange={handleChange} placeholder="yoursite.co.ke" className="w-full px-3 py-2 rounded-lg outline-none" style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem" }} />
                </div>
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>Business Category *</label>
                  <select name="category" value={form.category} onChange={handleChange} className="w-full px-3 py-2 rounded-lg outline-none" style={{ border: `1px solid ${errors.category ? "#e74c3c" : "#e0e4ed"}`, fontSize: "0.88rem", background: "#fff" }}>
                    <option value="">Select category...</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.category}</p>}
                </div>
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>Year Established *</label>
                  <input type="number" name="yearEstablished" value={form.yearEstablished} onChange={handleChange} placeholder="e.g., 2019" min="1900" max="2026" className="w-full px-3 py-2 rounded-lg outline-none" style={{ border: `1px solid ${errors.yearEstablished ? "#e74c3c" : "#e0e4ed"}`, fontSize: "0.88rem" }} />
                  {errors.yearEstablished && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.yearEstablished}</p>}
                </div>
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>Business Reg. Number</label>
                  <input name="regNumber" value={form.regNumber} onChange={handleChange} placeholder="e.g., CPR/2019/XXXXXX" className="w-full px-3 py-2 rounded-lg outline-none" style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem" }} />
                </div>
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>County / Region *</label>
                  <select name="county" value={form.county} onChange={handleChange} className="w-full px-3 py-2 rounded-lg outline-none" style={{ border: `1px solid ${errors.county ? "#e74c3c" : "#e0e4ed"}`, fontSize: "0.88rem", background: "#fff" }}>
                    <option value="">Select county...</option>
                    {counties.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.county && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.county}</p>}
                </div>
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>M-Pesa Paybill / Till</label>
                  <input name="mpesaPaybill" value={form.mpesaPaybill} onChange={handleChange} placeholder="e.g., 123456" className="w-full px-3 py-2 rounded-lg outline-none" style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem" }} />
                </div>
              </div>
              <div>
                <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                  Business Description * <span style={{ color: "#9aa3b5", fontWeight: 400 }}>({form.description.length}/400)</span>
                </label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4} maxLength={400} placeholder="Describe your business, what products/services you offer, your target market, and why you're applying for KCPP verification..." className="w-full px-3 py-2 rounded-lg outline-none resize-none" style={{ border: `1px solid ${errors.description ? "#e74c3c" : "#e0e4ed"}`, fontSize: "0.88rem" }} />
                {errors.description && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="hasPhysicalAddress" id="hasPhysicalAddress" checked={form.hasPhysicalAddress} onChange={handleChange} style={{ width: 18, height: 18 }} />
                <label htmlFor="hasPhysicalAddress" style={{ fontSize: "0.82rem", color: "#4b5563" }}>
                  My business has a physical address / shop
                </label>
              </div>
            </div>
          )}

          {/* Step 1: Contact Details */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h2 style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "1rem" }}>Contact Person Details</h2>
              <p style={{ color: "#6b7280", fontSize: "0.82rem" }}>This information will only be used for verification communication. It will not be publicly displayed.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>Full Name *</label>
                  <input name="contactName" value={form.contactName} onChange={handleChange} placeholder="Jane Wanjiru" className="w-full px-3 py-2 rounded-lg outline-none" style={{ border: `1px solid ${errors.contactName ? "#e74c3c" : "#e0e4ed"}`, fontSize: "0.88rem" }} />
                  {errors.contactName && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.contactName}</p>}
                </div>
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>Email Address *</label>
                  <input type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange} placeholder="jane@yourbusiness.co.ke" className="w-full px-3 py-2 rounded-lg outline-none" style={{ border: `1px solid ${errors.contactEmail ? "#e74c3c" : "#e0e4ed"}`, fontSize: "0.88rem" }} />
                  {errors.contactEmail && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.contactEmail}</p>}
                </div>
                <div>
                  <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>Phone Number *</label>
                  <input name="contactPhone" value={form.contactPhone} onChange={handleChange} placeholder="+254 7XX XXX XXX" className="w-full px-3 py-2 rounded-lg outline-none" style={{ border: `1px solid ${errors.contactPhone ? "#e74c3c" : "#e0e4ed"}`, fontSize: "0.88rem" }} />
                  {errors.contactPhone && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }} className="mt-1">{errors.contactPhone}</p>}
                </div>
              </div>

              <div className="p-4 rounded-lg" style={{ background: "#e8f5e9", border: "1px solid #2ecc71" }}>
                <h3 style={{ color: "#1a4d2e", fontWeight: 700, fontSize: "0.85rem", marginBottom: 6 }}>Verification Fee</h3>
                <p style={{ color: "#1a4d2e", fontSize: "0.82rem" }}>
                  The KCPP Digital Stamp annual verification fee is <strong>KES 5,000</strong> for SMEs and <strong>KES 15,000</strong> for enterprises. Payment instructions will be sent to your email upon application approval.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Review & Submit */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h2 style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "1rem" }}>Review Your Application</h2>

              <div className="rounded-lg p-4" style={{ background: "#f8f9fc", border: "1px solid #e0e4ed" }}>
                <h3 style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "0.85rem", marginBottom: 10 }}>Application Summary</h3>
                {[
                  ["Business Name", form.businessName],
                  ["Handle", form.businessHandle || "Not provided"],
                  ["Category", form.category],
                  ["Year Established", form.yearEstablished],
                  ["County", form.county],
                  ["Contact Name", form.contactName],
                  ["Contact Email", form.contactEmail],
                  ["Contact Phone", form.contactPhone],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2 mb-1">
                    <span style={{ fontSize: "0.78rem", color: "#9aa3b5", minWidth: 130 }}>{k}:</span>
                    <span style={{ fontSize: "0.78rem", color: "#1a2f5e", fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2">
                <input type="checkbox" name="agreedToTerms" id="agreedToTerms" checked={form.agreedToTerms} onChange={handleChange} style={{ width: 18, height: 18, marginTop: 2 }} />
                <label htmlFor="agreedToTerms" style={{ fontSize: "0.8rem", color: "#4b5563" }}>
                  I agree to KCPP's Terms of Service and Privacy Policy. I confirm all information provided is accurate and I am authorized to represent this business. *
                </label>
              </div>
              {errors.agreedToTerms && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }}>{errors.agreedToTerms}</p>}

              <div className="flex items-start gap-2">
                <input type="checkbox" name="agreedToAudit" id="agreedToAudit" checked={form.agreedToAudit} onChange={handleChange} style={{ width: 18, height: 18, marginTop: 2 }} />
                <label htmlFor="agreedToAudit" style={{ fontSize: "0.8rem", color: "#4b5563" }}>
                  I agree to cooperate with KCPP's verification audit process, which may include providing additional documentation, business registration proof, and/or site visits. *
                </label>
              </div>
              {errors.agreedToAudit && <p style={{ color: "#e74c3c", fontSize: "0.72rem" }}>{errors.agreedToAudit}</p>}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-lg" style={{ background: "#f4f6fb", color: "#1a2f5e", fontWeight: 700, border: "1px solid #e0e4ed" }}>
                ← Back
              </button>
            )}
            {step < 2 ? (
              <button type="button" onClick={handleNext} className="flex-1 py-3 rounded-lg" style={{ background: "#1a2f5e", color: "#fff", fontWeight: 700 }}>
                Continue →
              </button>
            ) : (
              <button type="submit" className="flex-1 py-3 rounded-lg" style={{ background: "#d4a017", color: "#fff", fontWeight: 700 }}>
                Submit Application
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

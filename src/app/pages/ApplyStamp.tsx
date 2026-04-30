import { useState, useRef, useCallback } from "react";
import {
  CheckCircle,
  FileText,
  Globe,
  MapPin,
  Instagram,
  Plus,
  Trash2,
  Building2,
  User,
  Hash,
  ChevronRight,
  Layers,
  UploadCloud,
  FileCheck2,
  X,
  AlertCircle,
} from "lucide-react";
import { TrustBadge } from "../components/TrustBadge";

type LocationType = "online" | "physical" | "both" | "";

interface UploadedFile {
  file: File;
  preview?: string;
}

interface AppForm {
  businessName: string;
  ownerName: string;
  govtCertNumber: string;
  govtCertFile: UploadedFile | null;
  category: string;
  yearEstablished: string;
  // Location & Presence
  locationType: LocationType;
  instaPages: string[];
  websiteUrl: string;
  county: string;
  physicalAddress: string;
  // Contact
  contactEmail: string;
  contactPhone: string;
  description: string;
  // Agreements
  agreedToTerms: boolean;
  agreedToAudit: boolean;
}

const steps = [
  { label: "Business Details", icon: FileText },
  { label: "Location & Presence", icon: MapPin },
  { label: "Contact & Review", icon: User },
];

const CATEGORIES = [
  "Fashion & Retail",
  "E-Commerce",
  "Food & Grocery",
  "Technology",
  "Fintech / Mobile Money",
  "Travel & Tourism",
  "Health & Wellness",
  "Education",
  "Consumer Services",
  "Real Estate",
  "Automotive",
  "Other",
];

const COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret",
  "Thika", "Machakos", "Nyeri", "Meru", "Kakamega",
  "Kilifi", "Garissa", "Kisii", "Kitui", "Bungoma", "Other",
];

const LOCATION_OPTIONS: { value: LocationType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: "online",
    label: "Online Only",
    desc: "Business operates fully online (social media, website)",
    icon: <Globe className="w-5 h-5" />,
  },
  {
    value: "physical",
    label: "Physical Location",
    desc: "Business has a physical shop / office",
    icon: <MapPin className="w-5 h-5" />,
  },
  {
    value: "both",
    label: "Online & Physical",
    desc: "Business has both an online presence and a physical location",
    icon: <Layers className="w-5 h-5" />,
  },
];

const inputClass = (hasError?: boolean) =>
  `w-full px-3 py-2.5 rounded-lg outline-none text-sm transition-colors focus:ring-2 focus:ring-blue-100` +
  (hasError
    ? " border border-red-400 bg-red-50"
    : " border border-gray-200 bg-white focus:border-[#1a2f5e]");

export function ApplyStamp() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<AppForm>({
    businessName: "",
    ownerName: "",
    govtCertNumber: "",
    govtCertFile: null,
    category: "",
    yearEstablished: "",
    locationType: "",
    instaPages: [""],
    websiteUrl: "",
    county: "",
    physicalAddress: "",
    contactEmail: "",
    contactPhone: "",
    description: "",
    agreedToTerms: false,
    agreedToAudit: false,
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  // File upload handling
  const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
  const MAX_SIZE_MB = 5;

  const handleFileSelect = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrors((e) => ({ ...e, govtCertFile: "Only PDF, JPG, or PNG files are accepted" }));
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrors((e) => ({ ...e, govtCertFile: `File must be under ${MAX_SIZE_MB}MB` }));
      return;
    }
    const isImage = file.type.startsWith("image/");
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm((f) => ({ ...f, govtCertFile: { file, preview: ev.target?.result as string } }));
      };
      reader.readAsDataURL(file);
    } else {
      setForm((f) => ({ ...f, govtCertFile: { file } }));
    }
    setErrors((e) => ({ ...e, govtCertFile: undefined }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isOnline = form.locationType === "online" || form.locationType === "both";
  const isPhysical = form.locationType === "physical" || form.locationType === "both";

  const set = (field: keyof AppForm, value: unknown) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  // Instagram dynamic list
  const addInstaPage = () => set("instaPages", [...form.instaPages, ""]);
  const removeInstaPage = (i: number) =>
    set("instaPages", form.instaPages.filter((_, idx) => idx !== i));
  const updateInstaPage = (i: number, val: string) => {
    const updated = [...form.instaPages];
    updated[i] = val;
    set("instaPages", updated);
    setErrors((e) => ({ ...e, instaPages: undefined }));
  };

  // Validators
  const validateStep0 = () => {
    const e: Record<string, string> = {};
    if (!form.businessName.trim()) e.businessName = "Business name is required";
    if (!form.ownerName.trim()) e.ownerName = "Owner name is required";
    if (!form.govtCertNumber.trim()) e.govtCertNumber = "Government certificate number is required";
    if (!form.category) e.category = "Please select a category";
    if (!form.yearEstablished) e.yearEstablished = "Year established is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.locationType) e.locationType = "Please select a location type";
    if (isOnline) {
      const filled = form.instaPages.filter((p) => p.trim());
      if (filled.length === 0) e.instaPages = "Add at least one Instagram page";
    }
    if (isPhysical) {
      if (!form.county) e.county = "Please select a county";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form.contactEmail.trim() || !/\S+@\S+\.\S+/.test(form.contactEmail))
      e.contactEmail = "Valid email is required";
    if (!form.contactPhone.trim()) e.contactPhone = "Phone number is required";
    if (!form.description.trim() || form.description.length < 40)
      e.description = "Please provide at least 40 characters";
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

  const refCode = `KCPP-APP-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`;

  // ─── Success Screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="rounded-2xl p-8 shadow-lg" style={{ background: "#fff", border: "2px solid #2ecc71" }}>
          <div className="flex justify-center">
            <TrustBadge type="pending" size="lg" showLabel={true} />
          </div>
          <h1 className="mt-5" style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.4rem" }}>
            Application Submitted!
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#6b7280" }}>
            Your KCPP Digital Trust Stamp application is under review. Our team will reach out within 5–10 business days.
          </p>

          <div className="mt-5 p-4 rounded-xl text-left" style={{ background: "#f8f9fc" }}>
            <p className="text-xs font-bold mb-2" style={{ color: "#1a2f5e" }}>Application Summary</p>
            {[
              ["Reference", refCode],
              ["Business", form.businessName],
              ["Owner", form.ownerName],
              ["Cert. Number", form.govtCertNumber],
              ["Location", LOCATION_OPTIONS.find((o) => o.value === form.locationType)?.label ?? ""],
              ["Status", "Pending Review"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2 mb-1">
                <span className="text-xs" style={{ color: "#9aa3b5", minWidth: 110 }}>{k}:</span>
                <span className="text-xs font-semibold" style={{ color: "#1a2f5e" }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 text-left">
            <p className="text-xs font-bold mb-3" style={{ color: "#1a2f5e" }}>What happens next?</p>
            {[
              "KCPP reviews your business documentation",
              "Background check & fraud database search",
              "Possible audit or site visit",
              "Digital stamp issued upon successful verification",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#1a2f5e" }}>
                  <span style={{ color: "#fff", fontSize: "0.62rem", fontWeight: 700 }}>{i + 1}</span>
                </div>
                <span className="text-xs" style={{ color: "#4b5563" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Form ─────────────────────────────────────────────────────────────
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
        <p className="mt-2 max-w-lg mx-auto text-sm" style={{ color: "#6b7280" }}>
          Get your business verified by KCPP to build consumer trust, increase credibility,
          and protect your brand from fraud allegations.
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
          <div key={b.label} className="flex flex-col items-center p-3 rounded-xl text-center" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
            <span className="text-2xl">{b.icon}</span>
            <p className="mt-1 text-xs font-semibold" style={{ color: "#1a2f5e" }}>{b.label}</p>
          </div>
        ))}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-0 mb-7">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: i < step ? "#2ecc71" : i === step ? "#1a2f5e" : "#e0e4ed",
                  color: i <= step ? "#fff" : "#9aa3b5",
                  fontWeight: 700,
                }}
              >
                {i < step ? <CheckCircle className="w-5 h-5" /> : <span className="text-sm">{i + 1}</span>}
              </div>
              <span
                className="mt-1 text-center"
                style={{
                  fontSize: "0.65rem",
                  color: i === step ? "#1a2f5e" : "#9aa3b5",
                  fontWeight: i === step ? 700 : 400,
                  maxWidth: 72,
                }}
              >
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
        <div className="rounded-2xl shadow-sm p-6 sm:p-8" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>

          {/* ── Step 0: Business Details ─────────────────────────────────── */}
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-bold" style={{ color: "#1a2f5e" }}>Business Details</h2>
                <p className="text-xs mt-0.5" style={{ color: "#9aa3b5" }}>
                  Provide your official business information as it appears on government records.
                </p>
              </div>

              {/* Business Name */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold" style={{ color: "#1a2f5e" }}>
                  <Building2 className="inline w-3.5 h-3.5 mr-1 mb-0.5" />
                  Business Name *
                </label>
                <input
                  value={form.businessName}
                  onChange={(e) => set("businessName", e.target.value)}
                  placeholder="e.g. Zawadi Fashions Ltd"
                  className={inputClass(!!errors.businessName)}
                />
                {errors.businessName && <p className="mt-1 text-xs text-red-500">{errors.businessName}</p>}
              </div>

              {/* Owner Name */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold" style={{ color: "#1a2f5e" }}>
                  <User className="inline w-3.5 h-3.5 mr-1 mb-0.5" />
                  Business Owner Name *
                </label>
                <input
                  value={form.ownerName}
                  onChange={(e) => set("ownerName", e.target.value)}
                  placeholder="e.g. Jane Wanjiru Mwangi"
                  className={inputClass(!!errors.ownerName)}
                />
                {errors.ownerName && <p className="mt-1 text-xs text-red-500">{errors.ownerName}</p>}
              </div>

              {/* Govt Certificate Number */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold" style={{ color: "#1a2f5e" }}>
                  <Hash className="inline w-3.5 h-3.5 mr-1 mb-0.5" />
                  Government Certificate / Business Registration Number *
                </label>
                <input
                  value={form.govtCertNumber}
                  onChange={(e) => set("govtCertNumber", e.target.value)}
                  placeholder="e.g. CPR/2019/XXXXXX or PVT-XXXXXX"
                  className={inputClass(!!errors.govtCertNumber)}
                />
                <p className="mt-1 text-xs" style={{ color: "#9aa3b5" }}>
                  This is the registration number issued by the Registrar of Companies or relevant government body.
                </p>
                {errors.govtCertNumber && <p className="mt-1 text-xs text-red-500">{errors.govtCertNumber}</p>}
              </div>

              {/* Document Upload */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold" style={{ color: "#1a2f5e" }}>
                  <FileCheck2 className="inline w-3.5 h-3.5 mr-1 mb-0.5" />
                  Upload Certificate Document <span style={{ color: "#9aa3b5", fontWeight: 400 }}>(optional but recommended)</span>
                </label>
                <p className="mb-2 text-xs" style={{ color: "#9aa3b5" }}>
                  Upload a scan or photo of your official government certificate. Accepted: PDF, JPG, PNG · Max 5MB
                </p>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                    e.target.value = "";
                  }}
                />

                {!form.govtCertFile ? (
                  /* Drop zone */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className="flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-xl cursor-pointer transition-all"
                    style={{
                      border: `2px dashed ${dragOver ? "#1a2f5e" : errors.govtCertFile ? "#f87171" : "#c8d0e7"}`,
                      background: dragOver ? "#f0f3ff" : "#fafbfd",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: dragOver ? "#1a2f5e" : "#e8ecf5" }}
                    >
                      <UploadCloud className="w-6 h-6" style={{ color: dragOver ? "#fff" : "#6b7280" }} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold" style={{ color: "#1a2f5e" }}>
                        {dragOver ? "Drop your file here" : "Drag & drop or click to upload"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#9aa3b5" }}>
                        Government registration certificate, business permit, or similar
                      </p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {["PDF", "JPG", "PNG"].map((ext) => (
                        <span
                          key={ext}
                          className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{ background: "#e8ecf5", color: "#4b5563" }}
                        >
                          {ext}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Uploaded file preview */
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: "1px solid #e0e4ed", background: "#f8f9fc" }}
                  >
                    {/* Image preview */}
                    {form.govtCertFile.preview && (
                      <div className="relative w-full" style={{ maxHeight: 200, overflow: "hidden" }}>
                        <img
                          src={form.govtCertFile.preview}
                          alt="Certificate preview"
                          className="w-full object-cover"
                          style={{ maxHeight: 200 }}
                        />
                        <div
                          className="absolute inset-0"
                          style={{ background: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.3))" }}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3">
                      {/* File type icon */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: form.govtCertFile.file.type === "application/pdf" ? "#fee2e2" : "#dbeafe",
                        }}
                      >
                        {form.govtCertFile.file.type === "application/pdf" ? (
                          <FileText className="w-5 h-5" style={{ color: "#ef4444" }} />
                        ) : (
                          <FileCheck2 className="w-5 h-5" style={{ color: "#3b82f6" }} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "#1a2f5e" }}>
                          {form.govtCertFile.file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs" style={{ color: "#9aa3b5" }}>
                            {formatBytes(form.govtCertFile.file.size)}
                          </span>
                          <span
                            className="flex items-center gap-1 text-xs font-semibold"
                            style={{ color: "#2ecc71" }}
                          >
                            <CheckCircle className="w-3 h-3" /> Uploaded
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
                          style={{ background: "#e8ecf5", color: "#1a2f5e" }}
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => set("govtCertFile", null)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
                          style={{ border: "1px solid #fca5a5" }}
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {errors.govtCertFile && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <p className="text-xs text-red-500">{errors.govtCertFile}</p>
                  </div>
                )}
              </div>

              {/* Category + Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-xs font-semibold" style={{ color: "#1a2f5e" }}>
                    Business Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className={inputClass(!!errors.category)}
                    style={{ background: "#fff" }}
                  >
                    <option value="">Select category…</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-semibold" style={{ color: "#1a2f5e" }}>
                    Year Established *
                  </label>
                  <input
                    type="number"
                    value={form.yearEstablished}
                    onChange={(e) => set("yearEstablished", e.target.value)}
                    placeholder="e.g. 2019"
                    min="1900"
                    max="2026"
                    className={inputClass(!!errors.yearEstablished)}
                  />
                  {errors.yearEstablished && <p className="mt-1 text-xs text-red-500">{errors.yearEstablished}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Location & Online Presence ───────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-bold" style={{ color: "#1a2f5e" }}>Location & Business Presence</h2>
                <p className="text-xs mt-0.5" style={{ color: "#9aa3b5" }}>
                  Tell us where your business operates — online, physically, or both.
                </p>
              </div>

              {/* Location Type Selector */}
              <div>
                <label className="block mb-2 text-xs font-semibold" style={{ color: "#1a2f5e" }}>
                  How does your business operate? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {LOCATION_OPTIONS.map((opt) => {
                    const active = form.locationType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set("locationType", opt.value)}
                        className="flex flex-col items-center text-center p-4 rounded-xl transition-all"
                        style={{
                          border: active ? "2px solid #1a2f5e" : "2px solid #e0e4ed",
                          background: active ? "#f0f3ff" : "#fafbfd",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                          style={{ background: active ? "#1a2f5e" : "#e0e4ed", color: active ? "#fff" : "#9aa3b5" }}
                        >
                          {opt.icon}
                        </div>
                        <p className="text-xs font-bold" style={{ color: active ? "#1a2f5e" : "#4b5563" }}>{opt.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#9aa3b5", fontSize: "0.67rem" }}>{opt.desc}</p>
                        {active && <CheckCircle className="w-4 h-4 mt-1.5" style={{ color: "#2ecc71" }} />}
                      </button>
                    );
                  })}
                </div>
                {errors.locationType && <p className="mt-1 text-xs text-red-500">{errors.locationType}</p>}
              </div>

              {/* Online fields */}
              {isOnline && (
                <div className="rounded-xl p-4 flex flex-col gap-4" style={{ background: "#f8f9fc", border: "1px solid #e0e4ed" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#e1306c" }}>
                      <Instagram className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-xs font-bold" style={{ color: "#1a2f5e" }}>Instagram Page(s) *</p>
                  </div>

                  {form.instaPages.map((page, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ border: `1px solid ${errors.instaPages ? "#f87171" : "#e0e4ed"}`, background: "#fff" }}>
                        <span className="text-sm" style={{ color: "#9aa3b5" }}>@</span>
                        <input
                          type="text"
                          value={page}
                          onChange={(e) => updateInstaPage(i, e.target.value)}
                          placeholder={`Instagram handle ${i + 1}`}
                          className="flex-1 outline-none text-sm"
                          style={{ color: "#1a2f5e" }}
                        />
                      </div>
                      {form.instaPages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInstaPage(i)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                          style={{ border: "1px solid #fca5a5" }}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                  {errors.instaPages && <p className="text-xs text-red-500">{errors.instaPages}</p>}

                  <button
                    type="button"
                    onClick={addInstaPage}
                    className="flex items-center gap-1.5 text-xs font-semibold self-start px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: "#e8f5e9", color: "#1a4d2e", border: "1px solid #2ecc71" }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Page
                  </button>

                  {/* Website */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#1a2f5e" }}>
                        <Globe className="w-3.5 h-3.5 text-white" />
                      </div>
                      <p className="text-xs font-bold" style={{ color: "#1a2f5e" }}>Website URL <span style={{ color: "#9aa3b5", fontWeight: 400 }}>(optional)</span></p>
                    </div>
                    <input
                      value={form.websiteUrl}
                      onChange={(e) => set("websiteUrl", e.target.value)}
                      placeholder="https://yourbusiness.co.ke"
                      className={inputClass(false)}
                    />
                  </div>
                </div>
              )}

              {/* Physical fields */}
              {isPhysical && (
                <div className="rounded-xl p-4 flex flex-col gap-4" style={{ background: "#f8f9fc", border: "1px solid #e0e4ed" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#1a2f5e" }}>
                      <MapPin className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-xs font-bold" style={{ color: "#1a2f5e" }}>Physical Location Details</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold" style={{ color: "#1a2f5e" }}>County / Region *</label>
                      <select
                        value={form.county}
                        onChange={(e) => set("county", e.target.value)}
                        className={inputClass(!!errors.county)}
                        style={{ background: "#fff" }}
                      >
                        <option value="">Select county…</option>
                        {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.county && <p className="mt-1 text-xs text-red-500">{errors.county}</p>}
                    </div>
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold" style={{ color: "#1a2f5e" }}>
                        Area / Street <span style={{ color: "#9aa3b5", fontWeight: 400 }}>(optional)</span>
                      </label>
                      <input
                        value={form.physicalAddress}
                        onChange={(e) => set("physicalAddress", e.target.value)}
                        placeholder="e.g. Westlands, Kimathi St"
                        className={inputClass(false)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Contact & Review ──────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-bold" style={{ color: "#1a2f5e" }}>Contact & Final Review</h2>
                <p className="text-xs mt-0.5" style={{ color: "#9aa3b5" }}>
                  Provide contact details for verification communication, then review your application.
                </p>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-xs font-semibold" style={{ color: "#1a2f5e" }}>Contact Email *</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => set("contactEmail", e.target.value)}
                    placeholder="owner@yourbusiness.co.ke"
                    className={inputClass(!!errors.contactEmail)}
                  />
                  {errors.contactEmail && <p className="mt-1 text-xs text-red-500">{errors.contactEmail}</p>}
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-semibold" style={{ color: "#1a2f5e" }}>Phone Number *</label>
                  <input
                    value={form.contactPhone}
                    onChange={(e) => set("contactPhone", e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className={inputClass(!!errors.contactPhone)}
                  />
                  {errors.contactPhone && <p className="mt-1 text-xs text-red-500">{errors.contactPhone}</p>}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block mb-1.5 text-xs font-semibold" style={{ color: "#1a2f5e" }}>
                  Business Description * <span style={{ color: "#9aa3b5", fontWeight: 400 }}>({form.description.length}/400)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={4}
                  maxLength={400}
                  placeholder="Briefly describe your business — what you sell or offer, your target market, and why you're applying for KCPP verification…"
                  className={`w-full px-3 py-2.5 rounded-lg outline-none text-sm resize-none transition-colors focus:ring-2 focus:ring-blue-100 ${errors.description ? "border border-red-400 bg-red-50" : "border border-gray-200 focus:border-[#1a2f5e]"}`}
                />
                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
              </div>

              {/* Review Summary */}
              <div className="rounded-xl p-4" style={{ background: "#f8f9fc", border: "1px solid #e0e4ed" }}>
                <p className="text-xs font-bold mb-3" style={{ color: "#1a2f5e" }}>Application Summary</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                  {[
                    ["Business Name", form.businessName],
                    ["Owner Name", form.ownerName],
                    ["Cert. Number", form.govtCertNumber],
                    ["Category", form.category],
                    ["Year Est.", form.yearEstablished],
                    ["Operates", LOCATION_OPTIONS.find((o) => o.value === form.locationType)?.label ?? "—"],
                    ...(isOnline ? [["Instagram", form.instaPages.filter(Boolean).map((p) => `@${p}`).join(", ") || "—"]] : []),
                    ...(isOnline && form.websiteUrl ? [["Website", form.websiteUrl]] : []),
                    ...(isPhysical ? [["County", form.county], ["Area", form.physicalAddress || "—"]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-xs" style={{ color: "#9aa3b5", minWidth: 80 }}>{k}:</span>
                      <span className="text-xs font-semibold truncate" style={{ color: "#1a2f5e" }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Document attached indicator */}
                {form.govtCertFile && (
                  <div
                    className="flex items-center gap-2 mt-3 pt-3 rounded-lg px-3 py-2"
                    style={{ borderTop: "1px solid #e0e4ed", background: "#e8f5e9" }}
                  >
                    <FileCheck2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#2ecc71" }} />
                    <span className="text-xs font-semibold truncate" style={{ color: "#1a4d2e" }}>
                      {form.govtCertFile.file.name}
                    </span>
                    <span className="text-xs ml-auto shrink-0" style={{ color: "#2ecc71" }}>
                      ✓ Attached
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid #e0e4ed" }}>
                  <ChevronRight className="w-3 h-3" style={{ color: "#9aa3b5" }} />
                  <span className="text-xs" style={{ color: "#9aa3b5" }}>
                    Need to change something? Use the Back button.
                  </span>
                </div>
              </div>

              {/* Fee notice */}
              <div className="rounded-xl p-4" style={{ background: "#e8f5e9", border: "1px solid #2ecc71" }}>
                <p className="text-xs font-bold mb-1" style={{ color: "#1a4d2e" }}>Verification Fee</p>
                <p className="text-xs" style={{ color: "#1a4d2e" }}>
                  Annual verification fee: <strong>KES 5,000</strong> (SMEs) · <strong>KES 15,000</strong> (Enterprises).
                  Payment instructions will be sent to your email after review.
                </p>
              </div>

              {/* Agreements */}
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={form.agreedToTerms}
                    onChange={(e) => { set("agreedToTerms", e.target.checked); }}
                    className="mt-0.5"
                    style={{ width: 16, height: 16, accentColor: "#1a2f5e" }}
                  />
                  <label htmlFor="terms" className="text-xs" style={{ color: "#4b5563" }}>
                    I agree to KCPP's <span className="underline cursor-pointer" style={{ color: "#1a2f5e" }}>Terms of Service</span> and <span className="underline cursor-pointer" style={{ color: "#1a2f5e" }}>Privacy Policy</span>. I confirm all information provided is accurate and I am authorised to represent this business. *
                  </label>
                </div>
                {errors.agreedToTerms && <p className="text-xs text-red-500 -mt-1">{errors.agreedToTerms}</p>}

                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="audit"
                    checked={form.agreedToAudit}
                    onChange={(e) => { set("agreedToAudit", e.target.checked); }}
                    className="mt-0.5"
                    style={{ width: 16, height: 16, accentColor: "#1a2f5e" }}
                  />
                  <label htmlFor="audit" className="text-xs" style={{ color: "#4b5563" }}>
                    I agree to cooperate with KCPP's verification audit process, which may include providing additional documentation, business registration proof, and/or site visits. *
                  </label>
                </div>
                {errors.agreedToAudit && <p className="text-xs text-red-500 -mt-1">{errors.agreedToAudit}</p>}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-7 pt-5" style={{ borderTop: "1px solid #e0e4ed" }}>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-colors hover:bg-gray-50"
                style={{ background: "#f4f6fb", color: "#1a2f5e", border: "1px solid #e0e4ed" }}
              >
                ← Back
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "#1a2f5e" }}
              >
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "#d4a017" }}
              >
                Submit Application
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
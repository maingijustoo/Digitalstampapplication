import { useState } from "react";
import { Search, Shield, Clock, CheckCircle, XCircle, AlertTriangle, FileText } from "lucide-react";
import { applicantApi, type ApplicationSummary } from "../../frontend_api/api";

const STATUS_META: Record<string, { icon: JSX.Element; color: string; bg: string; label: string }> = {
  draft:        { icon: <FileText className="w-5 h-5" />,      color: "#9aa3b5", bg: "#f4f6fb", label: "Draft" },
  submitted:    { icon: <Clock className="w-5 h-5" />,          color: "#1565c0", bg: "#e3f2fd", label: "Submitted" },
  under_review: { icon: <Search className="w-5 h-5" />,         color: "#e67e22", bg: "#fff3e0", label: "Under Review" },
  approved:     { icon: <CheckCircle className="w-5 h-5" />,    color: "#2e7d32", bg: "#e8f5e9", label: "Approved" },
  rejected:     { icon: <XCircle className="w-5 h-5" />,        color: "#c0392b", bg: "#fce4ec", label: "Rejected" },
  issued:       { icon: <Shield className="w-5 h-5" />,         color: "#1a2f5e", bg: "#e8eaf6", label: "Stamp Issued" },
  cancelled:    { icon: <AlertTriangle className="w-5 h-5" />,  color: "#9aa3b5", bg: "#f4f6fb", label: "Cancelled" },
};

export function BusinessPortal() {
  const [searchEmail, setSearchEmail]     = useState("");
  const [searching, setSearching]         = useState(false);
  const [applications, setApplications]   = useState<ApplicationSummary[]>([]);
  const [searched, setSearched]           = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    setSearching(true);
    setError(null);
    setSearched(false);
    try {
      // Find applicant by email, then get their applications
      const applicantsRes = await applicantApi.list(searchEmail.trim());
      if (applicantsRes.results.length === 0) {
        setApplications([]);
        setSearched(true);
        return;
      }
      // Fetch applications for the first matching applicant
      const applicant = applicantsRes.results[0];
      const apps = await applicantApi.getApplications(applicant.id);
      setApplications(apps);
      setSearched(true);
    } catch (err: any) {
      setError(err.message ?? "Could not connect. Make sure Django is running.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <Shield className="w-12 h-12 mx-auto mb-3" style={{ color: "#1a2f5e" }} />
        <h1 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.6rem" }}>Business Portal</h1>
        <p className="mt-2" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
          Track your KCPP stamp application status. Enter the email address you used when applying.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex mb-8 shadow-md rounded-xl overflow-hidden">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#9aa3b5" }} />
          <input
            type="email" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Enter your email address used when applying…"
            className="w-full pl-12 pr-4 py-4 outline-none text-base"
            style={{ background: "#fff", color: "#1a2f5e", border: "none" }}
          />
        </div>
        <button type="submit" disabled={searching}
          className="px-6 py-4 font-bold text-white"
          style={{ background: searching ? "#13254a" : "#1a2f5e", border: "none" }}>
          {searching ? "Searching…" : "Look Up"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg p-3 mb-4 text-sm" style={{ background: "#fce4ec", color: "#c0392b", border: "1px solid #e74c3c" }}>
          ⚠️ {error}
        </div>
      )}

      {/* No results */}
      {searched && applications.length === 0 && (
        <div className="rounded-xl p-8 text-center shadow" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
          <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: "#9aa3b5" }} />
          <h2 style={{ color: "#1a2f5e", fontWeight: 700 }}>No Applications Found</h2>
          <p className="mt-2" style={{ color: "#6b7280", fontSize: "0.88rem" }}>
            No applications found for <strong>{searchEmail}</strong>. Check the email or apply below.
          </p>
          <a href="/apply-stamp"
            className="inline-block mt-4 px-5 py-2 rounded-lg text-sm font-bold text-white"
            style={{ background: "#d4a017" }}>
            Apply for KCPP Stamp →
          </a>
        </div>
      )}

      {/* Applications list */}
      {applications.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Found {applications.length} application{applications.length !== 1 ? "s" : ""}
          </p>

          {applications.map((app) => {
            const meta = STATUS_META[app.status] ?? STATUS_META.draft;
            return (
              <div key={app.id} className="rounded-xl shadow-sm overflow-hidden"
                style={{ background: "#fff", border: `2px solid ${meta.color}` }}>
                {/* Status bar */}
                <div className="flex items-center gap-3 px-4 py-3" style={{ background: meta.bg }}>
                  <span style={{ color: meta.color }}>{meta.icon}</span>
                  <span style={{ fontWeight: 700, color: meta.color, fontSize: "0.88rem" }}>{meta.label}</span>
                  {app.priority !== "normal" && (
                    <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                      style={{ background: app.priority === "urgent" ? "#fff3e0" : "#f3e5f5", color: app.priority === "urgent" ? "#e67e22" : "#6a1b9a" }}>
                      {app.priority}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-4">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <p style={{ fontWeight: 700, color: "#1a2f5e", fontSize: "0.95rem" }}>
                        {app.reference_number || `Application #${app.id}`}
                      </p>
                      <p style={{ fontSize: "0.78rem", color: "#9aa3b5", marginTop: 2 }}>
                        Stamp Type: {app.stamp_type_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>
                        Submitted: {app.submitted_at
                          ? new Date(app.submitted_at).toLocaleDateString("en-KE")
                          : "Not yet submitted"}
                      </p>
                      <p style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>
                        Created: {new Date(app.created_at).toLocaleDateString("en-KE")}
                      </p>
                    </div>
                  </div>

                  {/* Payment status */}
                  <div className="mt-3 flex items-center gap-2">
                    <span style={{ fontSize: "0.75rem", color: "#9aa3b5" }}>Fee payment:</span>
                    {app.fee_paid ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#e8f5e9", color: "#2e7d32" }}>
                        ✓ Paid
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fff3e0", color: "#e67e22" }}>
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Status-specific messages */}
                  {app.status === "approved" && !app.fee_paid && (
                    <div className="mt-3 p-3 rounded-lg" style={{ background: "#e8f5e9", border: "1px solid #2ecc71" }}>
                      <p style={{ fontSize: "0.8rem", color: "#1a4d2e", fontWeight: 600 }}>
                        🎉 Approved! Please proceed with fee payment to receive your stamp.
                      </p>
                    </div>
                  )}
                  {app.status === "issued" && (
                    <div className="mt-3 p-3 rounded-lg" style={{ background: "#e8eaf6", border: "1px solid #1a2f5e" }}>
                      <p style={{ fontSize: "0.8rem", color: "#1a2f5e", fontWeight: 600 }}>
                        🏷 Your KCPP Digital Trust Stamp has been issued. Display it proudly on your business!
                      </p>
                    </div>
                  )}
                  {app.status === "rejected" && (
                    <div className="mt-3 p-3 rounded-lg" style={{ background: "#fce4ec", border: "1px solid #e74c3c" }}>
                      <p style={{ fontSize: "0.8rem", color: "#c0392b", fontWeight: 600 }}>
                        Your application was not approved. You may re-apply after addressing any issues raised.
                      </p>
                    </div>
                  )}
                  {app.status === "under_review" && (
                    <div className="mt-3 p-3 rounded-lg" style={{ background: "#fff3e0", border: "1px solid #e67e22" }}>
                      <p style={{ fontSize: "0.8rem", color: "#7d4e00" }}>
                        🔍 Our team is currently reviewing your application. This typically takes 5–10 business days.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Apply again CTA */}
          <a href="/apply-stamp"
            className="flex items-center justify-center gap-2 mt-2 py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: "#d4a017" }}>
            <Shield className="w-4 h-4" /> Apply for Another Stamp
          </a>
        </div>
      )}

      {/* Info cards (shown when not searched yet) */}
      {!searched && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {[
            { icon: "📤", title: "Submit",   desc: "Apply for your KCPP Digital Trust Stamp online" },
            { icon: "🔍", title: "Track",    desc: "Monitor your application status in real time" },
            { icon: "🏷",  title: "Receive", desc: "Display your verified stamp once approved and paid" },
          ].map((s) => (
            <div key={s.title} className="flex flex-col items-center p-4 rounded-xl text-center"
              style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
              <span className="text-3xl mb-2">{s.icon}</span>
              <p style={{ fontWeight: 700, color: "#1a2f5e", fontSize: "0.88rem" }}>{s.title}</p>
              <p style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: 4 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

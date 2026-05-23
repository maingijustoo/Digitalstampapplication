import { useState } from "react";
import {
  Search, Shield, Clock, CheckCircle, XCircle, AlertTriangle,
  FileText, Bell, BarChart2, LogOut, Lock,
} from "lucide-react";
import {
  applicantApi,
  authApi,
  portalApi,
  decodeJwtPayload,
  type ApplicationSummary,
  type PortalDashboard,
  type BusinessNotification,
  type ProfileFraudReport,
} from "../api";

// ── Existing status meta — untouched ─────────────────────────────────────────
const STATUS_META: Record<string, {
  icon: JSX.Element; color: string; bg: string; label: string;
}> = {
  draft:        { icon: <FileText className="w-5 h-5" />,     color: "#9aa3b5", bg: "#f4f6fb", label: "Draft" },
  submitted:    { icon: <Clock className="w-5 h-5" />,         color: "#1565c0", bg: "#e3f2fd", label: "Submitted" },
  under_review: { icon: <Search className="w-5 h-5" />,        color: "#e67e22", bg: "#fff3e0", label: "Under Review" },
  approved:     { icon: <CheckCircle className="w-5 h-5" />,   color: "#2e7d32", bg: "#e8f5e9", label: "Approved" },
  rejected:     { icon: <XCircle className="w-5 h-5" />,       color: "#c0392b", bg: "#fce4ec", label: "Rejected" },
  issued:       { icon: <Shield className="w-5 h-5" />,        color: "#1a2f5e", bg: "#e8eaf6", label: "Stamp Issued" },
  cancelled:    { icon: <AlertTriangle className="w-5 h-5" />, color: "#9aa3b5", bg: "#f4f6fb", label: "Cancelled" },
};

// ── Trust score colour helper ─────────────────────────────────────────────────
function trustColor(score: number) {
  if (score >= 75) return "#2ecc71";
  if (score >= 45) return "#e67e22";
  return "#e74c3c";
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Original email-based application tracker (preserved exactly)
// ─────────────────────────────────────────────────────────────────────────────
function ApplicationTracker() {
  const [searchEmail, setSearchEmail]   = useState("");
  const [searching, setSearching]       = useState(false);
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [searched, setSearched]         = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setSearching(true);
    setError(null);
    setSearched(false);
    try {
      const applicantsRes = await applicantApi.list(searchEmail.trim());
      if (applicantsRes.results.length === 0) {
        setApplications([]);
        setSearched(true);
        return;
      }
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
    <div>
      <form onSubmit={handleSearch} className="flex mb-8 shadow-md rounded-xl overflow-hidden">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: "#9aa3b5" }} />
          <input
            type="email" value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
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

      {error && (
        <div className="rounded-lg p-3 mb-4 text-sm"
          style={{ background: "#fce4ec", color: "#c0392b", border: "1px solid #e74c3c" }}>
          ⚠️ {error}
        </div>
      )}

      {searched && applications.length === 0 && (
        <div className="rounded-xl p-8 text-center shadow"
          style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
          <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: "#9aa3b5" }} />
          <h2 style={{ color: "#1a2f5e", fontWeight: 700 }}>No Applications Found</h2>
          <p className="mt-2" style={{ color: "#6b7280", fontSize: "0.88rem" }}>
            No applications found for <strong>{searchEmail}</strong>.
          </p>
          <a href="/apply-stamp"
            className="inline-block mt-4 px-5 py-2 rounded-lg text-sm font-bold text-white"
            style={{ background: "#d4a017" }}>
            Apply for KCPP Stamp →
          </a>
        </div>
      )}

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
                <div className="flex items-center gap-3 px-4 py-3" style={{ background: meta.bg }}>
                  <span style={{ color: meta.color }}>{meta.icon}</span>
                  <span style={{ fontWeight: 700, color: meta.color, fontSize: "0.88rem" }}>
                    {meta.label}
                  </span>
                  {app.priority !== "normal" && (
                    <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                      style={{
                        background: app.priority === "urgent" ? "#fff3e0" : "#f3e5f5",
                        color: app.priority === "urgent" ? "#e67e22" : "#6a1b9a",
                      }}>
                      {app.priority}
                    </span>
                  )}
                </div>
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
                  <div className="mt-3 flex items-center gap-2">
                    <span style={{ fontSize: "0.75rem", color: "#9aa3b5" }}>Fee payment:</span>
                    {app.fee_paid ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#e8f5e9", color: "#2e7d32" }}>✓ Paid</span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#fff3e0", color: "#e67e22" }}>Pending</span>
                    )}
                  </div>
                  {app.status === "approved" && !app.fee_paid && (
                    <div className="mt-3 p-3 rounded-lg"
                      style={{ background: "#e8f5e9", border: "1px solid #2ecc71" }}>
                      <p style={{ fontSize: "0.8rem", color: "#1a4d2e", fontWeight: 600 }}>
                        🎉 Approved! Please proceed with fee payment to receive your stamp.
                      </p>
                    </div>
                  )}
                  {app.status === "issued" && (
                    <div className="mt-3 p-3 rounded-lg"
                      style={{ background: "#e8eaf6", border: "1px solid #1a2f5e" }}>
                      <p style={{ fontSize: "0.8rem", color: "#1a2f5e", fontWeight: 600 }}>
                        🏷 Your KCPP Digital Trust Stamp has been issued!
                      </p>
                    </div>
                  )}
                  {app.status === "rejected" && (
                    <div className="mt-3 p-3 rounded-lg"
                      style={{ background: "#fce4ec", border: "1px solid #e74c3c" }}>
                      <p style={{ fontSize: "0.8rem", color: "#c0392b", fontWeight: 600 }}>
                        Your application was not approved. You may re-apply after addressing any issues.
                      </p>
                    </div>
                  )}
                  {app.status === "under_review" && (
                    <div className="mt-3 p-3 rounded-lg"
                      style={{ background: "#fff3e0", border: "1px solid #e67e22" }}>
                      <p style={{ fontSize: "0.8rem", color: "#7d4e00" }}>
                        🔍 Our team is currently reviewing your application (5–10 business days).
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <a href="/apply-stamp"
            className="flex items-center justify-center gap-2 mt-2 py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: "#d4a017" }}>
            <Shield className="w-4 h-4" /> Apply for Another Stamp
          </a>
        </div>
      )}

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

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Authenticated Business Portal (JWT)
// ─────────────────────────────────────────────────────────────────────────────
function AuthenticatedPortal({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "notifications"
    | "reports"
    | "settings"
  >("dashboard");

  const [dashboard,     setDashboard]     = useState<PortalDashboard | null>(null);
  const [notifications, setNotifications] = useState<BusinessNotification[]>([]);
  const [myReports,     setMyReports]     = useState<ProfileFraudReport[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // ── Change password state ─────────────────────────────────────────────────
  const [currentPassword,  setCurrentPassword]  = useState("");
  const [newPassword,      setNewPassword]       = useState("");
  const [confirmPassword,  setConfirmPassword]   = useState("");
  const [passwordError,    setPasswordError]     = useState<string | null>(null);
  const [passwordSuccess,  setPasswordSuccess]   = useState(false);
  const [changingPassword, setChangingPassword]  = useState(false);

  const loadTab = async (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === "settings") return;
    setLoading(true);
    setError(null);
    try {
      if (tab === "dashboard") {
        const data = await portalApi.getDashboard();
        setDashboard(data);
      } else if (tab === "notifications") {
        const data = await portalApi.getNotifications();
        setNotifications(data);
      } else if (tab === "reports") {
        const data = await portalApi.getMyReports();
        setMyReports(data);
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard on mount
  useState(() => { loadTab("dashboard"); });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    setChangingPassword(true);
    try {
      await portalApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message ?? "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const SEVERITY_COLOR: Record<string, string> = {
    high: "#e74c3c", medium: "#e67e22", low: "#2ecc71",
  };
  const STATUS_COLOR: Record<string, string> = {
    open: "#e67e22", investigating: "#1565c0", resolved: "#2ecc71",
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl"
        style={{ background: "#f4f6fb", border: "1px solid #e0e4ed" }}>
        {([
          { key: "dashboard",     label: "Dashboard",     icon: <BarChart2 className="w-4 h-4" /> },
          { key: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
          { key: "reports",       label: "Reports",       icon: <AlertTriangle className="w-4 h-4" /> },
          { key: "settings",      label: "Settings",      icon: <Lock className="w-4 h-4" /> },
        ] as const).map((tab) => (
          <button key={tab.key} onClick={() => loadTab(tab.key)}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{
              background: activeTab === tab.key ? "#fff" : "transparent",
              color:      activeTab === tab.key ? "#1a2f5e" : "#9aa3b5",
              boxShadow:  activeTab === tab.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
        <button onClick={onLogout}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold"
          style={{ color: "#e74c3c" }} title="Log out">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="rounded-lg p-3 mb-4 text-sm"
          style={{ background: "#fce4ec", color: "#c0392b", border: "1px solid #e74c3c" }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12" style={{ color: "#9aa3b5" }}>Loading…</div>
      )}

      {/* ── Dashboard ──────────────────────────────────────────────────── */}
      {!loading && activeTab === "dashboard" && dashboard && (
        <div className="flex flex-col gap-4">
          {/* Trust score hero */}
          <div className="rounded-xl p-5 flex items-center gap-5"
            style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
            <div className="shrink-0">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="30" fill="none" stroke="#e0e4ed" strokeWidth="7" />
                <circle cx="40" cy="40" r="30" fill="none"
                  stroke={trustColor(dashboard.trust_score)}
                  strokeWidth="7"
                  strokeDasharray={`${(dashboard.trust_score / 100) * (2 * Math.PI * 30)} ${2 * Math.PI * 30}`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
                <text x="40" y="45" textAnchor="middle"
                  style={{ fontSize: "1.1rem", fontWeight: 800, fill: trustColor(dashboard.trust_score) }}>
                  {dashboard.trust_score}
                </text>
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 800, color: "#1a2f5e", fontSize: "1.1rem" }}>
                {dashboard.business_name}
              </p>
              <p style={{ color: "#9aa3b5", fontSize: "0.78rem" }}>
                @{dashboard.business_handle}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {dashboard.is_verified ? (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "#e8f5e9", color: "#2e7d32" }}>
                    ✓ Verified
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "#f4f6fb", color: "#9aa3b5" }}>
                    Unverified
                  </span>
                )}
                <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                  style={{ background: "#f4f6fb", color: "#6b7280" }}>
                  {dashboard.badge_status}
                </span>
              </div>
              {dashboard.certificate_id && (
                <p style={{ fontSize: "0.72rem", color: "#9aa3b5", marginTop: 4 }}>
                  Cert: {dashboard.certificate_id}
                </p>
              )}
            </div>
          </div>

          {/* First-login notice */}
          {dashboard.is_verified && (
            <div className="rounded-xl p-4"
              style={{ background: "#fff3e0", border: "1px solid #e67e22" }}>
              <p style={{ fontSize: "0.82rem", color: "#7d4e00", fontWeight: 600 }}>
                🔐 First time logging in? Go to{" "}
                <button
                  onClick={() => loadTab("settings")}
                  style={{ color: "#1a2f5e", textDecoration: "underline", fontWeight: 700 }}>
                  Settings
                </button>{" "}
                to change your one-time password.
              </p>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Open Reports",  value: dashboard.open_reports,         color: "#e74c3c" },
              { label: "Resolved",      value: dashboard.resolved_reports,     color: "#2ecc71" },
              { label: "Notifications", value: dashboard.unread_notifications, color: "#1565c0" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl p-4 text-center"
                style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
                <p style={{ fontSize: "1.5rem", fontWeight: 800, color: stat.color }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Notifications ──────────────────────────────────────────────── */}
      {!loading && activeTab === "notifications" && (
        <div className="flex flex-col gap-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8" style={{ color: "#9aa3b5" }}>
              No unread notifications.
            </div>
          ) : notifications.map((n) => (
            <div key={n.id} className="rounded-xl p-4"
              style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p style={{ fontWeight: 700, color: "#1a2f5e", fontSize: "0.88rem" }}>
                    {n.title}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 2 }}>
                    {n.message}
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 capitalize"
                  style={{ background: "#f4f6fb", color: "#9aa3b5" }}>
                  {n.type.replace(/_/g, " ")}
                </span>
              </div>
              <p style={{ fontSize: "0.68rem", color: "#9aa3b5", marginTop: 6 }}>
                {new Date(n.created_at).toLocaleString("en-KE")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Reports ────────────────────────────────────────────────────── */}
      {!loading && activeTab === "reports" && (
        <div className="flex flex-col gap-3">
          {myReports.length === 0 ? (
            <div className="text-center py-8" style={{ color: "#9aa3b5" }}>
              No reports have been filed against your business.
            </div>
          ) : myReports.map((r) => (
            <div key={r.id} className="rounded-xl p-4"
              style={{
                background: "#fff",
                border: `1px solid ${SEVERITY_COLOR[r.severity_category] ?? "#e0e4ed"}`,
              }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p style={{ fontWeight: 700, color: "#1a2f5e", fontSize: "0.88rem" }}>
                    {r.report_type}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>
                    {r.location}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{
                      background: `${SEVERITY_COLOR[r.severity_category]}18`,
                      color: SEVERITY_COLOR[r.severity_category],
                    }}>
                    {r.severity_category}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{
                      background: `${STATUS_COLOR[r.status]}18`,
                      color: STATUS_COLOR[r.status] ?? "#9aa3b5",
                    }}>
                    {r.status}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: "0.68rem", color: "#9aa3b5", marginTop: 6 }}>
                Filed: {new Date(r.created_at).toLocaleDateString("en-KE")}
                {r.is_anonymous ? " · Anonymous" : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Settings: Change Password ───────────────────────────────────── */}
      {activeTab === "settings" && (
        <div className="max-w-md">
          <h2 style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "1rem", marginBottom: 16 }}>
            🔐 Change Password
          </h2>

          {passwordSuccess && (
            <div className="rounded-lg p-3 mb-4 text-sm"
              style={{ background: "#e8f5e9", color: "#2e7d32", border: "1px solid #2ecc71" }}>
              ✓ Password changed successfully. Use your new password next time you log in.
            </div>
          )}

          {passwordError && (
            <div className="rounded-lg p-3 mb-4 text-sm"
              style={{ background: "#fce4ec", color: "#c0392b", border: "1px solid #e74c3c" }}>
              ⚠️ {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword}
            className="rounded-xl p-5 flex flex-col gap-4"
            style={{ background: "#fff", border: "1px solid #e0e4ed" }}>

            <div>
              <label className="block mb-1"
                style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Your current or one-time password"
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem" }}
                required
              />
            </div>

            <div>
              <label className="block mb-1"
                style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem" }}
                required
              />
            </div>

            <div>
              <label className="block mb-1"
                style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem" }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full py-3 rounded-lg font-bold text-white"
              style={{
                background: changingPassword ? "#13254a" : "#1a2f5e",
                cursor: changingPassword ? "not-allowed" : "pointer",
              }}>
              {changingPassword ? "Changing…" : "Change Password"}
            </button>
          </form>

          <p className="mt-4" style={{ fontSize: "0.75rem", color: "#9aa3b5" }}>
            If you've lost access to your account, contact KCCP support.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export: BusinessPortal — two-mode component
// ─────────────────────────────────────────────────────────────────────────────
export function BusinessPortal() {
  const [mode, setMode] = useState<"track" | "login" | "portal">(
    // Restore session if token already in storage
    localStorage.getItem("access_token") ? "portal" : "track"
  );
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError]       = useState<string | null>(null);
  const [loggingIn, setLoggingIn]         = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const tokens = await authApi.login(loginUsername, loginPassword);
      const payload = decodeJwtPayload(tokens.access);
      // Redirect staff to admin dashboard, regular users to portal
      if (payload.is_staff === true) {
        window.location.href = "/admin-dashboard";
      } else {
        setMode("portal");
      }
    } catch (err: any) {
      setLoginError(err.message ?? "Invalid credentials.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    setMode("track");
    setLoginUsername("");
    setLoginPassword("");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <Shield className="w-12 h-12 mx-auto mb-3" style={{ color: "#1a2f5e" }} />
        <h1 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.6rem" }}>Business Portal</h1>
        <p className="mt-1" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
          Track your stamp application, or log in to your business dashboard.
        </p>
      </div>

      {/* Mode switcher (only shown when not in authenticated portal) */}
      {mode !== "portal" && (
        <div className="flex gap-1 mb-8 p-1 rounded-xl"
          style={{ background: "#f4f6fb", border: "1px solid #e0e4ed" }}>
          <button
            onClick={() => setMode("track")}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{
              background: mode === "track" ? "#fff" : "transparent",
              color: mode === "track" ? "#1a2f5e" : "#9aa3b5",
              boxShadow: mode === "track" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
            📋 Track Application
          </button>
          <button
            onClick={() => setMode("login")}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{
              background: mode === "login" ? "#fff" : "transparent",
              color: mode === "login" ? "#1a2f5e" : "#9aa3b5",
              boxShadow: mode === "login" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
            <Lock className="w-3 h-3 inline mr-1" />
            Business Login
          </button>
        </div>
      )}

      {/* Track application (original functionality) */}
      {mode === "track" && <ApplicationTracker />}

      {/* Login form */}
      {mode === "login" && (
        <div className="rounded-xl shadow p-6"
          style={{ background: "#fff", border: "1px solid #e0e4ed", maxWidth: 400, margin: "0 auto" }}>
          <h2 style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "1.1rem", marginBottom: 20 }}>
            <Lock className="w-4 h-4 inline mr-2" />
            Business Account Login
          </h2>
          {loginError && (
            <div className="rounded-lg p-3 mb-4 text-sm"
              style={{ background: "#fce4ec", color: "#c0392b", border: "1px solid #e74c3c" }}>
              ⚠️ {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block mb-1"
                style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                Username
              </label>
              <input
                type="text" value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Your KCPP username"
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem" }}
                required
              />
            </div>
            <div>
              <label className="block mb-1"
                style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>
                Password
              </label>
              <input
                type="password" value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem" }}
                required
              />
            </div>
            <button type="submit" disabled={loggingIn}
              className="w-full py-3 rounded-lg font-bold text-white"
              style={{ background: loggingIn ? "#13254a" : "#1a2f5e", cursor: loggingIn ? "not-allowed" : "pointer" }}>
              {loggingIn ? "Logging in…" : "Log In"}
            </button>
          </form>
        </div>
      )}

      {/* Authenticated portal */}
      {mode === "portal" && <AuthenticatedPortal onLogout={handleLogout} />}
    </div>
  );
}
import { useState, useEffect, useCallback } from "react";
import {
  Shield, Flag, Trash2, AlertTriangle, CheckCircle,
  FileText, Users, LogOut,
} from "lucide-react";
import {
  adminApi, applicationApi, businessApi,
  authApi,
  type ApplicationSummary,
  type ProfileFraudReport,
  type Business,
} from "../api";

// ── Colour helpers ────────────────────────────────────────────────────────────
const SEVERITY_COLOR: Record<string, string> = {
  high: "#e74c3c", medium: "#e67e22", low: "#2ecc71",
};
const STATUS_COLOR: Record<string, string> = {
  open: "#e67e22", investigating: "#1565c0", resolved: "#2ecc71",
  pending: "#e67e22",
};

type AdminTab = "applications" | "reports" | "businesses";

export function AdminDashboard() {
  // ── Guard: block render entirely if not admin ─────────────────────────────
  if (!authApi.isAdmin()) {
    window.location.href = "/business-portal";
    return null;  // prevent flash of dashboard content
  }

  const [activeTab, setActiveTab] = useState<AdminTab>("applications");

  // Per-tab data
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [reports, setReports]           = useState<ProfileFraudReport[]>([]);
  const [businesses, setBusinesses]     = useState<Business[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Report filters
  const [reportStatusFilter,   setReportStatusFilter]   = useState("");
  const [reportSeverityFilter, setReportSeverityFilter] = useState("");

  // Flag business modal
  const [flagTargetId, setFlagTargetId] = useState<number | null>(null);
  const [flagReason, setFlagReason]     = useState("");
  const [flagging, setFlagging]         = useState(false);

  // Approve / reject modal
  const [actionTarget, setActionTarget] = useState<ApplicationSummary | null>(null);
  const [actionNotes, setActionNotes]   = useState("");
  const [actionType, setActionType]     = useState<"approve" | "reject" | null>(null);
  const [actioning, setActioning]       = useState(false);

  // ── useCallback so useEffect dependency arrays are stable ─────────────────
  const loadTab = useCallback(async (
    tab: AdminTab,
    statusFilter = reportStatusFilter,
    severityFilter = reportSeverityFilter,
  ) => {
    setActiveTab(tab);
    setLoading(true);
    setError(null);
    try {
      if (tab === "applications") {
        const res = await applicationApi.list({ status: "under_review" });
        setApplications(res.results);
      } else if (tab === "reports") {
        const data = await adminApi.getAllReports({
          status:   statusFilter   || undefined,
          severity: severityFilter || undefined,
        });
        setReports(data);
      } else if (tab === "businesses") {
        const res = await businessApi.list();
        setBusinesses(res.results);
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []); // stable — filters passed as args, not closed over

  // Load applications tab on mount
  useEffect(() => {
    loadTab("applications");
  }, [loadTab]);

  // Re-fetch reports when filters change
  useEffect(() => {
    if (activeTab === "reports") {
      loadTab("reports", reportStatusFilter, reportSeverityFilter);
    }
  }, [reportStatusFilter, reportSeverityFilter]); // loadTab is stable so omitting is safe

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLogout = () => {
    authApi.logout();
    window.location.href = "/business-portal";
  };

  const handleDeleteReport = async (id: number) => {
    if (!window.confirm("Delete this report? This cannot be undone.")) return;
    try {
      await adminApi.deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err.message ?? "Delete failed.");
    }
  };

  const handleFlagBusiness = async () => {
    if (!flagTargetId || !flagReason.trim()) return;
    setFlagging(true);
    try {
      await adminApi.flagBusiness(flagTargetId, flagReason.trim());
      setFlagTargetId(null);
      setFlagReason("");
      loadTab("businesses");
    } catch (err: any) {
      setError(err.message ?? "Flag failed.");
    } finally {
      setFlagging(false);
    }
  };

  const handleApplicationAction = async () => {
    if (!actionTarget || !actionType) return;
    setActioning(true);
    try {
      if (actionType === "approve") {
        await adminApi.approveApplication(
          actionTarget.id, "admin", actionNotes
        );
      } else {
        await applicationApi.reject(
          actionTarget.id, "admin", actionNotes || "Rejected by admin."
        );
      }
      setActionTarget(null);
      setActionNotes("");
      setActionType(null);
      loadTab("applications");
    } catch (err: any) {
      setError(err.message ?? "Action failed.");
    } finally {
      setActioning(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8" style={{ color: "#1a2f5e" }} />
          <div>
            <h1 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.4rem" }}>
              KCCP Admin Dashboard
            </h1>
            <p style={{ color: "#9aa3b5", fontSize: "0.78rem" }}>
              Administrator access only
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#fce4ec", color: "#c0392b" }}>
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl"
        style={{ background: "#f4f6fb", border: "1px solid #e0e4ed" }}>
        {([
          { key: "applications", label: "Stamp Applications", icon: <FileText className="w-4 h-4" /> },
          { key: "reports",      label: "Fraud Reports",      icon: <Flag className="w-4 h-4" /> },
          { key: "businesses",   label: "Business Directory", icon: <Users className="w-4 h-4" /> },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => loadTab(tab.key, reportStatusFilter, reportSeverityFilter)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{
              background: activeTab === tab.key ? "#fff" : "transparent",
              color:      activeTab === tab.key ? "#1a2f5e" : "#9aa3b5",
              boxShadow:  activeTab === tab.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg p-3 mb-4 text-sm"
          style={{ background: "#fce4ec", color: "#c0392b", border: "1px solid #e74c3c" }}>
          ⚠️ {error}
          <button onClick={() => setError(null)} className="ml-3 underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-12" style={{ color: "#9aa3b5" }}>Loading…</div>
      )}

      {/* ── Tab 1: Stamp Applications ──────────────────────────────────── */}
      {!loading && activeTab === "applications" && (
        <div>
          <p className="text-sm mb-3" style={{ color: "#6b7280" }}>
            Showing applications pending review ({applications.length})
          </p>
          {applications.length === 0 ? (
            <div className="text-center py-12 rounded-xl"
              style={{ background: "#fff", border: "1px solid #e0e4ed", color: "#9aa3b5" }}>
              No applications pending review.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {applications.map((app) => (
                <div key={app.id} className="rounded-xl p-4"
                  style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p style={{ fontWeight: 700, color: "#1a2f5e" }}>
                        {app.reference_number || `#${app.id}`}
                      </p>
                      <p style={{ fontSize: "0.78rem", color: "#9aa3b5" }}>
                        {app.applicant_name} · {app.stamp_type_name}
                      </p>
                      <p style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>
                        Submitted:{" "}
                        {app.submitted_at
                          ? new Date(app.submitted_at).toLocaleDateString("en-KE")
                          : "—"}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => { setActionTarget(app); setActionType("approve"); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                        style={{ background: "#2e7d32" }}>
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => { setActionTarget(app); setActionType("reject"); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                        style={{ background: "#c0392b" }}>
                        <AlertTriangle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Fraud Reports ───────────────────────────────────────── */}
      {!loading && activeTab === "reports" && (
        <div>
          <div className="flex gap-3 mb-4 flex-wrap">
            <select
              value={reportStatusFilter}
              onChange={(e) => setReportStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: "1px solid #e0e4ed", background: "#fff", color: "#1a2f5e" }}>
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              value={reportSeverityFilter}
              onChange={(e) => setReportSeverityFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: "1px solid #e0e4ed", background: "#fff", color: "#1a2f5e" }}>
              <option value="">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <p className="self-center text-sm" style={{ color: "#9aa3b5" }}>
              {reports.length} report{reports.length !== 1 ? "s" : ""}
            </p>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-12 rounded-xl"
              style={{ background: "#fff", border: "1px solid #e0e4ed", color: "#9aa3b5" }}>
              No reports found.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reports.map((r) => (
                <div key={r.id} className="rounded-xl p-4"
                  style={{
                    background: "#fff",
                    border: `1px solid ${SEVERITY_COLOR[r.severity_category] ?? "#e0e4ed"}`,
                  }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <p style={{ fontWeight: 700, color: "#1a2f5e", fontSize: "0.88rem" }}>
                        {r.report_type}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>
                        {r.location} · {new Date(r.created_at).toLocaleDateString("en-KE")}
                        {r.is_anonymous ? " · Anonymous" : ""}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                          style={{
                            background: `${SEVERITY_COLOR[r.severity_category]}18`,
                            color: SEVERITY_COLOR[r.severity_category],
                          }}>
                          {r.severity_category} (score: {r.severity_score})
                        </span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                          style={{
                            background: `${STATUS_COLOR[r.status] ?? "#9aa3b5"}18`,
                            color: STATUS_COLOR[r.status] ?? "#9aa3b5",
                          }}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReport(r.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold shrink-0"
                      style={{ background: "#fce4ec", color: "#c0392b" }}>
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Business Directory ──────────────────────────────────── */}
      {!loading && activeTab === "businesses" && (
        <div>
          <p className="text-sm mb-3" style={{ color: "#6b7280" }}>
            {businesses.length} registered business{businesses.length !== 1 ? "es" : ""}
          </p>
          {businesses.length === 0 ? (
            <div className="text-center py-12 rounded-xl"
              style={{ background: "#fff", border: "1px solid #e0e4ed", color: "#9aa3b5" }}>
              No businesses found.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {businesses.map((biz) => (
                <div key={biz.id} className="rounded-xl p-4"
                  style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <p style={{ fontWeight: 700, color: "#1a2f5e" }}>{biz.name}</p>
                      <p style={{ fontSize: "0.78rem", color: "#9aa3b5" }}>
                        {biz.handle} · {biz.county} · {biz.category}
                      </p>
                      <span
                        className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                        style={{
                          background: biz.badge === "verified" ? "#e8f5e9" : "#f4f6fb",
                          color:      biz.badge === "verified" ? "#2e7d32" : "#9aa3b5",
                        }}>
                        {biz.badge}
                      </span>
                    </div>
                    <button
                      onClick={() => { setFlagTargetId(biz.id); setFlagReason(""); }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold shrink-0"
                      style={{ background: "#fff3e0", color: "#e67e22" }}>
                      <Flag className="w-3.5 h-3.5" /> Flag ⚠️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Flag Business ───────────────────────────────────────── */}
      {flagTargetId !== null && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="rounded-xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: "#fff" }}>
            <h3 style={{ color: "#1a2f5e", fontWeight: 700, marginBottom: 12 }}>
              ⚠️ Flag Business
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: 12 }}>
              This will set badge_status to "flagged", revoke verification, and notify the business.
            </p>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              rows={3}
              placeholder="Reason for flagging…"
              className="w-full px-3 py-2 rounded-lg outline-none resize-none mb-4"
              style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem" }}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setFlagTargetId(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "#f4f6fb", color: "#6b7280" }}>
                Cancel
              </button>
              <button
                onClick={handleFlagBusiness}
                disabled={flagging || !flagReason.trim()}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white"
                style={{ background: "#e74c3c", opacity: flagging ? 0.6 : 1 }}>
                {flagging ? "Flagging…" : "Confirm Flag"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Approve / Reject Application ────────────────────────── */}
      {actionTarget && actionType && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="rounded-xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: "#fff" }}>
            <h3 style={{ color: "#1a2f5e", fontWeight: 700, marginBottom: 12 }}>
              {actionType === "approve" ? "✅ Approve Application" : "❌ Reject Application"}
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: 12 }}>
              {actionTarget.reference_number} — {actionTarget.applicant_name}
            </p>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              rows={3}
              placeholder={
                actionType === "approve"
                  ? "Decision notes (optional)…"
                  : "Rejection reason…"
              }
              className="w-full px-3 py-2 rounded-lg outline-none resize-none mb-4"
              style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem" }}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setActionTarget(null);
                  setActionType(null);
                  setActionNotes("");
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "#f4f6fb", color: "#6b7280" }}>
                Cancel
              </button>
              <button
                onClick={handleApplicationAction}
                disabled={actioning}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white"
                style={{
                  background: actionType === "approve" ? "#2e7d32" : "#c0392b",
                  opacity: actioning ? 0.6 : 1,
                }}>
                {actioning
                  ? "Processing…"
                  : actionType === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
import { useState, useEffect, useCallback } from "react";
import {
  Shield, Flag, Trash2, AlertTriangle, CheckCircle,
  FileText, Users, LogOut, Eye, Award, RotateCcw,
  Bell, Search,
} from "lucide-react";
import {
  adminApi, applicationApi, businessApi, scamAlertApi,
  authApi,
  type ApplicationSummary, type ApplicationDetail,
  type ProfileFraudReport, type Business,
  type AuditLog, type ScamAlert,
} from "../api";

// ── Colour helpers ────────────────────────────────────────────────────────────
const SEVERITY_COLOR: Record<string, string> = {
  high: "#e74c3c", medium: "#e67e22", low: "#2ecc71",
};
const STATUS_COLOR: Record<string, string> = {
  open: "#e67e22", investigating: "#1565c0", resolved: "#2ecc71",
  pending: "#e67e22", draft: "#9aa3b5", submitted: "#1565c0",
  under_review: "#e67e22", approved: "#2e7d32", rejected: "#c0392b",
  issued: "#1a2f5e", cancelled: "#9aa3b5",
};

type AdminTab = "applications" | "reports" | "businesses" | "alerts";

export function AdminDashboard() {
  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!authApi.isAdmin()) {
    window.location.href = "/business-portal";
    return null;
  }

  const [activeTab, setActiveTab] = useState<AdminTab>("applications");

  // ── Per-tab data ──────────────────────────────────────────────────────────
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [reports,      setReports]      = useState<ProfileFraudReport[]>([]);
  const [businesses,   setBusinesses]   = useState<Business[]>([]);
  const [scamAlerts,   setScamAlerts]   = useState<ScamAlert[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [appStatusFilter,      setAppStatusFilter]      = useState("submitted");
  const [reportStatusFilter,   setReportStatusFilter]   = useState("");
  const [reportSeverityFilter, setReportSeverityFilter] = useState("");
  const [bizSearch,            setBizSearch]            = useState("");

  // ── Application detail drawer ─────────────────────────────────────────────
  const [detailApp,     setDetailApp]     = useState<ApplicationDetail | null>(null);
  const [auditLog,      setAuditLog]      = useState<AuditLog[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ── Issue stamp modal ─────────────────────────────────────────────────────
  const [issueTarget,    setIssueTarget]    = useState<ApplicationSummary | null>(null);
  const [issueIssuedBy,  setIssueIssuedBy]  = useState("admin");
  const [issueValidFrom, setIssueValidFrom] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [issueValidUntil, setIssueValidUntil] = useState("");
  const [issuing,         setIssuing]         = useState(false);

  // ── Issued credentials modal ──────────────────────────────────────────────
  const [issuedCredentials, setIssuedCredentials] = useState<{
    username: string;
    one_time_password: string;
    stamp: string;
  } | null>(null);

  // ── Flag / revoke modal ───────────────────────────────────────────────────
  const [bizActionTarget, setBizActionTarget] = useState<Business | null>(null);
  const [bizActionType,   setBizActionType]   = useState<"flag" | "revoke" | null>(null);
  const [bizActionReason, setBizActionReason] = useState("");
  const [bizActioning,    setBizActioning]    = useState(false);

  // ── Approve / reject modal ────────────────────────────────────────────────
  const [actionTarget, setActionTarget] = useState<ApplicationSummary | null>(null);
  const [actionNotes,  setActionNotes]  = useState("");
  const [actionType,   setActionType]   = useState<"approve" | "reject" | null>(null);
  const [actioning,    setActioning]    = useState(false);

  // ── Scam alert modal ──────────────────────────────────────────────────────
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertForm, setAlertForm] = useState({
    title: "", alert_type: "Other", description: "", location: "", date: "",
  });
  const [creatingAlert, setCreatingAlert] = useState(false);

  const ALERT_TYPES = [
    "Investment Scam", "Online Shopping", "Job Scam",
    "Romance Scam", "Crypto Fraud", "M-Pesa Fraud", "Phishing", "Other",
  ];

  // ── Load tab ──────────────────────────────────────────────────────────────
  const loadTab = useCallback(async (
    tab: AdminTab,
    statusFilter   = reportStatusFilter,
    severityFilter = reportSeverityFilter,
    appStatus      = appStatusFilter,
  ) => {
    setActiveTab(tab);
    setLoading(true);
    setError(null);
    try {
      if (tab === "applications") {
        const res = await applicationApi.list({
          status: (appStatus as any) || undefined,
        });
        setApplications(res.results);
      } else if (tab === "reports") {
        const data = await adminApi.getAllReports({
          status:   statusFilter   || undefined,
          severity: severityFilter || undefined,
        });
        setReports(data);
      } else if (tab === "businesses") {
        const res = await adminApi.getBusinessProfiles(bizSearch || undefined);
        setBusinesses(res.results as any);
      
      } else if (tab === "alerts") {
        const res = await scamAlertApi.list();
        setScamAlerts(res.results);
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTab("applications"); }, [loadTab]);

  useEffect(() => {
    if (activeTab === "reports") {
      loadTab("reports", reportStatusFilter, reportSeverityFilter);
    }
  }, [reportStatusFilter, reportSeverityFilter]);

  useEffect(() => {
    if (activeTab === "applications") {
      loadTab("applications", "", "", appStatusFilter);
    }
  }, [appStatusFilter]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleViewDetail = async (app: ApplicationSummary) => {
    // Toggle — click again to close
    if (detailApp?.id === app.id) {
      setDetailApp(null);
      setAuditLog([]);
      return;
    }
    setLoadingDetail(true);
    setDetailApp(null);
    setAuditLog([]);
    try {
      const [detail, logs] = await Promise.all([
        adminApi.getApplicationDetail(app.id),
        adminApi.getAuditLog(app.id),
      ]);
      setDetailApp(detail);
      setAuditLog(logs);
    } catch (err: any) {
      setError(err.message ?? "Failed to load detail.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStartReview = async (app: ApplicationSummary) => {
    try {
      await adminApi.startReview(app.id);
      loadTab("applications", "", "", appStatusFilter);
    } catch (err: any) {
      setError(err.message ?? "Failed to start review.");
    }
  };

  const handleMarkPaid = async (app: ApplicationSummary) => {
    const ref = window.prompt("Enter M-Pesa payment reference:");
    if (!ref?.trim()) return;
    try {
      await adminApi.recordPayment(app.id, ref.trim());
      loadTab("applications", "", "", appStatusFilter);
    } catch (err: any) {
      setError(err.message ?? "Payment recording failed.");
    }
  };

  const handleIssueStamp = async () => {
    if (!issueTarget) return;
    setIssuing(true);
    try {
      const res = await adminApi.issueStamp(issueTarget.id, {
        issued_by:   issueIssuedBy,
        valid_from:  issueValidFrom,
        valid_until: issueValidUntil || undefined,
      }) as any;

      setIssueTarget(null);

      if (res.one_time_password) {
        setIssuedCredentials({
          username:          res.portal_username,
          one_time_password: res.one_time_password,
          stamp:             res.stamp?.stamp_number ?? "",
        });
      }

      loadTab("applications", "", "", appStatusFilter);
    } catch (err: any) {
      setError(err.message ?? "Issue stamp failed.");
    } finally {
      setIssuing(false);
    }
  };

  const handleApplicationAction = async () => {
    if (!actionTarget || !actionType) return;
    setActioning(true);
    try {
      if (actionType === "approve") {
        await adminApi.approveApplication(actionTarget.id, "admin", actionNotes);
      } else {
        await applicationApi.reject(
          actionTarget.id, "admin", actionNotes || "Rejected by admin."
        );
      }
      setActionTarget(null);
      setActionNotes("");
      setActionType(null);
      loadTab("applications", "", "", appStatusFilter);
    } catch (err: any) {
      setError(err.message ?? "Action failed.");
    } finally {
      setActioning(false);
    }
  };

  const handleResolveReport = async (id: number) => {
    if (!window.confirm("Mark this report as resolved?")) return;
    try {
      await adminApi.resolveReport(id);
      setReports((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: "resolved" } : r)
      );
    } catch (err: any) {
      setError(err.message ?? "Resolve failed.");
    }
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

  const handleBizAction = async () => {
    if (!bizActionTarget || !bizActionType || !bizActionReason.trim()) return;
    setBizActioning(true);
    try {
      if (bizActionType === "flag") {
        await adminApi.flagBusiness(bizActionTarget.id, bizActionReason.trim());
      } else {
        await adminApi.revokeStamp(bizActionTarget.id, bizActionReason.trim());
      }
      setBizActionTarget(null);
      setBizActionType(null);
      setBizActionReason("");
      loadTab("businesses");
    } catch (err: any) {
      setError(err.message ?? "Action failed.");
    } finally {
      setBizActioning(false);
    }
  };

  const handleCreateAlert = async () => {
    if (!alertForm.title || !alertForm.description || !alertForm.date) return;
    setCreatingAlert(true);
    try {
      await adminApi.createScamAlert(alertForm);
      setShowAlertModal(false);
      setAlertForm({
        title: "", alert_type: "Other", description: "", location: "", date: "",
      });
      loadTab("alerts");
    } catch (err: any) {
      setError(err.message ?? "Failed to create alert.");
    } finally {
      setCreatingAlert(false);
    }
  };

  const filteredBusinesses = businesses.filter((b) =>
    bizSearch
      ? b.name.toLowerCase().includes(bizSearch.toLowerCase()) ||
        b.handle.toLowerCase().includes(bizSearch.toLowerCase())
      : true
  );

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
          onClick={() => { authApi.logout(); window.location.href = "/business-portal"; }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#fce4ec", color: "#c0392b" }}>
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl"
        style={{ background: "#f4f6fb", border: "1px solid #e0e4ed" }}>
        {([
          { key: "applications", label: "Applications",  icon: <FileText className="w-4 h-4" /> },
          { key: "reports",      label: "Fraud Reports", icon: <Flag className="w-4 h-4" /> },
          { key: "businesses",   label: "Businesses",    icon: <Users className="w-4 h-4" /> },
          { key: "alerts",       label: "Scam Alerts",   icon: <Bell className="w-4 h-4" /> },
        ] as const).map((tab) => (
          <button key={tab.key}
            onClick={() => loadTab(
              tab.key, reportStatusFilter, reportSeverityFilter, appStatusFilter
            )}
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

      {/* ── Tab 1: Applications ────────────────────────────────────────── */}
      {!loading && activeTab === "applications" && (
        <div>
          {/* Status filter */}
          <div className="flex gap-3 mb-4 flex-wrap items-center">
            <select
              value={appStatusFilter}
              onChange={(e) => setAppStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: "1px solid #e0e4ed", background: "#fff", color: "#1a2f5e" }}>
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="issued">Issued</option>
            </select>
            <p className="text-sm" style={{ color: "#9aa3b5" }}>
              {applications.length} application{applications.length !== 1 ? "s" : ""}
            </p>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-12 rounded-xl"
              style={{ background: "#fff", border: "1px solid #e0e4ed", color: "#9aa3b5" }}>
              No applications found.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {applications.map((app) => (
                <div key={app.id}>

                  {/* Application card */}
                  <div className="rounded-xl p-4"
                    style={{
                      background: "#fff",
                      border: "1px solid #e0e4ed",
                      borderBottomLeftRadius: detailApp?.id === app.id ? 0 : undefined,
                      borderBottomRightRadius: detailApp?.id === app.id ? 0 : undefined,
                    }}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">

                      {/* Info */}
                      <div>
                        <p style={{ fontWeight: 700, color: "#1a2f5e" }}>
                          {app.reference_number || `#${app.id}`}
                        </p>
                        <p style={{ fontSize: "0.78rem", color: "#9aa3b5" }}>
                          {app.applicant_name} · {app.stamp_type_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                            style={{
                              background: `${STATUS_COLOR[app.status] ?? "#9aa3b5"}18`,
                              color: STATUS_COLOR[app.status] ?? "#9aa3b5",
                            }}>
                            {app.status.replace("_", " ")}
                          </span>
                          <span className="text-xs" style={{ color: "#9aa3b5" }}>
                            {app.fee_paid ? "✓ Fee paid" : "⚠ Fee pending"}
                          </span>
                          {app.submitted_at && (
                            <span className="text-xs" style={{ color: "#9aa3b5" }}>
                              {new Date(app.submitted_at).toLocaleDateString("en-KE")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 flex-wrap">

                        {/* View — always */}
                        <button
                          onClick={() => handleViewDetail(app)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold"
                          style={{ background: "#e8eaf6", color: "#1a2f5e" }}>
                          <Eye className="w-3.5 h-3.5" />
                          {detailApp?.id === app.id ? "Close" : "View"}
                        </button>

                        {/* Start Review — submitted only */}
                        {app.status === "submitted" && (
                          <button
                            onClick={() => handleStartReview(app)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                            style={{ background: "#1565c0" }}>
                            <Search className="w-3.5 h-3.5" /> Start Review
                          </button>
                        )}

                        {/* Approve — under_review only */}
                        {app.status === "under_review" && (
                          <button
                            onClick={() => {
                              setActionTarget(app);
                              setActionType("approve");
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                            style={{ background: "#2e7d32" }}>
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}

                        {/* Reject — submitted or under_review */}
                        {["submitted", "under_review"].includes(app.status) && (
                          <button
                            onClick={() => {
                              setActionTarget(app);
                              setActionType("reject");
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                            style={{ background: "#c0392b" }}>
                            <AlertTriangle className="w-3.5 h-3.5" /> Reject
                          </button>
                        )}

                        {/* Mark Paid — approved + fee pending */}
                        {app.status === "approved" && !app.fee_paid && (
                          <button
                            onClick={() => handleMarkPaid(app)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                            style={{ background: "#e67e22" }}>
                            💳 Mark Paid
                          </button>
                        )}

                        {/* Issue Stamp — approved + fee paid */}
                        {app.status === "approved" && app.fee_paid && (
                          <button
                            onClick={() => setIssueTarget(app)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                            style={{ background: "#1a2f5e" }}>
                            <Award className="w-3.5 h-3.5" /> Issue Stamp
                          </button>
                        )}

                      </div>
                    </div>
                  </div>

                  {/* Detail / audit log drawer */}
                  {detailApp?.id === app.id && (
                    <div className="rounded-b-xl px-4 pb-4"
                      style={{
                        background: "#f8f9fc",
                        border: "1px solid #e0e4ed",
                        borderTop: "none",
                      }}>
                      {loadingDetail ? (
                        <p className="py-4 text-sm" style={{ color: "#9aa3b5" }}>
                          Loading…
                        </p>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3 py-3">
                            {[
                              ["Purpose",        detailApp.purpose],
                              ["Notes",          detailApp.notes || "—"],
                              ["Fee Amount",     `KES ${detailApp.fee_amount}`],
                              ["Payment Ref",    detailApp.payment_reference || "—"],
                              ["Reviewed By",    detailApp.reviewed_by || "—"],
                              ["Decision Notes", detailApp.decision_notes || "—"],
                            ].map(([k, v]) => (
                              <div key={k}>
                                <p style={{ fontSize: "0.68rem", color: "#9aa3b5" }}>{k}</p>
                                <p style={{
                                  fontSize: "0.78rem", color: "#1a2f5e",
                                  fontWeight: 600, wordBreak: "break-word",
                                }}>
                                  {v}
                                </p>
                              </div>
                            ))}
                          </div>

                          {auditLog.length > 0 && (
                            <div className="mt-2">
                              <p style={{
                                fontSize: "0.72rem", fontWeight: 700,
                                color: "#9aa3b5", marginBottom: 6,
                              }}>
                                AUDIT TRAIL
                              </p>
                              {auditLog.map((log) => (
                                <div key={log.id}
                                  className="py-1.5 border-b last:border-b-0"
                                  style={{ borderColor: "#e0e4ed" }}>
                                  <p style={{
                                    fontSize: "0.75rem", color: "#1a2f5e", fontWeight: 600,
                                  }}>
                                    {log.action.replace(/_/g, " ")}
                                    {log.old_value && log.new_value &&
                                      ` · ${log.old_value} → ${log.new_value}`}
                                  </p>
                                  <p style={{ fontSize: "0.68rem", color: "#9aa3b5" }}>
                                    {log.performed_by} ·{" "}
                                    {new Date(log.timestamp).toLocaleString("en-KE")}
                                    {log.note ? ` · ${log.note}` : ""}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

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
            <select value={reportStatusFilter}
              onChange={(e) => setReportStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: "1px solid #e0e4ed", background: "#fff", color: "#1a2f5e" }}>
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
            <select value={reportSeverityFilter}
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
                        Business ID: {r.business} · {r.location}
                      </p>
                      <p style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>
                        {new Date(r.created_at).toLocaleDateString("en-KE")}
                        {r.is_anonymous ? " · Anonymous" : ""}
                      </p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                          style={{
                            background: `${SEVERITY_COLOR[r.severity_category]}18`,
                            color: SEVERITY_COLOR[r.severity_category],
                          }}>
                          {r.severity_category} (score: {r.severity_score})
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                          style={{
                            background: `${STATUS_COLOR[r.status] ?? "#9aa3b5"}18`,
                            color: STATUS_COLOR[r.status] ?? "#9aa3b5",
                          }}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {r.status !== "resolved" && (
                        <button onClick={() => handleResolveReport(r.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold"
                          style={{ background: "#e8f5e9", color: "#2e7d32" }}>
                          <CheckCircle className="w-3.5 h-3.5" /> Resolve
                        </button>
                      )}
                      <button onClick={() => handleDeleteReport(r.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold"
                        style={{ background: "#fce4ec", color: "#c0392b" }}>
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Businesses ──────────────────────────────────────────── */}
      {!loading && activeTab === "businesses" && (
        <div>
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "#9aa3b5" }} />
              <input
                type="text" value={bizSearch}
                onChange={(e) => setBizSearch(e.target.value)}
                placeholder="Search by name or handle…"
                className="w-full pl-9 pr-3 py-2 rounded-lg outline-none text-sm"
                style={{ border: "1px solid #e0e4ed", background: "#fff", color: "#1a2f5e" }}
              />
            </div>
            <p className="self-center text-sm shrink-0" style={{ color: "#9aa3b5" }}>
              {filteredBusinesses.length} business{filteredBusinesses.length !== 1 ? "es" : ""}
            </p>
          </div>

          {filteredBusinesses.length === 0 ? (
            <div className="text-center py-12 rounded-xl"
              style={{ background: "#fff", border: "1px solid #e0e4ed", color: "#9aa3b5" }}>
              No businesses found.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredBusinesses.map((biz) => (
                <div key={biz.id} className="rounded-xl p-4"
                  style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <p style={{ fontWeight: 700, color: "#1a2f5e" }}>{biz.name}</p>
                      <p style={{ fontSize: "0.78rem", color: "#9aa3b5" }}>
                        {biz.handle} · {biz.county} · {biz.category}
                      </p>
                      <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                        style={{
                          background: biz.badge === "verified" ? "#e8f5e9" : "#f4f6fb",
                          color:      biz.badge === "verified" ? "#2e7d32" : "#9aa3b5",
                        }}>
                        {biz.badge}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setBizActionTarget(biz);
                          setBizActionType("flag");
                          setBizActionReason("");
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold"
                        style={{ background: "#fff3e0", color: "#e67e22" }}>
                        <Flag className="w-3.5 h-3.5" /> Flag
                      </button>
                      {biz.badge === "verified" && (
                        <button
                          onClick={() => {
                            setBizActionTarget(biz);
                            setBizActionType("revoke");
                            setBizActionReason("");
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold"
                          style={{ background: "#fce4ec", color: "#c0392b" }}>
                          <RotateCcw className="w-3.5 h-3.5" /> Revoke Stamp
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 4: Scam Alerts ─────────────────────────────────────────── */}
      {!loading && activeTab === "alerts" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm" style={{ color: "#9aa3b5" }}>
              {scamAlerts.length} active alert{scamAlerts.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => setShowAlertModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white"
              style={{ background: "#1a2f5e" }}>
              + New Alert
            </button>
          </div>

          {scamAlerts.length === 0 ? (
            <div className="text-center py-12 rounded-xl"
              style={{ background: "#fff", border: "1px solid #e0e4ed", color: "#9aa3b5" }}>
              No active scam alerts.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {scamAlerts.map((alert) => (
                <div key={alert.id} className="rounded-xl p-4"
                  style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p style={{ fontWeight: 700, color: "#1a2f5e", fontSize: "0.88rem" }}>
                        {alert.title}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#9aa3b5" }}>
                        {alert.type} · {alert.location} · {alert.date}
                      </p>
                      <p style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: 4 }}>
                        {alert.description}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: "#e8f5e9", color: "#2e7d32" }}>
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Issue Stamp ─────────────────────────────────────────── */}
      {issueTarget && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="rounded-xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: "#fff" }}>
            <h3 style={{ color: "#1a2f5e", fontWeight: 700, marginBottom: 12 }}>
              🏷 Issue Digital Stamp
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: 16 }}>
              {issueTarget.reference_number} — {issueTarget.applicant_name}
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1a2f5e" }}>
                  Issued By
                </label>
                <input value={issueIssuedBy}
                  onChange={(e) => setIssueIssuedBy(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg outline-none text-sm"
                  style={{ border: "1px solid #e0e4ed" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1a2f5e" }}>
                  Valid From *
                </label>
                <input type="date" value={issueValidFrom}
                  onChange={(e) => setIssueValidFrom(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg outline-none text-sm"
                  style={{ border: "1px solid #e0e4ed" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1a2f5e" }}>
                  Valid Until (optional)
                </label>
                <input type="date" value={issueValidUntil}
                  onChange={(e) => setIssueValidUntil(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg outline-none text-sm"
                  style={{ border: "1px solid #e0e4ed" }} />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setIssueTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "#f4f6fb", color: "#6b7280" }}>
                Cancel
              </button>
              <button onClick={handleIssueStamp}
                disabled={issuing || !issueValidFrom}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white"
                style={{ background: "#1a2f5e", opacity: issuing ? 0.6 : 1 }}>
                {issuing ? "Issuing…" : "Issue Stamp"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Issued Credentials ──────────────────────────────────── */}
      {issuedCredentials && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="rounded-xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: "#fff" }}>
            <h3 style={{ color: "#1a2f5e", fontWeight: 700, marginBottom: 4 }}>
              ✅ Stamp Issued — Portal Account Created
            </h3>
            <p style={{
              fontSize: "0.82rem", color: "#e67e22",
              fontWeight: 600, marginBottom: 16,
            }}>
              ⚠️ Save these credentials now. The password will NOT be shown again.
            </p>
            <div className="rounded-lg p-4 flex flex-col gap-3"
              style={{ background: "#f8f9fc", border: "1px solid #e0e4ed" }}>
              {[
                ["Stamp Number",      issuedCredentials.stamp],
                ["Portal Username",   issuedCredentials.username],
                ["One-Time Password", issuedCredentials.one_time_password],
              ].map(([label, value]) => (
                <div key={label}>
                  <p style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>{label}</p>
                  <p style={{
                    fontSize: "0.95rem", fontWeight: 800, color: "#1a2f5e",
                    fontFamily: "monospace", letterSpacing: "0.05em",
                  }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 12 }}>
              The business has also received these credentials by email.
              They can log in at <strong>/business-portal</strong> and change
              their password under Settings.
            </p>
            <button
              onClick={() => setIssuedCredentials(null)}
              className="w-full mt-4 py-2 rounded-lg font-bold text-white"
              style={{ background: "#1a2f5e" }}>
              I have recorded these credentials
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Flag / Revoke Business ──────────────────────────────── */}
      {bizActionTarget && bizActionType && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="rounded-xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: "#fff" }}>
            <h3 style={{ color: "#1a2f5e", fontWeight: 700, marginBottom: 12 }}>
              {bizActionType === "flag" ? "⚠️ Flag Business" : "🔄 Revoke Stamp"}
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: 12 }}>
              {bizActionTarget.name} ({bizActionTarget.handle})
            </p>
            <textarea value={bizActionReason}
              onChange={(e) => setBizActionReason(e.target.value)}
              rows={3} placeholder="Reason…"
              className="w-full px-3 py-2 rounded-lg outline-none resize-none mb-4"
              style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem" }} />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setBizActionTarget(null);
                  setBizActionType(null);
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "#f4f6fb", color: "#6b7280" }}>
                Cancel
              </button>
              <button onClick={handleBizAction}
                disabled={bizActioning || !bizActionReason.trim()}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white"
                style={{
                  background: bizActionType === "flag" ? "#e67e22" : "#c0392b",
                  opacity: bizActioning ? 0.6 : 1,
                }}>
                {bizActioning
                  ? "Processing…"
                  : bizActionType === "flag" ? "Confirm Flag" : "Confirm Revoke"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Approve / Reject ────────────────────────────────────── */}
      {actionTarget && actionType && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="rounded-xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: "#fff" }}>
            <h3 style={{ color: "#1a2f5e", fontWeight: 700, marginBottom: 12 }}>
              {actionType === "approve"
                ? "✅ Approve Application"
                : "❌ Reject Application"}
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: 12 }}>
              {actionTarget.reference_number} — {actionTarget.applicant_name}
            </p>
            <textarea value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              rows={3}
              placeholder={
                actionType === "approve"
                  ? "Decision notes (optional)…"
                  : "Rejection reason…"
              }
              className="w-full px-3 py-2 rounded-lg outline-none resize-none mb-4"
              style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem" }} />
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
              <button onClick={handleApplicationAction} disabled={actioning}
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

      {/* ── Modal: Create Scam Alert ───────────────────────────────────── */}
      {showAlertModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="rounded-xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: "#fff" }}>
            <h3 style={{ color: "#1a2f5e", fontWeight: 700, marginBottom: 16 }}>
              🚨 New Scam Alert
            </h3>
            <div className="flex flex-col gap-3">
              <input value={alertForm.title}
                onChange={(e) => setAlertForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Alert title *"
                className="w-full px-3 py-2 rounded-lg outline-none text-sm"
                style={{ border: "1px solid #e0e4ed" }} />
              <select value={alertForm.alert_type}
                onChange={(e) => setAlertForm((f) => ({ ...f, alert_type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg outline-none text-sm"
                style={{ border: "1px solid #e0e4ed", background: "#fff" }}>
                {ALERT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea value={alertForm.description}
                onChange={(e) => setAlertForm((f) => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Description *"
                className="w-full px-3 py-2 rounded-lg outline-none resize-none text-sm"
                style={{ border: "1px solid #e0e4ed" }} />
              <input value={alertForm.location}
                onChange={(e) => setAlertForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Location (optional)"
                className="w-full px-3 py-2 rounded-lg outline-none text-sm"
                style={{ border: "1px solid #e0e4ed" }} />
              <input type="date" value={alertForm.date}
                onChange={(e) => setAlertForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg outline-none text-sm"
                style={{ border: "1px solid #e0e4ed" }} />
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setShowAlertModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "#f4f6fb", color: "#6b7280" }}>
                Cancel
              </button>
              <button onClick={handleCreateAlert}
                disabled={
                  creatingAlert ||
                  !alertForm.title ||
                  !alertForm.description ||
                  !alertForm.date
                }
                className="px-4 py-2 rounded-lg text-sm font-bold text-white"
                style={{ background: "#1a2f5e", opacity: creatingAlert ? 0.6 : 1 }}>
                {creatingAlert ? "Publishing…" : "Publish Alert"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
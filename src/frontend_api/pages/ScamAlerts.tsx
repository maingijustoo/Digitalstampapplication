import { useState, useEffect } from "react";
import { Bell, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { scamAlertApi, fraudReportApi, type ScamAlert, type FraudReport } from "../../frontend_api/api";

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  "Investment Scam":  { bg: "#fce4ec", color: "#c0392b" },
  "M-Pesa Fraud":     { bg: "#fff3e0", color: "#e67e22" },
  "Online Shopping":  { bg: "#e3f2fd", color: "#1565c0" },
  "Job Scam":         { bg: "#f3e5f5", color: "#6a1b9a" },
  "Romance Scam":     { bg: "#fce4ec", color: "#ad1457" },
  "Crypto Fraud":     { bg: "#e8f5e9", color: "#2e7d32" },
  "Phishing":         { bg: "#fff8e1", color: "#f57f17" },
  "Other":            { bg: "#f4f6fb", color: "#9aa3b5" },
};

function AlertCard({ alert }: { alert: ScamAlert }) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_COLORS[alert.type] ?? TYPE_COLORS["Other"];

  return (
    <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
      <div className="flex items-start gap-4 p-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
          <AlertTriangle className="w-5 h-5" style={{ color: meta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 style={{ fontWeight: 700, color: "#1a2f5e", fontSize: "0.9rem" }}>{alert.title}</h3>
            <span style={{ fontSize: "0.68rem", fontWeight: 700, background: meta.bg, color: meta.color, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
              {alert.type}
            </span>
          </div>
          <div className="flex gap-3 mt-1 flex-wrap">
            <span style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>
              📅 {new Date(alert.date).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            {alert.location && (
              <span style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>📍 {alert.location}</span>
            )}
          </div>
          {expanded && (
            <p className="mt-3" style={{ fontSize: "0.82rem", color: "#4b5563", lineHeight: 1.6 }}>
              {alert.description}
            </p>
          )}
        </div>
        <button onClick={() => setExpanded((v) => !v)} className="shrink-0 p-1 rounded hover:bg-gray-100 transition-colors">
          {expanded ? <ChevronUp className="w-4 h-4" style={{ color: "#9aa3b5" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#9aa3b5" }} />}
        </button>
      </div>
    </div>
  );
}

export function ScamAlerts() {
  const [alerts, setAlerts]       = useState<ScamAlert[]>([]);
  const [reports, setReports]     = useState<FraudReport[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [alertRes, reportRes] = await Promise.all([
          scamAlertApi.list(),
          fraudReportApi.list(),
        ]);
        setAlerts(alertRes.results);
        setReports(reportRes.results);
      } catch (e: any) {
        setError("Could not load data. Make sure Django is running on http://localhost:8000");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const alertTypes = [...new Set(alerts.map((a) => a.type))];
  const filteredAlerts = typeFilter ? alerts.filter((a) => a.type === typeFilter) : alerts;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: "#e74c3c" }} />
        <h1 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.6rem" }}>Scam Alerts</h1>
        <p className="mt-2" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
          Stay informed about the latest fraud schemes targeting Kenyan consumers.
        </p>
      </div>

      {error && (
        <div className="rounded-lg p-3 mb-6 text-sm" style={{ background: "#fce4ec", color: "#c0392b", border: "1px solid #e74c3c" }}>
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "0.9rem", letterSpacing: "0.06em" }}>
              OFFICIAL KCPP ALERTS {!loading && `(${filteredAlerts.length})`}
            </h2>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm px-3 py-1.5 rounded-lg outline-none"
              style={{ border: "1px solid #e0e4ed", background: "#fff", color: "#1a2f5e" }}>
              <option value="">All types</option>
              {alertTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="rounded-xl h-20 animate-pulse" style={{ background: "#f4f6fb" }} />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "#9aa3b5" }}>No alerts found.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
            </div>
          )}
        </div>

        {/* Sidebar: recent public reports */}
        <div>
          <h2 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "0.9rem", letterSpacing: "0.06em", marginBottom: 12 }}>
            RECENT PUBLIC REPORTS
          </h2>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="rounded-xl h-16 animate-pulse" style={{ background: "#f4f6fb" }} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reports.slice(0, 8).map((r) => (
                <div key={r.id} className="p-3 rounded-xl" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#1a2f5e" }}>{r.business}</span>
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 700, padding: "1px 6px", borderRadius: 999,
                      background: r.severity === "high" ? "#fce4ec" : r.severity === "medium" ? "#fff3e0" : "#e8f5e9",
                      color:      r.severity === "high" ? "#c0392b" : r.severity === "medium" ? "#e67e22" : "#27ae60",
                    }}>
                      {r.severity.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.72rem", color: "#4b5563" }}>{r.type}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p style={{ fontSize: "0.68rem", color: "#9aa3b5" }}>{r.location?.split(",")[0]}</p>
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 600, padding: "1px 6px", borderRadius: 999,
                      background: r.status === "resolved" ? "#e8f5e9" : r.status === "investigating" ? "#e3f2fd" : "#fff3e0",
                      color:      r.status === "resolved" ? "#27ae60"  : r.status === "investigating" ? "#1565c0"  : "#e67e22",
                    }}>
                      {r.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <a href="/report-fraud"
            className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: "#e74c3c" }}>
            🚩 Report a Fraud
          </a>
        </div>
      </div>
    </div>
  );
}

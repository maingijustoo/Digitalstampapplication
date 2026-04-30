import { useState } from "react";
import { Bell, AlertTriangle, Search, Filter, Users } from "lucide-react";
import { scamAlerts, fraudReports } from "../data/mockData";
import { Link } from "react-router";

export function ScamAlerts() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const types = ["all", ...Array.from(new Set(scamAlerts.map((s) => s.type)))];

  const filtered = scamAlerts.filter((s) => {
    const matchSearch = s.description.toLowerCase().includes(search.toLowerCase()) || s.type.toLowerCase().includes(search.toLowerCase()) || s.location.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || s.type === filter;
    return matchSearch && matchFilter;
  });

  const severityColor = (count: number) => {
    if (count >= 100) return "#e74c3c";
    if (count >= 30) return "#e67e22";
    return "#f39c12";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Bell className="w-6 h-6" style={{ color: "#e74c3c" }} />
        <h1 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.4rem" }}>Scam Alerts</h1>
      </div>
      <p className="mb-6" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
        Stay informed about the latest fraud schemes and scams reported across Kenya.
      </p>

      {/* Summary Banner */}
      <div
        className="grid grid-cols-3 gap-4 p-5 rounded-xl mb-6"
        style={{ background: "linear-gradient(135deg, #1a2f5e 0%, #2563eb 100%)" }}
      >
        {[
          { label: "Active Alerts", value: scamAlerts.length, icon: "🚨" },
          { label: "Total Reports", value: fraudReports.length, icon: "📋" },
          { label: "Consumers Affected", value: scamAlerts.reduce((a, s) => a + s.affectedCount, 0).toLocaleString(), icon: "👥" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <p style={{ fontWeight: 800, fontSize: "1.3rem", color: "#fff" }}>{s.value}</p>
            <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9aa3b5" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alerts..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg outline-none"
            style={{ background: "#fff", border: "1px solid #e0e4ed", fontSize: "0.88rem", color: "#1a2f5e" }}
          />
        </div>
        <div className="flex gap-2 items-center">
          <Filter className="w-4 h-4 shrink-0" style={{ color: "#9aa3b5" }} />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg outline-none"
            style={{ background: "#fff", border: "1px solid #e0e4ed", fontSize: "0.88rem", color: "#1a2f5e", minWidth: 160 }}
          >
            {types.map((t) => (
              <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="flex flex-col gap-4">
        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: "#9aa3b5" }}>
            No alerts found matching your search.
          </div>
        )}
        {filtered.map((alert) => (
          <div
            key={alert.id}
            className="rounded-xl p-5 shadow hover:shadow-md transition-all"
            style={{
              background: "#fff",
              border: `2px solid ${severityColor(alert.affectedCount)}`,
              borderLeft: `5px solid ${severityColor(alert.affectedCount)}`,
            }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 shrink-0" style={{ color: severityColor(alert.affectedCount) }} />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded"
                      style={{
                        background: severityColor(alert.affectedCount) + "20",
                        color: severityColor(alert.affectedCount),
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {alert.type.toUpperCase()}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#9aa3b5" }}>
                      {new Date(alert.date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#9aa3b5" }}>📍 {alert.location}</span>
                  </div>
                  <p className="mt-2" style={{ color: "#1a2f5e", fontWeight: 600, fontSize: "0.9rem" }}>
                    {alert.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" style={{ color: "#9aa3b5" }} />
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: severityColor(alert.affectedCount) }}>
                    {alert.affectedCount.toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: "0.68rem", color: "#9aa3b5" }}>consumers affected</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Latest Fraud Reports Table */}
      <div className="mt-8 rounded-xl shadow p-5" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "0.9rem", letterSpacing: "0.06em" }}>
            LATEST PUBLIC FRAUD REPORTS
          </h2>
          <span style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>Anonymized data</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e0e4ed" }}>
                {["Date", "Business", "Type", "Location", "Severity", "Status"].map((h) => (
                  <th key={h} className="text-left pb-2 pr-4" style={{ color: "#9aa3b5", fontWeight: 600, fontSize: "0.75rem" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fraudReports.map((report) => (
                <tr key={report.id} style={{ borderBottom: "1px solid #f0f2f6" }}>
                  <td className="py-2.5 pr-4" style={{ color: "#4b5563", whiteSpace: "nowrap" }}>
                    {new Date(report.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                  </td>
                  <td className="py-2.5 pr-4" style={{ color: "#1a2f5e", fontWeight: 600 }}>{report.business}</td>
                  <td className="py-2.5 pr-4" style={{ color: "#4b5563" }}>{report.type}</td>
                  <td className="py-2.5 pr-4" style={{ color: "#9aa3b5" }}>{report.location}</td>
                  <td className="py-2.5 pr-4">
                    <span
                      className="px-2 py-0.5 rounded"
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        background: report.severity === "high" ? "#fce4ec" : report.severity === "medium" ? "#fff3e0" : "#e8f5e9",
                        color: report.severity === "high" ? "#c0392b" : report.severity === "medium" ? "#e67e22" : "#27ae60",
                      }}
                    >
                      {report.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span
                      className="px-2 py-0.5 rounded"
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 600,
                        background: report.status === "resolved" ? "#e8f5e9" : report.status === "investigating" ? "#e3f2fd" : "#fff3e0",
                        color: report.status === "resolved" ? "#27ae60" : report.status === "investigating" ? "#1565c0" : "#e67e22",
                      }}
                    >
                      {report.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/report-fraud"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg"
          style={{ background: "#e74c3c", color: "#fff", fontWeight: 700 }}
        >
          <AlertTriangle className="w-4 h-4" /> Report a New Scam
        </Link>
      </div>
    </div>
  );
}

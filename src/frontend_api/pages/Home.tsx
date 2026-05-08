import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Search, Shield, Flag, Bell, QrCode, ChevronRight } from "lucide-react";
import { TrustBadge } from "../components/TrustBadge";

// ── API base (same as api.ts) ─────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

interface Business {
  id: number;
  name: string;
  handle: string;
  badge: "verified" | "pending" | "at-risk" | "flagged" | "unverified";
  category: string;
  county: string;
  verified_year: number | null;
}

interface FraudReport {
  id: number;
  business: string;
  type: string;
  severity: "low" | "medium" | "high";
  status: "pending" | "investigating" | "resolved";
  location: string;
  created_at: string;
}

interface ScamAlert {
  id: number;
  title: string;
  type: string;
  location: string;
  date: string;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export function Home() {
  const [query, setQuery]               = useState("");
  const navigate                        = useNavigate();

  // Live data from Django
  const [verifiedBiz, setVerifiedBiz]   = useState<Business[]>([]);
  const [atRiskBiz, setAtRiskBiz]       = useState<Business[]>([]);
  const [fraudReports, setFraudReports] = useState<FraudReport[]>([]);
  const [scamAlerts, setScamAlerts]     = useState<ScamAlert[]>([]);
  const [loading, setLoading]           = useState(true);
  const [apiError, setApiError]         = useState(false);

  useEffect(() => {
    async function loadAll() {
      try {
        const [bizRes, fraudRes, alertRes] = await Promise.all([
          apiFetch<{ results: Business[] }>("/businesses/"),
          apiFetch<{ results: FraudReport[] }>("/fraud-reports/"),
          apiFetch<{ results: ScamAlert[] }>("/scam-alerts/"),
        ]);
        setVerifiedBiz(bizRes.results.filter((b) => b.badge === "verified").slice(0, 4));
        setAtRiskBiz(bizRes.results.filter((b) => b.badge === "at-risk" || b.badge === "flagged").slice(0, 2));
        setFraudReports(fraudRes.results.slice(0, 5));
        setScamAlerts(alertRes.results.slice(0, 4));
      } catch {
        setApiError(true);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/verify?q=${encodeURIComponent(query)}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "#1a2f5e", minHeight: 340 }}>
        <img
          src="./assets/c8a95ca596d5865b03e368678081f90b7cb8b010.png"
          alt="KCPP background"
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-white mb-2"
            style={{ fontSize: "clamp(1.4rem, 4vw, 2.2rem)", fontWeight: 800, letterSpacing: "0.04em" }}>
            KENYAN CONSUMER PROTECTION PLATFORM (KCPP)
          </h1>
          <p className="text-white/60 mb-8" style={{ fontSize: "0.9rem" }}>
            Kenya's Consumer Protection Platform for digital commerce fraud prevention
          </p>
          <form onSubmit={handleSearch} className="flex max-w-xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#9aa3b5" }} />
              <input
                type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Verify a Business Name or URL (e.g., @UrbanTrendy, kili.co.ke)"
                className="w-full pl-12 pr-4 py-3 rounded-l-lg outline-none"
                style={{ background: "#fff", fontSize: "0.9rem", color: "#1a2f5e", border: "none" }}
              />
            </div>
            <button type="submit" className="px-5 py-3 rounded-r-lg flex items-center justify-center"
              style={{ background: "#d4a017", color: "#fff" }}>
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-5xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { to: "/verify",       icon: "🛡️", label: "Verified Businesses", desc: "Check if a business is KCPP verified before transacting",         border: "#2ecc71" },
            { to: "/report-fraud", icon: "🚨", label: "Report Fraud",         desc: "Report a suspicious business or scam to protect others",          border: "#e67e22" },
            { to: "/scam-alerts",  icon: "⚠️", label: "Latest Scam Alerts",  desc: "Stay updated on the latest fraud schemes in Kenya",               border: "#e74c3c" },
          ].map((card) => (
            <Link key={card.to} to={card.to}
              className="flex flex-col items-center justify-center text-center p-6 rounded-xl shadow-md hover:shadow-lg transition-all"
              style={{ background: "#fff", border: `2px solid ${card.border}` }}>
              <div className="text-4xl mb-3">{card.icon}</div>
              <h3 style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "0.95rem" }}>{card.label}</h3>
              <p className="mt-1" style={{ color: "#6b7280", fontSize: "0.78rem" }}>{card.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* API offline notice */}
      {apiError && !loading && (
        <div className="max-w-5xl mx-auto px-4 mt-6">
          <div className="rounded-lg p-3 text-sm text-center" style={{ background: "#fff3e0", border: "1px solid #e67e22", color: "#7d4e00" }}>
            ⚠️ Could not connect to backend. Make sure Django is running on{" "}
            <code className="font-mono">http://localhost:8000</code>
          </div>
        </div>
      )}

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Recently Verified */}
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "0.9rem", letterSpacing: "0.06em" }}>
              RECENTLY VERIFIED BUSINESSES
            </h2>
            <Link to="/verify" className="text-sm flex items-center gap-1" style={{ color: "#1a2f5e" }}>
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "#f4f6fb", height: 120 }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {verifiedBiz.map((biz) => (
                <Link key={biz.id} to={`/verify?q=${encodeURIComponent(biz.handle)}`}
                  className="flex flex-col items-center p-4 rounded-xl shadow hover:shadow-md transition-all"
                  style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
                  <TrustBadge type={biz.badge} size="md" showLabel={true} />
                  <p className="mt-3" style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1a2f5e" }}>{biz.name}</p>
                  <p style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>
                    KCPP VERIFIED {biz.verified_year ? `[${biz.verified_year}]` : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {/* At-Risk / Flagged */}
          <div className="flex items-center justify-between mt-6 mb-4">
            <h2 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "0.9rem", letterSpacing: "0.06em" }}>
              AT-RISK / FLAGGED BUSINESSES
            </h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1,2].map(i => <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "#fce4ec", height: 120 }} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {atRiskBiz.map((biz) => (
                <Link key={biz.id} to={`/verify?q=${encodeURIComponent(biz.handle)}`}
                  className="flex flex-col items-center p-4 rounded-xl shadow hover:shadow-md transition-all"
                  style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
                  <TrustBadge type={biz.badge} size="md" showLabel={true} />
                  <p className="mt-3" style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1a2f5e" }}>{biz.name}</p>
                  <p style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>
                    {biz.badge === "flagged" ? "⚠️ DO NOT TRANSACT" : "KCPP MONITORED"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Quick Search */}
          <div className="rounded-xl shadow p-4" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
            <h2 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "0.9rem", letterSpacing: "0.06em", marginBottom: 12 }}>
              QUICK SEARCH
            </h2>
            <form onSubmit={handleSearch} className="flex mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9aa3b5" }} />
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Business/URL"
                  className="w-full pl-9 pr-2 py-2 rounded outline-none"
                  style={{ background: "#f4f6fb", fontSize: "0.8rem", color: "#1a2f5e", border: "1px solid #e0e4ed" }} />
              </div>
            </form>
            {[
              { num: "1.", label: "VERIFY A BUSINESS", sub: "Search by name or handle", to: "/verify",         icon: <QrCode className="w-5 h-5" /> },
              { num: "2.", label: "REPORT A FRAUD",    sub: null,                       to: "/report-fraud",   icon: <Flag className="w-5 h-5" /> },
              { num: "3.", label: "BUSINESS PORTAL",   sub: null,                       to: "/business-portal",icon: <Bell className="w-5 h-5" /> },
            ].map((item) => (
              <Link key={item.to} to={item.to}
                className="flex items-center gap-3 rounded-lg px-3 py-3 mb-2 transition-colors"
                style={{ background: "#1a2f5e", color: "#fff" }}>
                <span style={{ fontWeight: 800, fontSize: "0.95rem", minWidth: 24 }}>{item.num}</span>
                <div className="flex-1">
                  <p style={{ fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.04em" }}>{item.label}</p>
                  {item.sub && <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)" }}>{item.sub}</p>}
                </div>
                {item.icon}
              </Link>
            ))}
          </div>

          {/* Top Scams */}
          <div className="rounded-xl shadow p-4" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
            <h2 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "0.9rem", letterSpacing: "0.06em", marginBottom: 12 }}>
              TOP SCAMS (KENYA)
            </h2>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3,4].map(i => <div key={i} className="h-8 animate-pulse rounded" style={{ background: "#f4f6fb" }} />)}
              </div>
            ) : (
              <table className="w-full" style={{ fontSize: "0.72rem" }}>
                <thead>
                  <tr style={{ color: "#9aa3b5" }}>
                    <th className="text-left pb-2" style={{ fontWeight: 600 }}>Date</th>
                    <th className="text-left pb-2" style={{ fontWeight: 600 }}>Type</th>
                    <th className="text-left pb-2" style={{ fontWeight: 600 }}>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {scamAlerts.map((scam) => (
                    <tr key={scam.id} style={{ borderTop: "1px solid #f0f2f6" }}>
                      <td className="py-2 pr-2" style={{ color: "#1a2f5e", fontWeight: 600, borderLeft: "3px solid #e74c3c", paddingLeft: 6 }}>
                        {new Date(scam.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                      </td>
                      <td className="py-2 pr-2" style={{ color: "#4b5563" }}>{scam.type}</td>
                      <td className="py-2" style={{ color: "#9aa3b5" }}>{scam.location.split(",")[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <Link to="/scam-alerts" className="flex items-center gap-1 mt-3" style={{ color: "#1a2f5e", fontSize: "0.78rem", fontWeight: 600 }}>
              View all alerts <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Fraud Reports */}
      <section className="max-w-5xl mx-auto px-4 mt-6 mb-8">
        <div className="rounded-xl shadow p-5" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
          <div className="flex items-center justify-between mb-1">
            <h2 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "0.9rem", letterSpacing: "0.06em" }}>
              LATEST PUBLIC FRAUD REPORTS
            </h2>
            <Link to="/scam-alerts" className="text-sm flex items-center gap-1" style={{ color: "#1a2f5e" }}>
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <p style={{ color: "#9aa3b5", fontSize: "0.75rem" }} className="mb-4">Anonymized data</p>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-lg" style={{ background: "#f8f9fc" }} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {fraudReports.map((report) => (
                <div key={report.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "#f8f9fc" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "#e0e4ed" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.8rem", color: "#1a2f5e" }}>@</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#1a2f5e" }}>{report.business}</span>
                      <span className="px-2 py-0.5 rounded" style={{
                        fontSize: "0.68rem", fontWeight: 600,
                        background: report.severity === "high" ? "#fce4ec" : report.severity === "medium" ? "#fff3e0" : "#e8f5e9",
                        color:      report.severity === "high" ? "#c0392b" : report.severity === "medium" ? "#e67e22" : "#27ae60",
                      }}>
                        {report.severity.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "#4b5563" }}>{report.type}</p>
                    <p style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>Anonymized data</p>
                  </div>
                  <span className="px-2 py-0.5 rounded shrink-0" style={{
                    fontSize: "0.65rem", fontWeight: 600,
                    background: report.status === "resolved" ? "#e8f5e9" : report.status === "investigating" ? "#e3f2fd" : "#fff3e0",
                    color:      report.status === "resolved" ? "#27ae60"  : report.status === "investigating" ? "#1565c0"  : "#e67e22",
                  }}>
                    {report.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 text-center" style={{ background: "linear-gradient(135deg, #1a2f5e 0%, #2563eb 100%)" }}>
        <div className="max-w-2xl mx-auto px-4">
          <Shield className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <h2 className="text-white mb-2" style={{ fontWeight: 800, fontSize: "1.3rem" }}>
            Is Your Business KCPP Verified?
          </h2>
          <p className="text-white/70 mb-6" style={{ fontSize: "0.9rem" }}>
            Get your Digital Trust Stamp to build consumer confidence and protect your brand reputation.
          </p>
          <Link to="/apply-stamp"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-colors"
            style={{ background: "#d4a017", color: "#fff", fontWeight: 700 }}>
            <Shield className="w-5 h-5" />
            Apply for Digital Stamp
          </Link>
        </div>
      </section>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Search, CheckCircle, AlertTriangle, XCircle, Clock, HelpCircle } from "lucide-react";
import { TrustBadge } from "../components/TrustBadge";
import { businessApi, type Business } from "../../frontend_api/api";

const BADGE_META = {
  verified:   { icon: <CheckCircle className="w-5 h-5" />,   color: "#2ecc71", bg: "#e8f5e9", label: "KCPP Verified",    message: "This business has passed KCPP's verification process and is considered trustworthy." },
  pending:    { icon: <Clock className="w-5 h-5" />,          color: "#e67e22", bg: "#fff3e0", label: "Pending Review",   message: "This business has applied for KCPP verification and is currently under review." },
  "at-risk":  { icon: <AlertTriangle className="w-5 h-5" />,  color: "#e67e22", bg: "#fff3e0", label: "At Risk",          message: "This business has received complaints. Transact with caution." },
  flagged:    { icon: <XCircle className="w-5 h-5" />,        color: "#e74c3c", bg: "#fce4ec", label: "Flagged – Do Not Transact", message: "This business has been flagged for fraudulent activity. Do NOT transact." },
  unverified: { icon: <HelpCircle className="w-5 h-5" />,     color: "#9aa3b5", bg: "#f4f6fb", label: "Unverified",       message: "This business has not been verified by KCPP. Proceed with caution." },
};

export function VerifyBusiness() {
  const [searchParams] = useSearchParams();
  const [query, setQuery]         = useState(searchParams.get("q") ?? "");
  const [results, setResults]     = useState<Business[]>([]);
  const [searched, setSearched]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [selected, setSelected]   = useState<Business | null>(null);

  // Auto-search if ?q= param present on load
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) { setQuery(q); doSearch(q); }
  }, []);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(false);
    setSelected(null);
    try {
      const data = await businessApi.verify(q.trim());
      setResults(data);
      setSearched(true);
      if (data.length === 1) setSelected(data[0]);
    } catch (e: any) {
      setError("Could not connect to server. Make sure Django is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.6rem" }}>Verify a Business</h1>
        <p className="mt-2" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
          Search by business name, social media handle, or website URL.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex mb-8 shadow-md rounded-xl overflow-hidden">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#9aa3b5" }} />
          <input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., @UrbanTrendy, kili.co.ke, TechHub Kenya"
            className="w-full pl-12 pr-4 py-4 outline-none text-base"
            style={{ background: "#fff", color: "#1a2f5e", border: "none" }}
          />
        </div>
        <button type="submit" disabled={loading}
          className="px-6 py-4 font-bold text-white transition-colors"
          style={{ background: loading ? "#b8940f" : "#d4a017", border: "none" }}>
          {loading ? "Searching…" : "Verify"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg p-4 mb-6 text-sm" style={{ background: "#fce4ec", color: "#c0392b", border: "1px solid #e74c3c" }}>
          ⚠️ {error}
        </div>
      )}

      {/* No results */}
      {searched && results.length === 0 && !loading && (
        <div className="rounded-xl p-8 text-center shadow" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
          <HelpCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "#9aa3b5" }} />
          <h2 style={{ color: "#1a2f5e", fontWeight: 700 }}>No Results Found</h2>
          <p className="mt-2" style={{ color: "#6b7280", fontSize: "0.88rem" }}>
            "<strong>{query}</strong>" is not in the KCPP database.
            This could mean the business hasn't applied for verification yet.
          </p>
          <a href="/apply-stamp"
            className="inline-block mt-4 px-5 py-2 rounded-lg text-sm font-bold text-white"
            style={{ background: "#1a2f5e" }}>
            Apply for KCPP Stamp →
          </a>
        </div>
      )}

      {/* Multiple results list */}
      {searched && results.length > 1 && !selected && (
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: "#6b7280" }}>{results.length} results found. Select one to view details.</p>
          {results.map((biz) => {
            const meta = BADGE_META[biz.badge] ?? BADGE_META.unverified;
            return (
              <button key={biz.id} onClick={() => setSelected(biz)}
                className="flex items-center gap-4 p-4 rounded-xl text-left transition-shadow hover:shadow-md"
                style={{ background: "#fff", border: `2px solid ${meta.color}` }}>
                <TrustBadge type={biz.badge} size="md" showLabel={false} />
                <div className="flex-1">
                  <p style={{ fontWeight: 700, color: "#1a2f5e" }}>{biz.name}</p>
                  <p style={{ fontSize: "0.78rem", color: "#9aa3b5" }}>{biz.handle} · {biz.county}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: meta.bg, color: meta.color }}>
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Single result / selected detail */}
      {selected && (() => {
        const meta = BADGE_META[selected.badge] ?? BADGE_META.unverified;
        return (
          <div className="rounded-xl shadow-lg overflow-hidden" style={{ border: `2px solid ${meta.color}` }}>
            {/* Status banner */}
            <div className="px-6 py-4 flex items-center gap-3" style={{ background: meta.bg }}>
              <span style={{ color: meta.color }}>{meta.icon}</span>
              <div>
                <p style={{ fontWeight: 800, color: meta.color, fontSize: "1rem" }}>{meta.label}</p>
                <p style={{ fontSize: "0.8rem", color: "#4b5563" }}>{meta.message}</p>
              </div>
            </div>

            {/* Business details */}
            <div className="bg-white p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.3rem" }}>{selected.name}</h2>
                  <p style={{ color: "#9aa3b5", fontSize: "0.82rem" }}>{selected.handle}</p>
                </div>
                <TrustBadge type={selected.badge} size="lg" showLabel={true} />
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
                {[
                  ["Category",         selected.category     || "—"],
                  ["County",           selected.county       || "—"],
                  ["Website",          selected.website      || "—"],
                  ["Year Established", selected.year_established ? String(selected.year_established) : "—"],
                  ["Physical Address", selected.has_physical_address ? "Yes" : "No"],
                  ["KCPP Verified",    selected.verified_year ? `Yes (${selected.verified_year})` : "Not yet"],
                ].map(([k, v]) => (
                  <div key={k} className="py-1 border-b border-gray-50">
                    <p style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>{k}</p>
                    <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1a2f5e" }}>{v}</p>
                  </div>
                ))}
              </div>

              {selected.description && (
                <div className="mt-3 p-3 rounded-lg" style={{ background: "#f8f9fc" }}>
                  <p style={{ fontSize: "0.8rem", color: "#4b5563" }}>{selected.description}</p>
                </div>
              )}

              {/* Warning box for flagged */}
              {selected.badge === "flagged" && (
                <div className="mt-4 p-4 rounded-lg" style={{ background: "#fce4ec", border: "1px solid #e74c3c" }}>
                  <p style={{ color: "#c0392b", fontWeight: 700, fontSize: "0.85rem" }}>
                    ⛔ This business has been flagged for fraud. Do NOT make any payments or share personal information.
                  </p>
                  <a href="/report-fraud" className="inline-block mt-2 text-sm underline" style={{ color: "#c0392b" }}>
                    Report additional fraud →
                  </a>
                </div>
              )}

              {results.length > 1 && (
                <button onClick={() => setSelected(null)} className="mt-4 text-sm underline" style={{ color: "#9aa3b5" }}>
                  ← Back to results
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* How it works */}
      {!searched && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "🔍", title: "Search",  desc: "Enter any business name, handle, or website" },
            { icon: "📋", title: "Review",  desc: "See the KCPP verification status and details" },
            { icon: "✅", title: "Decide",  desc: "Transact confidently with verified businesses" },
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

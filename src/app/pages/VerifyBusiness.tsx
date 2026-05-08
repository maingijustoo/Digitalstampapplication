import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Search, CheckCircle, AlertTriangle, XCircle, Clock, ExternalLink, Phone, Globe, MapPin, Flag } from "lucide-react";
import { TrustBadge } from "../components/TrustBadge";
import { businesses } from "../data/mockData";
import type { Business } from "../data/mockData";
import { Link } from "react-router";

export function VerifyBusiness() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [searched, setSearched] = useState(!!searchParams.get("q"));
  const [result, setResult] = useState<Business | null | "not-found">(null);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      doSearch(q);
    }
  }, []);

  const doSearch = (q: string) => {
    const term = q.toLowerCase().replace("@", "").trim();
    const found = businesses.find(
      (b) =>
        b.name.toLowerCase().includes(term) ||
        b.handle.toLowerCase().replace("@", "").includes(term) ||
        (b.website && b.website.toLowerCase().includes(term))
    );
    setResult(found || "not-found");
    setSearched(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
    doSearch(query);
  };

  const badgeColor: Record<string, string> = {
    verified: "#2ecc71",
    "at-risk": "#e67e22",
    flagged: "#e74c3c",
    pending: "#95a5a6",
  };

  const badgeLabel: Record<string, string> = {
    verified: "TRUST VERIFIED",
    "at-risk": "AT RISK — Use caution",
    flagged: "FLAGGED — Do not transact",
    pending: "PENDING VERIFICATION",
  };

  const BadgeIcon: Record<string, React.ElementType> = {
    verified: CheckCircle,
    "at-risk": AlertTriangle,
    flagged: XCircle,
    pending: Clock,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="mb-2" style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.4rem" }}>
        Verify a Business
      </h1>
      <p className="mb-6" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
        Search a business name, social media handle, or website URL to check its KCPP verification status.
      </p>

      <form onSubmit={handleSearch} className="flex max-w-xl mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#9aa3b5" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search business name, @handle or URL..."
            className="w-full pl-12 pr-4 py-3 rounded-l-lg outline-none"
            style={{ background: "#fff", border: "2px solid #e0e4ed", color: "#1a2f5e", fontSize: "0.9rem" }}
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 rounded-r-lg transition-colors"
          style={{ background: "#1a2f5e", color: "#fff", fontWeight: 700 }}
        >
          Search
        </button>
      </form>

      {/* Results */}
      {searched && result === "not-found" && (
        <div className="rounded-xl p-6 text-center" style={{ background: "#fff", border: "2px solid #e0e4ed" }}>
          <XCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "#9aa3b5" }} />
          <h2 style={{ color: "#1a2f5e", fontWeight: 700 }}>Business Not Found in KCPP Registry</h2>
          <p className="mt-2" style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            "{query}" is not in our database. This may mean the business is not registered or has not applied for verification.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            <Link
              to="/report-fraud"
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: "#e74c3c", color: "#fff", fontWeight: 600 }}
            >
              Report this Business
            </Link>
            <button
              onClick={() => { setQuery(""); setSearched(false); setResult(null); }}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: "#f4f6fb", color: "#1a2f5e", fontWeight: 600 }}
            >
              Clear Search
            </button>
          </div>
        </div>
      )}

      {searched && result && result !== "not-found" && (() => {
        const biz = result as Business;
        const Icon = BadgeIcon[biz.badge];
        return (
          <div className="rounded-xl overflow-hidden shadow-lg" style={{ background: "#fff", border: `2px solid ${badgeColor[biz.badge]}` }}>
            {/* Status Banner */}
            <div
              className="px-6 py-3 flex items-center gap-2"
              style={{ background: badgeColor[biz.badge] }}
            >
              <Icon className="w-5 h-5 text-white" />
              <span className="text-white" style={{ fontWeight: 700, letterSpacing: "0.05em" }}>
                {badgeLabel[biz.badge]}
              </span>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-6 flex-wrap">
                {/* Badge */}
                <div className="flex-shrink-0">
                  <TrustBadge type={biz.badge} size="lg" showLabel={true} />
                </div>

                {/* Business Info */}
                <div className="flex-1 min-w-0">
                  <h2 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.3rem" }}>{biz.name}</h2>
                  <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>{biz.handle}</p>
                  <p className="mt-2" style={{ color: "#4b5563", fontSize: "0.9rem" }}>{biz.description}</p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 shrink-0" style={{ color: "#9aa3b5" }} />
                      <span style={{ fontSize: "0.82rem", color: "#4b5563" }}>{biz.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: "0.82rem", color: "#9aa3b5" }}>Category:</span>
                      <span style={{ fontSize: "0.82rem", color: "#4b5563" }}>{biz.category}</span>
                    </div>
                    {biz.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 shrink-0" style={{ color: "#9aa3b5" }} />
                        <a
                          href={`https://${biz.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:underline"
                          style={{ fontSize: "0.82rem", color: "#2563eb" }}
                        >
                          {biz.website} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {biz.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 shrink-0" style={{ color: "#9aa3b5" }} />
                        <span style={{ fontSize: "0.82rem", color: "#4b5563" }}>{biz.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-5 grid grid-cols-3 gap-3 pt-4" style={{ borderTop: "1px solid #f0f2f6" }}>
                <div className="text-center">
                  <p style={{ fontWeight: 800, fontSize: "1.4rem", color: badgeColor[biz.badge] }}>
                    {biz.badge === "verified" ? "✓" : biz.reports}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>
                    {biz.badge === "verified" ? "Verified" : "Fraud Reports"}
                  </p>
                </div>
                <div className="text-center">
                  <p style={{ fontWeight: 800, fontSize: "1rem", color: "#1a2f5e" }}>
                    {new Date(biz.verifiedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>Verified Date</p>
                </div>
                <div className="text-center">
                  <p style={{ fontWeight: 800, fontSize: "1rem", color: "#1a2f5e" }}>
                    {biz.category}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>Sector</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to={`/report-fraud?business=${encodeURIComponent(biz.name)}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{ background: "#fce4ec", color: "#c0392b", fontWeight: 600 }}
                >
                  <Flag className="w-4 h-4" /> Report this Business
                </Link>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Browse All Businesses */}
      {!searched && (
        <div>
          <h2 className="mb-4" style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "1rem" }}>
            Browse All Businesses
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {businesses.map((biz) => (
              <button
                key={biz.id}
                onClick={() => { setQuery(biz.handle); doSearch(biz.handle); setSearchParams({ q: biz.handle }); }}
                className="flex items-center gap-4 p-4 rounded-xl shadow hover:shadow-md transition-all text-left"
                style={{ background: "#fff", border: "1px solid #e0e4ed" }}
              >
                <TrustBadge type={biz.badge} size="sm" showLabel={false} />
                <div>
                  <p style={{ fontWeight: 700, color: "#1a2f5e", fontSize: "0.9rem" }}>{biz.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "#9aa3b5" }}>{biz.handle} · {biz.category}</p>
                  <p style={{ fontSize: "0.72rem", color: badgeColor[biz.badge], fontWeight: 600 }}>
                    {badgeLabel[biz.badge]}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

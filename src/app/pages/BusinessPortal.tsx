import { useState } from "react";
import { Link } from "react-router";
import { Shield, Eye, EyeOff, BarChart2, Flag, Bell, Award, LogIn } from "lucide-react";
import { TrustBadge } from "../components/TrustBadge";
import { fraudReports } from "../data/mockData";

export function BusinessPortal() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    // Mock login — any credentials work
    setLoggedIn(true);
    setError("");
  };

  if (!loggedIn) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12" style={{ background: "#f4f6fb" }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#1a2f5e" }}>
                <Shield className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.4rem" }}>Business Portal</h1>
            <p style={{ color: "#6b7280", fontSize: "0.88rem" }}>Login to manage your KCPP verification</p>
          </div>

          <div className="rounded-xl shadow-lg p-6" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="business@email.com"
                  className="w-full px-3 py-2.5 rounded-lg outline-none"
                  style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem", color: "#1a2f5e" }}
                />
              </div>
              <div>
                <label className="block mb-1" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a2f5e" }}>Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 pr-10 rounded-lg outline-none"
                    style={{ border: "1px solid #e0e4ed", fontSize: "0.88rem", color: "#1a2f5e" }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#9aa3b5" }}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p style={{ color: "#e74c3c", fontSize: "0.8rem" }}>{error}</p>}
              <button type="submit" className="w-full py-3 rounded-lg flex items-center justify-center gap-2" style={{ background: "#1a2f5e", color: "#fff", fontWeight: 700 }}>
                <LogIn className="w-4 h-4" /> Login to Portal
              </button>
            </form>
            <div className="mt-4 text-center">
              <p style={{ fontSize: "0.82rem", color: "#6b7280" }}>
                Don't have an account?{" "}
                <Link to="/apply-stamp" style={{ color: "#1a2f5e", fontWeight: 600 }}>Apply for Digital Stamp</Link>
              </p>
            </div>
          </div>

          <p className="mt-4 text-center" style={{ fontSize: "0.75rem", color: "#9aa3b5" }}>
            Demo: Use any email + password to log in
          </p>
        </div>
      </div>
    );
  }

  // Logged-in Dashboard
  const myReports = fraudReports.filter((_, i) => i < 3);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.3rem" }}>Business Dashboard</h1>
          <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>Welcome back, UrbanTrendy</p>
        </div>
        <div className="flex items-center gap-3">
          <TrustBadge type="verified" size="sm" showLabel={true} />
          <button
            onClick={() => setLoggedIn(false)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ background: "#f4f6fb", color: "#1a2f5e", fontWeight: 600, border: "1px solid #e0e4ed" }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto" style={{ borderBottom: "2px solid #e0e4ed" }}>
        {[
          { id: "dashboard", label: "Dashboard", icon: BarChart2 },
          { id: "reports", label: "Reports Against Us", icon: Flag },
          { id: "alerts", label: "My Alerts", icon: Bell },
          { id: "stamp", label: "My Stamp", icon: Award },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap transition-colors"
            style={{
              borderBottom: activeTab === id ? "2px solid #1a2f5e" : "2px solid transparent",
              color: activeTab === id ? "#1a2f5e" : "#9aa3b5",
              fontWeight: activeTab === id ? 700 : 400,
              marginBottom: -2,
            }}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Trust Score", value: "98/100", color: "#2ecc71", bg: "#e8f5e9" },
              { label: "Fraud Reports", value: "0", color: "#1a2f5e", bg: "#f4f6fb" },
              { label: "Profile Views", value: "1,247", color: "#2563eb", bg: "#e3f2fd" },
              { label: "Stamp Status", value: "ACTIVE", color: "#d4a017", bg: "#fff8e1" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl p-4 text-center" style={{ background: stat.bg, border: "1px solid #e0e4ed" }}>
                <p style={{ fontWeight: 800, fontSize: "1.4rem", color: stat.color }}>{stat.value}</p>
                <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
              <h3 style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "0.95rem", marginBottom: 12 }}>Quick Actions</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Download Trust Stamp Badge", desc: "Add to your website or social media", icon: "⬇️" },
                  { label: "Update Business Profile", desc: "Keep your information current", icon: "✏️" },
                  { label: "View Verification Certificate", desc: "Official KCPP certificate PDF", icon: "📄" },
                ].map((action) => (
                  <button key={action.label} className="flex items-center gap-3 p-3 rounded-lg text-left hover:bg-gray-50 transition-colors" style={{ border: "1px solid #e0e4ed" }}>
                    <span className="text-xl">{action.icon}</span>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#1a2f5e" }}>{action.label}</p>
                      <p style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>{action.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
              <h3 style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "0.95rem", marginBottom: 12 }}>Verification Timeline</h3>
              {[
                { date: "Jan 15, 2024", event: "Initial Application Submitted", status: "done" },
                { date: "Jan 18, 2024", event: "Documentation Review", status: "done" },
                { date: "Jan 22, 2024", event: "Background Check Completed", status: "done" },
                { date: "Jan 25, 2024", event: "Digital Stamp Issued", status: "done" },
                { date: "Jan 2025", event: "Annual Re-verification Due", status: "upcoming" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 mb-3">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ background: item.status === "done" ? "#2ecc71" : "#e0e4ed", border: item.status === "upcoming" ? "2px dashed #9aa3b5" : "none" }} />
                    {i < 4 && <div className="w-px flex-1 mt-1" style={{ background: "#e0e4ed" }} />}
                  </div>
                  <div className="pb-3">
                    <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "#1a2f5e" }}>{item.event}</p>
                    <p style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#e8f5e9" }}>
              <Flag className="w-5 h-5" style={{ color: "#2ecc71" }} />
            </div>
            <div>
              <h2 style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "1rem" }}>Reports Against Your Business</h2>
              <p style={{ color: "#6b7280", fontSize: "0.82rem" }}>No unresolved reports — your business maintains a clean record</p>
            </div>
          </div>
          <div className="rounded-xl p-6 text-center" style={{ background: "#fff", border: "2px solid #2ecc71" }}>
            <span className="text-4xl">🎉</span>
            <p className="mt-3" style={{ fontWeight: 700, color: "#1a2f5e" }}>Clean Record!</p>
            <p className="mt-1" style={{ color: "#6b7280", fontSize: "0.85rem" }}>No fraud reports have been filed against your business.</p>
          </div>
        </div>
      )}

      {activeTab === "alerts" && (
        <div>
          <h2 className="mb-4" style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "1rem" }}>My Alerts & Notifications</h2>
          <div className="flex flex-col gap-3">
            {[
              { icon: "✅", msg: "Your KCPP stamp has been renewed for 2025", time: "2 days ago", color: "#e8f5e9" },
              { icon: "👁️", msg: "Your profile was viewed 47 times this week", time: "1 week ago", color: "#e3f2fd" },
              { icon: "⚠️", msg: "Annual re-verification due in 60 days", time: "2 weeks ago", color: "#fff3e0" },
            ].map((alert, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: alert.color, border: "1px solid #e0e4ed" }}>
                <span className="text-xl">{alert.icon}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#1a2f5e" }}>{alert.msg}</p>
                  <p style={{ fontSize: "0.72rem", color: "#9aa3b5" }}>{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "stamp" && (
        <div>
          <h2 className="mb-4" style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "1rem" }}>My Digital Trust Stamp</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl p-6 flex flex-col items-center" style={{ background: "#fff", border: "2px solid #2ecc71" }}>
              <TrustBadge type="verified" size="lg" showLabel={true} />
              <h3 className="mt-4" style={{ color: "#1a2f5e", fontWeight: 700 }}>UrbanTrendy</h3>
              <p style={{ color: "#9aa3b5", fontSize: "0.8rem" }}>KCPP VERIFIED 2024</p>
              <p className="mt-2 px-3 py-1 rounded-full" style={{ background: "#e8f5e9", color: "#27ae60", fontSize: "0.78rem", fontWeight: 600 }}>
                ACTIVE · Expires Jan 2025
              </p>
              <button className="mt-4 px-5 py-2 rounded-lg text-sm" style={{ background: "#1a2f5e", color: "#fff", fontWeight: 700 }}>
                ⬇️ Download Badge
              </button>
            </div>

            <div className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
              <h3 style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "0.9rem", marginBottom: 12 }}>Embed Code</h3>
              <p style={{ color: "#6b7280", fontSize: "0.8rem", marginBottom: 8 }}>Add this trust badge to your website:</p>
              <pre className="p-3 rounded-lg overflow-x-auto" style={{ background: "#f4f6fb", fontSize: "0.68rem", color: "#1a2f5e", border: "1px solid #e0e4ed" }}>
{`<a href="https://kcpp.co.ke/verify?q=UrbanTrendy">
  <img 
    src="https://kcpp.co.ke/badges/verified.png"
    alt="KCPP Verified Business"
    width="120"
  />
</a>`}
              </pre>
              <h3 className="mt-4" style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "0.9rem", marginBottom: 8 }}>Certificate Details</h3>
              {[
                ["Business", "UrbanTrendy"],
                ["Issued", "January 25, 2024"],
                ["Valid Until", "January 25, 2025"],
                ["Certificate ID", "KCPP-CERT-2024-00127"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2 mb-1">
                  <span style={{ fontSize: "0.78rem", color: "#9aa3b5", minWidth: 100 }}>{k}:</span>
                  <span style={{ fontSize: "0.78rem", color: "#1a2f5e", fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

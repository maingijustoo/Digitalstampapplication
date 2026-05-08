import { Link } from "react-router";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer
      className="hidden md:block w-full py-8 mt-auto"
      style={{ background: "#1a2f5e", color: "#fff" }}
    >
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "#d4a017" }}
            >
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "0.08em" }}>KCPP</span>
          </div>
          <p className="text-white/60 text-sm max-w-xs">
            Kenyan Consumer Protection Platform — Protecting digital commerce from fraud since 2023.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-white/90" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
            QUICK LINKS
          </h4>
          <ul className="flex flex-col gap-2">
            {[
              { to: "/", label: "Home" },
              { to: "/about", label: "About KCPP" },
              { to: "/verify", label: "Verify Business" },
              { to: "/report-fraud", label: "Report Fraud" },
              { to: "/scam-alerts", label: "Scam Alerts" },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-white/60 hover:text-white text-sm transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-white/90" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
            FOR BUSINESSES
          </h4>
          <ul className="flex flex-col gap-2">
            {[
              { to: "/apply-stamp", label: "Apply for Digital Stamp" },
              { to: "/business-portal", label: "Business Portal" },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-white/60 hover:text-white text-sm transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-white/40 text-xs mt-6">© 2026 KCPP. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X, Shield } from "lucide-react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/report-fraud", label: "Report Fraud" },
  ];

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{ background: "#1a2f5e", boxShadow: "0 2px 12px rgba(0,0,0,0.18)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "#d4a017" }}
            >
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-white tracking-wide select-none"
              style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "0.08em" }}
            >
              KCPP
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-white/80 hover:text-white transition-colors text-sm relative pb-1"
                style={{
                  fontWeight: isActive(link.to) ? 600 : 400,
                  color: isActive(link.to) ? "#fff" : undefined,
                  borderBottom: isActive(link.to) ? "2px solid #d4a017" : "2px solid transparent",
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/business-portal"
              className="px-4 py-2 rounded text-sm transition-all"
              style={{
                background: "transparent",
                border: "2px solid #fff",
                color: "#fff",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "#fff";
                (e.currentTarget as HTMLAnchorElement).style.color = "#1a2f5e";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
              }}
            >
              BUSINESS LOGIN
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden px-4 pb-4 pt-2 flex flex-col gap-3"
          style={{ background: "#1a2f5e" }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-white/80 hover:text-white py-2 text-sm"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/business-portal"
            className="px-4 py-2 rounded text-sm text-center"
            style={{
              background: "#fff",
              color: "#1a2f5e",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
            onClick={() => setMobileOpen(false)}
          >
            BUSINESS LOGIN
          </Link>
        </div>
      )}
    </nav>
  );
}

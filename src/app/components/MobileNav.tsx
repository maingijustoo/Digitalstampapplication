import { Link, useLocation } from "react-router";
import { Home, Flag, Bell, User } from "lucide-react";

export function MobileNav() {
  const location = useLocation();

  const tabs = [
    { to: "/", label: "Home", icon: Home },
    { to: "/report-fraud", label: "Report", icon: Flag },
    { to: "/scam-alerts", label: "Alerts", icon: Bell },
    { to: "/business-portal", label: "Account", icon: User },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t"
      style={{ background: "#fff", borderColor: "#e0e4ed" }}
    >
      {tabs.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-colors"
            style={{ color: active ? "#1a2f5e" : "#9aa3b5" }}
          >
            <Icon className="w-5 h-5" />
            <span style={{ fontSize: "0.65rem", fontWeight: active ? 600 : 400 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

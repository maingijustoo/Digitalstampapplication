import { Link } from "react-router";
import { Shield } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <Shield className="w-16 h-16 mb-4" style={{ color: "#1a2f5e" }} />
      <h1 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "2rem" }}>404</h1>
      <p style={{ color: "#6b7280", fontSize: "1rem" }} className="mt-2">Page not found</p>
      <Link to="/" className="mt-6 px-6 py-3 rounded-lg" style={{ background: "#1a2f5e", color: "#fff", fontWeight: 700 }}>
        Back to Home
      </Link>
    </div>
  );
}

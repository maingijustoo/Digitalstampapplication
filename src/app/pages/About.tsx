import { Shield, Users, Search, Flag, Award, CheckCircle } from "lucide-react";
import { Link } from "react-router";

export function About() {
  return (
    <div>
      {/* Hero */}
      <section className="py-14 text-center px-4" style={{ background: "linear-gradient(135deg, #1a2f5e 0%, #2563eb 100%)" }}>
        <Shield className="w-14 h-14 mx-auto mb-4" style={{ color: "#d4a017" }} />
        <h1 className="text-white mb-3" style={{ fontWeight: 800, fontSize: "clamp(1.4rem, 4vw, 2rem)" }}>
          About KCPP
        </h1>
        <p className="text-white/70 max-w-2xl mx-auto" style={{ fontSize: "0.95rem" }}>
          The Kenyan Consumer Protection Platform is a digital infrastructure for verifying business legitimacy, reporting fraud, and protecting consumers across Kenya's growing digital economy.
        </p>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.3rem", marginBottom: 12 }}>Our Mission</h2>
            <p style={{ color: "#4b5563", fontSize: "0.9rem", lineHeight: 1.7 }}>
              Kenya's digital commerce ecosystem is growing rapidly — but so is online fraud. KCPP was founded to create a trustworthy, transparent registry of verified businesses so that consumers can shop, pay, and transact with confidence.
            </p>
            <p className="mt-4" style={{ color: "#4b5563", fontSize: "0.9rem", lineHeight: 1.7 }}>
              We combine community-driven fraud reporting with professional verification audits to ensure that every KCPP Digital Stamp represents a genuinely trustworthy business.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "1,200+", label: "Verified Businesses" },
              { value: "45K+", label: "Consumers Protected" },
              { value: "800+", label: "Fraud Reports Filed" },
              { value: "47", label: "Counties Covered" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl p-5 text-center" style={{ background: "#fff", border: "1px solid #e0e4ed" }}>
                <p style={{ fontWeight: 800, fontSize: "1.5rem", color: "#1a2f5e" }}>{stat.value}</p>
                <p style={{ fontSize: "0.75rem", color: "#9aa3b5" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4" style={{ background: "#f4f6fb" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center mb-8" style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.3rem" }}>
            How KCPP Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "1. Verify",
                desc: "Consumers search any business name, handle, or URL to instantly see its KCPP verification status before making payments.",
                color: "#e3f2fd",
                iconColor: "#1565c0",
              },
              {
                icon: Flag,
                title: "2. Report",
                desc: "If you encounter fraud, submit a report with evidence. Reports are reviewed by KCPP investigators and may lead to business de-listing.",
                color: "#fce4ec",
                iconColor: "#c0392b",
              },
              {
                icon: Award,
                title: "3. Certify",
                desc: "Legitimate businesses apply for the Digital Trust Stamp, undergo verification, and display their badge to build consumer confidence.",
                color: "#e8f5e9",
                iconColor: "#27ae60",
              },
            ].map(({ icon: Icon, title, desc, color, iconColor }) => (
              <div key={title} className="rounded-xl p-6" style={{ background: color }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "#fff" }}>
                  <Icon className="w-6 h-6" style={{ color: iconColor }} />
                </div>
                <h3 style={{ color: "#1a2f5e", fontWeight: 700, fontSize: "1rem", marginBottom: 8 }}>{title}</h3>
                <p style={{ color: "#4b5563", fontSize: "0.85rem", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Stamp Tiers */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-center mb-8" style={{ color: "#1a2f5e", fontWeight: 800, fontSize: "1.3rem" }}>
          Trust Stamp Levels
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { type: "VERIFIED", color: "#2ecc71", bg: "#e8f5e9", desc: "Fully vetted, clean business record, passed all KCPP audits" },
            { type: "AT RISK", color: "#e67e22", bg: "#fff3e0", desc: "Has unresolved reports or pending investigations. Use caution." },
            { type: "FLAGGED", color: "#e74c3c", bg: "#fce4ec", desc: "Confirmed fraudulent activity. Do not transact with this business." },
            { type: "PENDING", color: "#95a5a6", bg: "#f4f6fb", desc: "Application submitted, verification in progress." },
          ].map((tier) => (
            <div key={tier.type} className="rounded-xl p-5 text-center" style={{ background: tier.bg, border: `2px solid ${tier.color}` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: tier.color }}>
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <p style={{ fontWeight: 800, color: tier.color, fontSize: "0.85rem", letterSpacing: "0.06em" }}>{tier.type}</p>
              <p className="mt-2" style={{ fontSize: "0.75rem", color: "#4b5563", lineHeight: 1.5 }}>{tier.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team / Legal */}
      <section className="py-12 px-4" style={{ background: "#1a2f5e" }}>
        <div className="max-w-3xl mx-auto text-center">
          <Users className="w-10 h-10 mx-auto mb-4 text-white/60" />
          <h2 className="text-white mb-4" style={{ fontWeight: 800, fontSize: "1.2rem" }}>
            Backed by Consumer Rights Advocates
          </h2>
          <p className="text-white/60 mb-6" style={{ fontSize: "0.9rem" }}>
            KCPP operates in collaboration with consumer rights organizations, digital commerce regulators, and law enforcement bodies across Kenya to ensure robust fraud prevention.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/apply-stamp" className="px-6 py-3 rounded-lg" style={{ background: "#d4a017", color: "#fff", fontWeight: 700 }}>
              Apply for Verification
            </Link>
            <Link to="/report-fraud" className="px-6 py-3 rounded-lg" style={{ background: "transparent", color: "#fff", fontWeight: 700, border: "2px solid #fff" }}>
              Report Fraud
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

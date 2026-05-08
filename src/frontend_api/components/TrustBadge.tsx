import { Shield, Check, AlertTriangle, X } from "lucide-react";

type BadgeType = "verified" | "at-risk" | "flagged" | "pending";

interface TrustBadgeProps {
  type: BadgeType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const badgeConfig: Record<
  BadgeType,
  { bg: string; border: string; icon: React.ElementType; iconColor: string; label: string; banner: string; bannerBg: string }
> = {
  verified: {
    bg: "#1a2f5e",
    border: "#2ecc71",
    icon: Check,
    iconColor: "#2ecc71",
    label: "TRUST VERIFIED",
    banner: "TRUST\nVERIFIED",
    bannerBg: "#2ecc71",
  },
  "at-risk": {
    bg: "#1a2f5e",
    border: "#e67e22",
    icon: AlertTriangle,
    iconColor: "#e67e22",
    label: "AT RISK",
    banner: "TRUST\nBADIFIED",
    bannerBg: "#e67e22",
  },
  flagged: {
    bg: "#1a2f5e",
    border: "#e74c3c",
    icon: X,
    iconColor: "#e74c3c",
    label: "FLAGGED",
    banner: "TRUST\nFLAGGED",
    bannerBg: "#e74c3c",
  },
  pending: {
    bg: "#1a2f5e",
    border: "#95a5a6",
    icon: Shield,
    iconColor: "#95a5a6",
    label: "PENDING",
    banner: "TRUST\nPENDING",
    bannerBg: "#95a5a6",
  },
};

const sizeConfig = {
  sm: { shield: 48, fontSize: "0.45rem", iconSize: 14 },
  md: { shield: 72, fontSize: "0.6rem", iconSize: 20 },
  lg: { shield: 96, fontSize: "0.75rem", iconSize: 26 },
};

export function TrustBadge({ type, size = "md", showLabel = true }: TrustBadgeProps) {
  const cfg = badgeConfig[type];
  const sz = sizeConfig[size];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center" style={{ width: sz.shield, height: sz.shield }}>
        {/* Shield shape via SVG */}
        <svg viewBox="0 0 100 110" width={sz.shield} height={sz.shield}>
          <path
            d="M50 5 L90 20 L90 55 Q90 85 50 105 Q10 85 10 55 L10 20 Z"
            fill={cfg.bg}
            stroke={cfg.border}
            strokeWidth="4"
          />
        </svg>
        {/* Banner overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-white text-center"
          style={{ paddingTop: sz.shield * 0.2 }}
        >
          <cfg.icon style={{ width: sz.iconSize, height: sz.iconSize, color: cfg.iconColor }} />
          <div
            style={{
              fontSize: sz.fontSize,
              fontWeight: 700,
              lineHeight: 1.1,
              marginTop: 2,
              whiteSpace: "pre-line",
              color: "#fff",
            }}
          >
            {cfg.banner}
          </div>
        </div>
      </div>
      {showLabel && (
        <span
          className="px-2 py-0.5 rounded text-white"
          style={{
            background: cfg.bannerBg,
            fontSize: sz.fontSize,
            fontWeight: 700,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}
        >
          {cfg.label}
        </span>
      )}
    </div>
  );
}

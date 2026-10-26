import React from "react";

interface MansoobaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  className?: string;
  badge?: string;
}

const sizeMap = {
  sm: { icon: 22, text: "text-sm", gap: "gap-2" },
  md: { icon: 28, text: "text-base", gap: "gap-2.5" },
  lg: { icon: 38, text: "text-xl", gap: "gap-3" },
  xl: { icon: 50, text: "text-2xl", gap: "gap-3.5" },
};

export const MansoobaLogo: React.FC<MansoobaLogoProps> = ({
  size = "md",
  showWordmark = true,
  className = "",
  badge,
}) => {
  const currentSize = sizeMap[size];
  const px = currentSize.icon;

  return (
    <div
      className={`inline-flex items-center ${currentSize.gap} ${className} select-none`}
    >
      {/* ── Enterprise Geometric SVG Mark ── */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-b from-zinc-900 to-black p-1 border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
        style={{ width: px + 8, height: px + 8 }}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute inset-0 rounded-xl bg-indigo-500/20 blur-md -z-10" />

        <svg
          width={px}
          height={px}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Left Pillar: Deep Indigo to Violet */}
            <linearGradient
              id="m-grad-left"
              x1="4"
              y1="4"
              x2="14"
              y2="28"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>

            {/* Center Peak/Apex: Luminous Violet to Cyan */}
            <linearGradient
              id="m-grad-center"
              x1="10"
              y1="4"
              x2="22"
              y2="28"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>

            {/* Right Pillar: Electric Cyan to Indigo */}
            <linearGradient
              id="m-grad-right"
              x1="18"
              y1="4"
              x2="28"
              y2="28"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="m-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Left Wing / Pillar */}
          <path
            d="M 5 26 L 5 8 C 5 6.3 6.3 5 8 5 L 10 5 C 11.1 5 12 5.9 12 7 L 12 26 C 12 26.6 11.4 27 10.8 27 L 6.2 27 C 5.5 27 5 26.5 5 26 Z"
            fill="url(#m-grad-left)"
          />

          {/* Isometric Center Chevron (The dynamic 'M' fold) */}
          <path
            d="M 10 7 L 16 16.5 L 22 7 C 22.6 6.1 23.8 6.1 24.4 7 L 24.5 7.2 L 17.5 19 C 16.7 20.3 15.3 20.3 14.5 19 L 7.5 7.2 L 7.6 7 C 8.2 6.1 9.4 6.1 10 7 Z"
            fill="url(#m-grad-center)"
            filter="url(#m-glow)"
          />

          {/* Right Wing / Pillar */}
          <path
            d="M 20 7 C 20 5.9 20.9 5 22 5 L 24 5 C 25.7 5 27 6.3 27 8 L 27 26 C 27 26.5 26.5 27 25.8 27 L 21.2 27 C 20.6 27 20 26.6 20 26 L 20 7 Z"
            fill="url(#m-grad-right)"
          />

          {/* Core Milestone Gem (Small luminous diamond at the vertex) */}
          <polygon
            points="16,13 18.5,16.5 16,20 13.5,16.5"
            fill="#ffffff"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* ── Brand Wordmark ── */}
      {showWordmark && (
        <div className="flex items-center gap-2">
          <span
            className={`font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 ${currentSize.text}`}
          >
            Mansooba
          </span>
          {badge && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

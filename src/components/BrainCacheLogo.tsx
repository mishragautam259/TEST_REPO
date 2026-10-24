import React from 'react';

interface BrainCacheLogoProps {
  className?: string;
  size?: number;
}

// Professional Corporate/Tech Logo for Brain Cache:
// Combines the cerebral neural hemispheres of a brain with layered digital cache storage tiers,
// forming an iconic, balanced "B" and "C" monogram emblem.
export const BrainCacheLogo: React.FC<BrainCacheLogoProps> = ({
  className = 'w-7 h-7',
  size = 28,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-slate-900 dark:bg-[#0c1322] border border-slate-700/60 dark:border-slate-800 shadow-sm transition-transform duration-200 group-hover:scale-105 flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label="Brain Cache Official Logo"
    >
      <svg
        width={size * 0.72}
        height={size * 0.72}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-200"
      >
        <defs>
          {/* Main Electric Teal-to-Indigo Gradient */}
          <linearGradient id="bc-pro-primary" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="55%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          {/* Accent Core Synaptic Gradient */}
          <linearGradient id="bc-pro-accent" x1="10" y1="10" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        {/* 
          LEFT LOBE / "B" MONOGRAM & CACHE TIERS
          Three sleek modular memory registers forming the left cerebral hemisphere
        */}
        <rect
          x="5"
          y="7"
          width="8"
          height="4.5"
          rx="2.25"
          fill="url(#bc-pro-primary)"
        />
        <rect
          x="4"
          y="13.75"
          width="9.5"
          height="4.5"
          rx="2.25"
          fill="url(#bc-pro-primary)"
        />
        <rect
          x="5"
          y="20.5"
          width="8"
          height="4.5"
          rx="2.25"
          fill="url(#bc-pro-primary)"
        />

        {/* 
          RIGHT LOBE / "C" MONOGRAM & CACHE TIERS
          Corresponding tiered cache registers forming the right cerebral hemisphere
        */}
        <rect
          x="19"
          y="7"
          width="8"
          height="4.5"
          rx="2.25"
          fill="url(#bc-pro-primary)"
        />
        <rect
          x="18.5"
          y="13.75"
          width="9.5"
          height="4.5"
          rx="2.25"
          fill="url(#bc-pro-primary)"
        />
        <rect
          x="19"
          y="20.5"
          width="8"
          height="4.5"
          rx="2.25"
          fill="url(#bc-pro-primary)"
        />

        {/* 
          CENTRAL SYNAPTIC BRIDGE & NEURAL CACHE BUS
          Interlinks the left and right memory tiers seamlessly
        */}
        <path
          d="M13 9.25H19 M13.5 16H18.5 M13 22.75H19"
          stroke="url(#bc-pro-accent)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Center Synaptic Core */}
        <circle cx="16" cy="16" r="2.2" fill="#2dd4bf" />
        <circle cx="16" cy="9.25" r="1.1" fill="#06b6d4" />
        <circle cx="16" cy="22.75" r="1.1" fill="#818cf8" />
      </svg>
    </div>
  );
};

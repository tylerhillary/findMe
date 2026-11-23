import { useId } from "react";

/**
 * findMe mark: a magnifying-glass lens finding one person in a crowd.
 * Drawn as vector paths so it stays sharp at any size. `light` is for dark backgrounds.
 */
export function LogoMark({ className, light, title = "findMe" }: { className?: string; light?: boolean; title?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ring = `fm-ring-${id}`;
  const lens = `fm-lens-${id}`;
  const person = light ? "#ffffff" : "#1b1145";
  const tie = light ? "#6230f0" : "#ffffff";
  const crowd = light ? "rgba(255,255,255,0.28)" : "#c9bcff";

  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={ring} x1="10" y1="10" x2="54" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6230f0" />
          <stop offset="0.55" stopColor="#9b4dff" />
          <stop offset="1" stopColor="#ff6a45" />
        </linearGradient>
        <clipPath id={lens}>
          <circle cx="32" cy="30" r="17.6" />
        </clipPath>
      </defs>

      {/* the crowd, behind */}
      <g clipPath={`url(#${lens})`} fill={crowd}>
        <circle cx="18.5" cy="27.5" r="5" />
        <path d="M9 47c0-7.6 4.2-12 9.5-12S28 39.4 28 47z" />
        <circle cx="45.5" cy="27.5" r="5" />
        <path d="M36 47c0-7.6 4.2-12 9.5-12S55 39.4 55 47z" />
      </g>

      {/* the one you found */}
      <g clipPath={`url(#${lens})`}>
        <path d="M17.5 50c0-10.4 6.4-17.6 14.5-17.6S46.5 39.6 46.5 50z" fill={person} />
        <path d="M30.3 32.6h3.4l-.9 2.6 1.9 8.4-2.7 2.9-2.7-2.9 1.9-8.4z" fill={tie} />
      </g>
      <circle cx="32" cy="20.5" r="7.4" fill={person} />

      {/* lens rim, open at the top so the person stands out */}
      <path d="M42.6 13.2A20 20 0 1 1 21.4 13.2" fill="none" stroke={`url(#${ring})`} strokeWidth="5" strokeLinecap="round" />
      {/* handle */}
      <rect x="28.4" y="51.2" width="7.2" height="11.6" rx="3.6" fill={`url(#${ring})`} />
    </svg>
  );
}

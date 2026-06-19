/** Tarot card back: dark hanji texture + gold corner 창살 + red ㅎ 낙관. Inline SVG, no assets. */
export function SpreadCardBack({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 180" className={className} role="img" aria-label="Tarot card back" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="spreadHanjiDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1A1A2E" />
          <stop offset="1" stopColor="#0F0828" />
        </linearGradient>
        <filter id="spreadHanjiNoise" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" />
          <feComponentTransfer><feFuncA type="linear" slope="0.07" /></feComponentTransfer>
        </filter>
      </defs>
      <rect width="120" height="180" rx="10" fill="url(#spreadHanjiDark)" />
      <rect width="120" height="180" rx="10" filter="url(#spreadHanjiNoise)" />
      <rect x="7" y="7" width="106" height="166" rx="6" fill="none" stroke="#C49A3F" strokeWidth="1.4" />
      <g stroke="#F4C95D" strokeWidth="1.1" fill="none" opacity="0.85">
        <path d="M20 16 V34 M11 25 H29 M20 16 H38 M29 16 V25" />
        <path d="M100 16 V34 M109 25 H91 M100 16 H82 M91 16 V25" />
        <path d="M20 164 V146 M11 155 H29 M20 164 H38 M29 164 V155" />
        <path d="M100 164 V146 M109 155 H91 M100 164 H82 M91 164 V155" />
      </g>
      <rect x="44" y="74" width="32" height="32" rx="5" fill="#B5304A" />
      <text x="60" y="97" fontFamily="serif" fontSize="18" fill="#FFF6E5" textAnchor="middle">ㅎ</text>
      <text x="60" y="132" fontFamily="serif" fontSize="7" fill="#88B0BC" textAnchor="middle" letterSpacing="2">KSAJU</text>
    </svg>
  );
}

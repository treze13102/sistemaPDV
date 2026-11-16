// Neutral, hand-drawn stand-ins for the original's icons, flags and logo.

const LANG_NAMES = { pt: "Português", en: "English", es: "Español" };

export function Flag({ lang, width = 23, height = 17 }) {
  return <img src={`/assets/flag-${lang}.svg`} alt={LANG_NAMES[lang]} width={width} height={height} />;
}

/* Inline version kept for reference (same drawing as /assets/flag-*.svg). */
export function FlagInline({ lang, width = 23, height = 17 }) {
  if (lang === "en") {
    return (
      <svg width={width} height={height} viewBox="0 0 23 17" aria-hidden="true">
        <rect width="23" height="17" rx="2" fill="#fff" />
        {[0, 2, 4, 6, 8, 10, 12, 14, 16].map((y) => (
          <rect key={y} y={y * (17 / 17)} width="23" height="1.3" fill="#e0464a" />
        ))}
        <rect width="10" height="9" fill="#3b5aa6" />
      </svg>
    );
  }
  if (lang === "es") {
    return (
      <svg width={width} height={height} viewBox="0 0 23 17" aria-hidden="true">
        <rect width="23" height="17" rx="2" fill="#d9393a" />
        <rect y="4.25" width="23" height="8.5" fill="#f6c443" />
      </svg>
    );
  }
  return (
    <svg width={width} height={height} viewBox="0 0 23 17" aria-hidden="true">
      <rect width="23" height="17" rx="2" fill="#2fae5f" />
      <path d="M11.5 2.2 20.6 8.5 11.5 14.8 2.4 8.5Z" fill="#f6d43b" />
      <circle cx="11.5" cy="8.5" r="3.6" fill="#2c4a9c" />
    </svg>
  );
}

export function HelpIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="none" stroke={color} strokeWidth="1.2" />
      <path
        d="M6.1 6.2a1.95 1.95 0 0 1 3.8.5c0 1.3-1.9 1.6-1.9 2.8"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11.6" r="0.8" fill={color} />
    </svg>
  );
}

/** Placeholder brand mark: a tile on desktop, a wordmark on phones. */
export function LogoTile() {
  return (
    <div className="logo-tile" aria-label="Mont Royal">
      <span>MR</span>
    </div>
  );
}

export function LogoWord() {
  return (
    <div className="logo-word" aria-label="Mont Royal">
      Mont Royal
    </div>
  );
}

/* Sign-in provider marks: simple neutral shapes, not the providers' logos. */
export function ProviderMark({ kind }) {
  return <img src={`/assets/provider-${kind}.svg`} alt="" width="20" height="20" />;
}

export function ProviderMarkInline({ kind }) {
  const common = { width: 20, height: 20, viewBox: "0 0 20 20", "aria-hidden": true };
  if (kind === "google")
    return (
      <svg {...common}>
        <path d="M10 2a8 8 0 1 0 7.8 9.6H10V8.4h7.6" fill="none" stroke="#4285f4" strokeWidth="3" />
        <path d="M3.4 6A8 8 0 0 1 15.5 4.2" fill="none" stroke="#ea4335" strokeWidth="3" />
        <path d="M2.3 12.3A8 8 0 0 0 4.5 15.8" fill="none" stroke="#fbbc05" strokeWidth="3" />
        <path d="M4.5 15.8A8 8 0 0 0 15 17" fill="none" stroke="#34a853" strokeWidth="3" />
      </svg>
    );
  if (kind === "facebook")
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="10" fill="#1877f2" />
        <path d="M11 20v-7h2.3l.4-2.8H11V8.6c0-.8.3-1.3 1.4-1.3h1.4V4.8a17 17 0 0 0-2-.1c-2 0-3.3 1.2-3.3 3.4v2.1H6.3V13h2.2v7Z" fill="#fff" />
      </svg>
    );
  if (kind === "apple")
    return (
      <svg {...common}>
        <path d="M14.6 10.6c0-2 1.6-2.9 1.7-3a3.7 3.7 0 0 0-2.9-1.6c-1.2-.1-2.4.7-3 .7s-1.6-.7-2.6-.7a3.9 3.9 0 0 0-3.3 2c-1.4 2.4-.4 6 1 8 .7 1 1.4 2 2.5 2s1.3-.6 2.5-.6 1.5.6 2.6.6 1.7-1 2.4-2a8 8 0 0 0 1.1-2.2 3.4 3.4 0 0 1-2-3.2ZM12.6 4.5A3.3 3.3 0 0 0 13.4 2a3.4 3.4 0 0 0-2.2 1.1 3.1 3.1 0 0 0-.8 2.4 2.8 2.8 0 0 0 2.2-1Z" fill="#2d2d2a" />
      </svg>
    );
  return (
    <svg {...common}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" fill="none" stroke="#2c3e57" strokeWidth="1.2" />
      <path d="m3 5.5 7 5.5 7-5.5M3 15l5-4.5M17 15l-5-4.5" fill="none" stroke="#2c3e57" strokeWidth="1.1" />
      <path d="M10 11v2" stroke="#ce7da5" strokeWidth="1.1" />
    </svg>
  );
}

/** Line illustration for the carousel (stand-in for the original artwork). */
export function Illustration() {
  return <img className="carousel-art" src="/assets/slide-art.svg" alt="" width="375" height="266" draggable="false" />;
}

export function IllustrationInline({ index = 0 }) {
  const stroke = "#444e5e";
  const accent = "#2dd1ac";
  return (
    <svg viewBox="0 0 375 266" width="375" height="266" aria-hidden="true" className="carousel-art">
      <rect x="18" y="187" width="304" height="5" rx="2.5" fill="#e8e9ea" />
      {[40, 135].map((x) => (
        <g key={x}>
          <rect x={x} y="104" width="70" height="12" fill="#fff" stroke={stroke} strokeWidth="3" />
          <rect x={x + 4} y="116" width="62" height="70" fill="#fff" stroke={stroke} strokeWidth="3" />
          <rect x={x + 20} y="133" width="28" height="7" rx="3.5" fill="none" stroke={stroke} strokeWidth="2.5" />
          <path d={`M${x + 46} ${x === 40 ? 172 : 172}h12`} stroke={accent} strokeWidth="2.5" />
        </g>
      ))}
      <g transform={`rotate(4 265 120) translate(${index * 0} 0)`}>
        <rect x="232" y="64" width="72" height="12" fill="#fff" stroke={stroke} strokeWidth="3" />
        <rect x="235" y="76" width="64" height="58" fill="#fff" stroke={stroke} strokeWidth="3" />
        <rect x="250" y="90" width="28" height="7" rx="3.5" fill="none" stroke={stroke} strokeWidth="2.5" />
        <path d="M276 118h12" stroke={accent} strokeWidth="2.5" />
      </g>
      <path d="M297 96c10 3 18 10 24 14 12 2 24 2 36 3v24c-14-1-30-1-44-3-6-2-12-6-17-9" fill="#e8e9ea" stroke={stroke} strokeWidth="2.5" />
      <rect x="282" y="106" width="10" height="10" rx="3" fill="#fff" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

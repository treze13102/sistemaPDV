// Line illustrations drawn for this project in the original's style
// (dark grey outlines, light grey fills, green accents). Sizes match the original's images.
const S = "#444e5e";
const L = "#eff1f3";
const G = "#2dd1ac";
const W = "#ffffff";

const base = (w, h, children, label) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="art">
    {children}
  </svg>
);

export const ArtCartEmpty = () =>
  base(
    125,
    141,
    <>
      <circle cx="62" cy="79" r="62" fill={L} />
      <path d="M8 117h108" stroke="#e1e3e6" strokeWidth="10" />
      <path d="M54 2h14v20h10L61 40 44 22h10Z" fill={W} stroke={S} strokeWidth="3" strokeLinejoin="round" />
      <path d="M50 50c-3 6 3 10 0 16M61 46v20M72 50c3 6-3 10 0 16" stroke={G} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="58" r="3" fill={G} />
      <circle cx="84" cy="58" r="3" fill={G} />
      <path d="M26 72h8l6 28h46l8-24H38" fill={W} stroke={S} strokeWidth="3" strokeLinejoin="round" />
      <path d="M44 84h44M48 76l3 24M60 76v24M72 76v24M84 76l-3 24" stroke={S} strokeWidth="2.5" />
      <circle cx="46" cy="110" r="5" fill={W} stroke={S} strokeWidth="3" />
      <circle cx="80" cy="110" r="5" fill={W} stroke={S} strokeWidth="3" />
    </>,
    "Carrinho vazio"
  );

export const ArtBasket = ({ count = 0, w = 226, h = 186 }) =>
  base(
    w,
    h,
    <g transform={`scale(${w / 226} ${h / 186})`}>
      <path d="M20 120C0 80 30 20 100 10c60-8 110 30 120 80 6 40-20 80-80 86-60 6-104-20-120-56Z" fill={L} />
      <path d="M50 30l38 40M174 30l-36 40" stroke={S} strokeWidth="5" strokeLinecap="round" />
      <path d="M48 26l40 44M176 26l-38 44" stroke={W} strokeWidth="2" strokeLinecap="round" />
      <rect x="24" y="62" width="176" height="14" rx="7" fill={W} stroke={S} strokeWidth="3" />
      <path d="M34 76h156l-12 84H46Z" fill={G} />
      <path d="M78 98l4 40M112 96v42M146 98l-4 40" stroke="#1f8f75" strokeWidth="6" strokeLinecap="round" />
      <circle cx="176" cy="154" r="23" fill={W} stroke={S} strokeWidth="3" />
      <text x="176" y="166" textAnchor="middle" fontSize="32" fontFamily="Arial, sans-serif" fill={G}>
        {count}
      </text>
    </g>,
    "Cesta de pedidos"
  );

export const ArtDevices = ({ w = 168, h = 134 }) =>
  base(
    w,
    h,
    <g transform={`scale(${w / 168} ${h / 134})`}>
      <rect x="24" y="2" width="142" height="106" rx="6" fill={W} stroke={S} strokeWidth="3" />
      <rect x="32" y="16" width="126" height="84" fill={W} stroke={S} strokeWidth="2" />
      <path d="M90 9h2M84 26h20" stroke={S} strokeWidth="2.5" />
      {[0, 1, 2, 3].map((c) =>
        [0, 1].map((r) => (
          <g key={`${c}${r}`}>
            <rect x={42 + c * 29} y={36 + r * 29} width="20" height="12" fill="#d9dce2" />
            <path d={`M${44 + c * 29} ${54 + r * 29}h8`} stroke={G} strokeWidth="2" />
          </g>
        ))
      )}
      <path d="M86 108v24M104 108v24M74 132h56" stroke={S} strokeWidth="3" />
      <rect x="2" y="46" width="46" height="86" rx="5" fill={W} stroke={S} strokeWidth="3" />
      <rect x="8" y="58" width="34" height="62" fill={W} stroke={S} strokeWidth="1.5" />
      <path d="M18 52h8M20 66h12" stroke={S} strokeWidth="2" />
      {[0, 1, 2, 3, 4].map((k) => (
        <g key={k}>
          <rect x="12" y={74 + k * 9} width="5" height="4" fill="#d9dce2" />
          <path d={`M20 ${76 + k * 9}h12`} stroke={G} strokeWidth="2" />
        </g>
      ))}
      <circle cx="25" cy="126" r="2.5" fill="none" stroke={S} strokeWidth="1.5" />
    </g>,
    "Computador e celular"
  );

export const ArtPeople = () =>
  base(
    150,
    96,
    <>
      <circle cx="34" cy="20" r="15" fill={W} stroke={S} strokeWidth="2.5" />
      <path d="M18 18c4-8 26-10 30-2l12-4" fill="#d9dce2" stroke={S} strokeWidth="2.5" />
      <circle cx="116" cy="18" r="15" fill={W} stroke={S} strokeWidth="2.5" />
      <path d="M4 94V66c0-14 10-22 24-22h12c6 0 12 4 14 10M146 94V66c0-14-10-22-24-22h-12c-6 0-12 4-14 10" fill="none" stroke={S} strokeWidth="2.5" />
      <rect x="52" y="40" width="46" height="36" rx="2" fill="#d9dce2" stroke={S} strokeWidth="2.5" />
      <path d="M68 40v8h14v-8" fill={W} stroke={S} strokeWidth="2" />
      <rect x="71" y="58" width="8" height="18" fill={G} />
      <path d="M30 60c6 16 24 22 30 22M120 60c-6 16-24 22-30 22" fill="none" stroke={S} strokeWidth="2.5" />
      <path d="M50 70c-6 0-6 12 0 12M100 70c6 0 6 12 0 12" fill={W} stroke={S} strokeWidth="2.5" />
    </>,
    "Clientes"
  );

export const ArtClipboard = () =>
  base(
    100,
    100,
    <>
      <rect x="14" y="14" width="72" height="80" rx="6" fill={L} stroke={S} strokeWidth="2.5" />
      <rect x="22" y="22" width="56" height="64" rx="3" fill={W} stroke={S} strokeWidth="2" />
      <path d="M36 14a14 8 0 0 1 28 0v6H36Z" fill="#a9b1be" stroke={S} strokeWidth="2.5" />
      <path d="M6 94h88" stroke={S} strokeWidth="2.5" />
      <circle cx="50" cy="44" r="10" fill={W} stroke={S} strokeWidth="2.5" />
      <path d="M44 44l4 4 10-10" fill="none" stroke={S} strokeWidth="3" strokeLinecap="round" />
      <path d="M32 62h4M40 62h28M32 70h4M40 70h28M32 78h4M40 78h20" stroke={S} strokeWidth="2" />
    </>,
    "Contas em dia"
  );

export const ArtJar = () =>
  base(
    100,
    122,
    <>
      <path d="M40 40c-6-8-10-20-4-28l16-6c4-2 8 0 10 3l20-2v14l-14 4c-2 4-8 6-12 4-4 6-6 10-8 12" fill={W} stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M44 22c2 4 0 8-4 10" fill="none" stroke={S} strokeWidth="2" />
      <rect x="78" y="2" width="12" height="20" rx="2" fill="#535d6e" />
      <circle cx="40" cy="44" r="5" fill={W} stroke={S} strokeWidth="2" />
      <rect x="22" y="54" width="44" height="8" rx="3" fill="#535d6e" />
      <path d="M26 62h36c6 8 8 16 8 26v22c0 6-4 10-10 10H28c-6 0-10-4-10-10V88c0-10 2-18 8-26Z" fill={L} stroke={S} strokeWidth="2.5" />
      {[[36, 76], [52, 88], [38, 102]].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r="7" fill={W} stroke={S} strokeWidth="2" />
          <path d={`M${x} ${y - 4}v8M${x - 2} ${y - 2}h3a1.5 1.5 0 0 1 0 3h-2a1.5 1.5 0 0 0 0 3h3`} stroke={S} strokeWidth="1.2" fill="none" />
        </g>
      ))}
      <path d="M10 120h68" stroke={S} strokeWidth="2.5" />
    </>,
    "Pote de moedas"
  );

export const ArtTelescope = () =>
  base(
    100,
    91,
    <>
      <path d="M46 52L30 86M50 52l18 34M48 52v34M24 86h52" stroke={S} strokeWidth="2.5" fill="none" />
      <circle cx="48" cy="50" r="6" fill={W} stroke={S} strokeWidth="2.5" />
      <g transform="rotate(-22 50 40)">
        <rect x="14" y="30" width="62" height="20" rx="4" fill={L} stroke={S} strokeWidth="2.5" />
        <rect x="76" y="26" width="16" height="28" rx="6" fill="#a9b1be" stroke={S} strokeWidth="2.5" />
        <rect x="4" y="34" width="10" height="12" rx="2" fill={W} stroke={S} strokeWidth="2.5" />
        <path d="M30 38h22" stroke="#535d6e" strokeWidth="4" />
        <path d="M54 38h6" stroke={G} strokeWidth="4" />
      </g>
    </>,
    "Luneta"
  );

export const ArtMagnifier = () =>
  base(
    120,
    120,
    <>
      <circle cx="50" cy="50" r="40" fill={W} stroke={S} strokeWidth="4" />
      <circle cx="50" cy="50" r="32" fill={L} />
      <path d="M80 80l8 8" stroke={S} strokeWidth="4" />
      <rect x="84" y="80" width="14" height="36" rx="7" transform="rotate(-45 91 98)" fill={W} stroke={S} strokeWidth="3.5" />
    </>,
    "Lupa"
  );

export const ArtKite = () =>
  base(
    160,
    152,
    <>
      <path d="M8 34c0-8 12-10 16-4 4-10 22-10 26-2 6-4 16 0 14 6H8Z" fill="#e3effd" />
      <path d="M120 36c0-6 10-8 12-2 6-4 14 0 12 6h-24ZM110 128c0-6 10-8 12-2 6-4 14 0 12 6h-24Z" fill="#e3effd" />
      <ellipse cx="80" cy="80" rx="72" ry="62" fill="#e3effd" />
      <path d="M86 10l42 52-46 58-42-48Z" fill={W} stroke={S} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M86 10l42 52-46 58c-8-30-6-74 4-110Z" fill={G} stroke={S} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M82 120c-8 4-12 12-2 16 10 4 8 10 0 14" fill="none" stroke={S} strokeWidth="4" strokeLinecap="round" />
      <rect x="126" y="20" width="16" height="13" rx="2" fill="#ff528d" />
      <path d="M129 20v-4a5 5 0 0 1 10 0v4" fill="none" stroke="#ff528d" strokeWidth="2.5" />
    </>,
    "Assistente bloqueado"
  );

export const ArtStore = () =>
  base(
    80,
    84,
    <>
      <rect x="16" y="2" width="48" height="10" fill={L} stroke={S} strokeWidth="2.5" />
      <rect x="6" y="40" width="68" height="42" fill={W} stroke={S} strokeWidth="2.5" />
      <path d="M2 30l8-18h60l8 18" fill={W} stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <path key={k} d={`M${2 + k * 12.66} 30a6.3 6 0 0 0 12.66 0Z`} fill={k % 2 ? W : G} stroke={S} strokeWidth="2" />
      ))}
      <path d="M2 30h76" stroke={S} strokeWidth="2.5" />
      <rect x="14" y="54" width="16" height="28" fill={L} stroke={S} strokeWidth="2" />
      <rect x="38" y="52" width="28" height="18" fill={W} stroke={S} strokeWidth="2" />
      <path d="M58 60h4" stroke={S} strokeWidth="2" />
    </>,
    "Loja"
  );

export const ArtDocGear = () =>
  base(
    80,
    76,
    <>
      <path d="M6 4h44l8 8v50H6Z" fill={L} stroke={S} strokeWidth="2.5" />
      <path d="M2 8h44l8 8v54H2Z" fill={W} stroke={S} strokeWidth="2.5" />
      {[18, 38].map((y) => (
        <g key={y}>
          <rect x="22" y={y} width="12" height="12" fill={W} stroke={S} strokeWidth="2" />
          <path d={`M24 ${y + 6}l3 3 9-10`} stroke={G} strokeWidth="2.5" fill="none" />
          <path d={`M38 ${y + 3}h10M38 ${y + 8}h10`} stroke={S} strokeWidth="2" />
        </g>
      ))}
      <circle cx="64" cy="60" r="10" fill={W} stroke={S} strokeWidth="2.5" />
      <circle cx="64" cy="60" r="4" fill={W} stroke={S} strokeWidth="2" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <rect key={a} x="62" y="46" width="4" height="5" fill={S} transform={`rotate(${a} 64 60)`} />
      ))}
    </>,
    "Configurar pedidos"
  );

export const ArtReceipt = () =>
  base(
    80,
    86,
    <>
      <path d="M4 4l6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6v74H4Z" fill={W} stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="64" y="40" width="14" height="44" rx="3" fill="#a9b1be" stroke={S} strokeWidth="2.5" />
      <path d="M34 22v28M40 28c0-3-3-5-6-5s-6 2-6 5 3 5 6 5 6 2 6 5-3 5-6 5-6-2-6-5" fill="none" stroke={S} strokeWidth="2.5" />
      {[56, 64, 72].map((y) => (
        <g key={y}>
          <circle cx="14" cy={y} r="1.6" fill={G} />
          <path d={`M20 ${y}h34`} stroke={S} strokeWidth="2.5" />
        </g>
      ))}
    </>,
    "Recibo"
  );

export const ArtBill = () =>
  base(
    82,
    74,
    <>
      <rect x="2" y="2" width="78" height="36" fill={G} stroke={S} strokeWidth="2.5" />
      <rect x="10" y="8" width="62" height="24" rx="4" fill="none" stroke={S} strokeWidth="2" />
      <path d="M42 10v20M46 14c0-2-2-3-4-3s-4 1-4 3 2 3 4 3 4 1 4 3-2 3-4 3-4-1-4-3" fill="none" stroke={S} strokeWidth="2" />
      <path d="M24 20c0-6 8-6 8 0v22c4-4 14-4 14 2v14c0 8-4 12-12 12h-6c-6 0-10-6-10-12v-8c0-4 6-4 6 0" fill={W} stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="20" y="66" width="34" height="8" rx="3" fill="#a9b1be" stroke={S} strokeWidth="2" />
    </>,
    "Pagamento"
  );

export const ArtScooter = () =>
  base(
    114,
    72,
    <>
      <rect x="4" y="2" width="38" height="26" fill="#a9b1be" stroke={S} strokeWidth="2.5" />
      <path d="M18 2v10h10V2" fill={W} stroke={S} strokeWidth="2" />
      <path d="M2 30h44l6 14h30l6-30h8" fill="none" stroke={S} strokeWidth="2.5" />
      <path d="M8 34h36c6 0 10 6 12 12h28l8-18 8 2c6 10 6 22 0 28H14c-8 0-12-10-6-24Z" fill={G} stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="26" cy="58" r="11" fill={W} stroke={S} strokeWidth="3" />
      <circle cx="26" cy="58" r="4" fill={S} />
      <circle cx="96" cy="58" r="11" fill={W} stroke={S} strokeWidth="3" />
      <circle cx="96" cy="58" r="4" fill={S} />
      <path d="M2 70h110" stroke={S} strokeWidth="2.5" />
    </>,
    "Entrega"
  );

export const ArtPlug = () =>
  base(
    82,
    78,
    <>
      <circle cx="38" cy="38" r="35" fill="none" stroke={S} strokeWidth="2.5" />
      <circle cx="38" cy="38" r="29" fill={W} stroke={S} strokeWidth="2.5" />
      <rect x="20" y="20" width="36" height="36" rx="6" fill={L} stroke={S} strokeWidth="2.5" />
      <circle cx="38" cy="38" r="9" fill={W} stroke={S} strokeWidth="2.5" />
      <path d="M35 35v3M41 35v3M38 41v1" stroke={S} strokeWidth="2" />
      <path d="M66 26v-8M72 26v-8" stroke={S} strokeWidth="2.5" />
      <rect x="62" y="24" width="14" height="12" rx="2" fill={G} stroke={S} strokeWidth="2.5" />
      <path d="M69 36v6" stroke={S} strokeWidth="2.5" />
    </>,
    "Integrações"
  );

export const ArtCalcReceipt = () =>
  base(
    120,
    124,
    <>
      <path d="M38 14h60v96l12 10H50L38 110Z" fill={W} stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M50 120h60l-6-10H40Z" fill="#a9b1be" stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M58 92v14M62 92v14M66 92v14M70 92v14M74 92v14M78 92v14M82 92v14M86 92v14M90 92v14" stroke={S} strokeWidth="1.8" />
      <rect x="2" y="44" width="46" height="62" rx="5" fill="#535d6e" stroke={S} strokeWidth="2.5" />
      <rect x="8" y="50" width="34" height="10" fill={G} />
      {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={10 + c * 11} y={66 + r * 9} width="7" height="5" fill={W} />))}
      <ellipse cx="66" cy="16" rx="18" ry="10" fill="#a9b1be" stroke={S} strokeWidth="2.5" transform="rotate(-20 66 16)" />
      <ellipse cx="84" cy="48" rx="18" ry="10" fill="#a9b1be" stroke={S} strokeWidth="2.5" transform="rotate(15 84 48)" />
    </>,
    "Registrar saídas"
  );

export const ArtShirts = () =>
  base(
    190,
    204,
    <>
      <rect x="28" y="24" width="178" height="176" rx="6" fill={L} stroke="#d9dce2" strokeWidth="2" transform="translate(-24 0)" />
      <rect x="4" y="164" width="178" height="36" fill="#d9dce2" />
      <text x="70" y="186" fontSize="13" fontFamily="var(--font-sans)" fill="#808c9e">
        Camisas
      </text>
      <path d="M30 68l18-12h40l18 12-8 22-10-4v52H48V86l-10 4Z" fill={L} stroke="#a9b1be" strokeWidth="2" strokeDasharray="5 4" />
      {[
        [150, 0, G],
        [150, 74, W],
        [150, 148, "#808c9e"],
      ].map(([x, y, f]) => (
        <path key={y} d={`M${x - 30} ${y + 10}l12-8h36l12 8-6 18-8-3v34h-32v-34l-8 3Z`} fill={f} stroke={S} strokeWidth="2" strokeLinejoin="round" />
      ))}
      <path d="M64 130c20-14 40-18 50-16l-6-6M114 114l-8 6" fill="none" stroke="#ff528d" strokeWidth="2" strokeLinecap="round" />
    </>,
    "Produto com variação"
  );

/** Curved arrow pointing up at the main add button (shown on empty lists). */
export const ArtArrowUp = () => (
  <svg width="175" height="166" viewBox="0 0 175 166" aria-hidden="true" className="art art--arrow">
    <path d="M2 164C90 160 158 110 162 16" fill="none" stroke="#5bd7bb" strokeWidth="3" strokeLinecap="round" />
    <path d="M150 22l12-20 12 20Z" fill="#5bd7bb" />
  </svg>
);

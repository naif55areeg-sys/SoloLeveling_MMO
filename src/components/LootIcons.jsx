import { TIER_COLOR } from "../constants/gameData";

// ─── SHAPE TYPE DETECTOR (matches gameData.itemShapeType) ────────────────────
export function itemShapeType(name) {
  if (/سيف|خنجر|نصل/.test(name)) return "weapon";
  if (/ناب|مخلب|قاتل/.test(name)) return "claw";
  if (/نواة/.test(name)) return "orb";
  if (/كيس|حقيبة/.test(name)) return "pouch";
  return "gem";
}

// ─── WEAPON (sword / dagger) ─────────────────────────────────────────────────
export function WeaponShape({ color, size = 56, uid }) {
  const blade = `blade-${uid}`, bladeEdge = `bladeEdge-${uid}`, hilt = `hilt-${uid}`, glow = `glow-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ filter: `drop-shadow(0 4px 12px ${color}88)` }}>
      <defs>
        <linearGradient id={blade} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="30%" stopColor="#f1f5f9" />
          <stop offset="52%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={bladeEdge} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.0" />
          <stop offset="50%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
        <linearGradient id={hilt} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="60%" stopColor="#2e1065" />
          <stop offset="100%" stopColor="#0d0020" />
        </linearGradient>
        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* glow aura */}
      <ellipse cx="32" cy="32" rx="28" ry="28" fill={`url(#${glow})`} />
      {/* blade — main face */}
      <polygon points="32,3 37,10 35,42 32,48 29,42 27,10" fill={`url(#${blade})`} stroke="#ffffff30" strokeWidth="0.5" />
      {/* blade — right bevel (darker) */}
      <polygon points="37,10 40,14 38,42 35,42" fill="#374151" opacity="0.55" />
      {/* blade — left bevel (lighter highlight) */}
      <polygon points="27,10 24,14 26,42 29,42" fill="#e2e8f0" opacity="0.22" />
      {/* edge glow */}
      <polygon points="32,3 37,10 35,42 32,48 29,42 27,10" fill={`url(#${bladeEdge})`} />
      {/* fuller (center ridge line) */}
      <line x1="32" y1="10" x2="32" y2="40" stroke="#ffffff" strokeWidth="0.7" opacity="0.4" />
      {/* crossguard */}
      <rect x="16" y="41" width="32" height="5" rx="2.5" fill={color} />
      <rect x="16" y="41" width="32" height="2" rx="1" fill="#ffffff" opacity="0.2" />
      <rect x="16" y="44" width="32" height="2" rx="1" fill="#000000" opacity="0.25" />
      {/* grip */}
      <rect x="29" y="46" width="6" height="13" rx="2" fill={`url(#${hilt})`} />
      {/* grip wraps */}
      {[48, 51, 54].map(y => (
        <rect key={y} x="29" y={y} width="6" height="1.2" rx="0.6" fill={color} opacity="0.5" />
      ))}
      {/* pommel */}
      <ellipse cx="32" cy="60" rx="4.5" ry="3.5" fill={color} stroke="#ffffff60" strokeWidth="0.6" />
      <ellipse cx="31" cy="59" rx="1.5" ry="1" fill="#ffffff" opacity="0.4" />
    </svg>
  );
}

// ─── CLAW (fang / talon) ──────────────────────────────────────────────────────
export function ClawShape({ color, size = 56, uid }) {
  const g1 = `claw1-${uid}`, g2 = `claw2-${uid}`, g3 = `claw3-${uid}`, glow = `clawglow-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ filter: `drop-shadow(0 4px 12px ${color}88)` }}>
      <defs>
        <linearGradient id={g1} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="40%" stopColor={color} />
          <stop offset="100%" stopColor="#1e0533" />
        </linearGradient>
        <linearGradient id={g2} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="40%" stopColor={color} />
          <stop offset="100%" stopColor="#1e0533" />
        </linearGradient>
        <linearGradient id={g3} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor={color} />
          <stop offset="100%" stopColor="#1e0533" />
        </linearGradient>
        <radialGradient id={glow} cx="50%" cy="80%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="48" rx="24" ry="14" fill={`url(#${glow})`} />
      {/* left claw */}
      <path d="M14 56 C 8 40, 12 18, 22 6 C 16 24, 15 42, 18 56 Z" fill={`url(#${g1})`} stroke="#ffffff25" strokeWidth="0.5" />
      <path d="M14 56 C 8 40, 12 18, 22 6 C 18 24, 17 42, 18 56 Z" fill="#ffffff" opacity="0.14" />
      {/* right claw */}
      <path d="M50 56 C 56 40, 52 18, 42 6 C 48 24, 49 42, 46 56 Z" fill={`url(#${g2})`} stroke="#ffffff25" strokeWidth="0.5" />
      {/* center claw (taller) */}
      <path d="M32 58 C 28 40, 27 16, 32 3 C 37 16, 36 40, 32 58 Z" fill={`url(#${g3})`} stroke="#ffffff25" strokeWidth="0.5" />
      <path d="M32 58 C 30 40, 30 16, 32 3 C 32 16, 31 40, 32 58 Z" fill="#ffffff" opacity="0.2" />
      {/* base connector */}
      <ellipse cx="32" cy="56" rx="18" ry="5" fill={color} opacity="0.55" />
      <ellipse cx="30" cy="55" rx="6" ry="2" fill="#ffffff" opacity="0.2" />
    </svg>
  );
}

// ─── ORB (core / soul) ───────────────────────────────────────────────────────
export function OrbShape({ color, size = 56, uid }) {
  const rg = `orb-${uid}`, rg2 = `orbInner-${uid}`, ringG = `orbRing-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ filter: `drop-shadow(0 4px 16px ${color}99)` }}>
      <defs>
        <radialGradient id={rg} cx="38%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="22%" stopColor={color} stopOpacity="0.9" />
          <stop offset="65%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor="#04000f" stopOpacity="0.95" />
        </radialGradient>
        <radialGradient id={rg2} cx="42%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ringG} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {/* outer glow ring */}
      <circle cx="32" cy="32" r="30" fill="none" stroke={color} strokeWidth="0.8" opacity="0.2" />
      <circle cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="0.5" opacity="0.15" />
      {/* equator ring */}
      <ellipse cx="32" cy="32" rx="22" ry="6" fill="none" stroke={`url(#${ringG})`} strokeWidth="1.2" opacity="0.6" />
      {/* vertical ring */}
      <ellipse cx="32" cy="32" rx="6" ry="22" fill="none" stroke={color} strokeWidth="0.8" opacity="0.35" />
      {/* main sphere */}
      <circle cx="32" cy="32" r="22" fill={`url(#${rg})`} />
      {/* inner specular */}
      <ellipse cx="26" cy="24" rx="8" ry="5" fill={`url(#${rg2})`} />
      {/* small highlight dot */}
      <circle cx="24" cy="22" r="2.5" fill="#ffffff" opacity="0.65" />
      {/* bottom shadow */}
      <ellipse cx="32" cy="53" rx="14" ry="4" fill="#000000" opacity="0.2" />
    </svg>
  );
}

// ─── GEM (jewel / crystal / shard) ───────────────────────────────────────────
export function GemShape({ color, size = 56, uid }) {
  const g1 = `gemTop-${uid}`, g2 = `gemMid-${uid}`, g3 = `gemBot-${uid}`, glow = `gemGlow-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ filter: `drop-shadow(0 4px 14px ${color}99)` }}>
      <defs>
        <linearGradient id={g1} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="40%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={g2} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor="#04000f" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={g3} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor="#04000f" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="32" rx="28" ry="28" fill={`url(#${glow})`} />
      {/* crown (top facets) */}
      <polygon points="32,4 46,18 32,22 18,18" fill={`url(#${g1})`} stroke="#ffffff30" strokeWidth="0.5" />
      {/* upper-left facet */}
      <polygon points="18,18 32,22 20,30 8,26" fill={color} opacity="0.75" stroke="#ffffff20" strokeWidth="0.4" />
      {/* upper-right facet */}
      <polygon points="46,18 56,26 44,30 32,22" fill={`url(#${g2})`} opacity="0.8" stroke="#ffffff20" strokeWidth="0.4" />
      {/* center girdle */}
      <polygon points="8,26 20,30 24,40 12,36" fill={`url(#${g2})`} opacity="0.7" />
      <polygon points="56,26 44,30 40,40 52,36" fill={color} opacity="0.45" />
      <polygon points="20,30 44,30 40,40 24,40" fill={color} opacity="0.82" stroke="#ffffff18" strokeWidth="0.4" />
      {/* pavilion (bottom facets) */}
      <polygon points="12,36 24,40 32,60" fill={`url(#${g3})`} />
      <polygon points="52,36 40,40 32,60" fill={color} opacity="0.38" />
      <polygon points="24,40 40,40 32,60" fill={`url(#${g2})`} opacity="0.88" />
      {/* main highlight on crown */}
      <polygon points="22,12 30,12 28,18 20,18" fill="#ffffff" opacity="0.55" />
      {/* secondary highlight */}
      <polygon points="34,6 40,12 36,14 32,9" fill="#ffffff" opacity="0.35" />
    </svg>
  );
}

// ─── POUCH (bag / sack) ───────────────────────────────────────────────────────
export function PouchShape({ color, size = 56, uid }) {
  const g1 = `pouch1-${uid}`, g2 = `pouch2-${uid}`, glow = `pouchGlow-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ filter: `drop-shadow(0 4px 12px ${color}77)` }}>
      <defs>
        <linearGradient id={g1} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="55%" stopColor={color} stopOpacity="0.65" />
          <stop offset="100%" stopColor="#1e0533" />
        </linearGradient>
        <linearGradient id={g2} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id={glow} cx="35%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* bag body */}
      <path
        d="M20 26 Q14 28, 13 40 Q12 54, 32 58 Q52 54, 51 40 Q50 28, 44 26 Q38 16, 32 18 Q26 16, 20 26 Z"
        fill={`url(#${g1})`}
        stroke={color}
        strokeWidth="0.8"
        opacity="0.95"
      />
      {/* right-side shadow for depth */}
      <path
        d="M44 26 Q50 28, 51 40 Q52 54, 32 58 Q46 52, 46 40 Q46 29, 44 26 Z"
        fill="#000000"
        opacity="0.22"
      />
      {/* body highlight (left) */}
      <path
        d="M20 26 Q14 28, 13 40 Q13 50, 22 55 Q16 48, 17 39 Q17 28, 20 26 Z"
        fill="#ffffff"
        opacity="0.12"
      />
      {/* specular sheen */}
      <path
        d="M22 28 Q26 20, 32 20 Q38 20, 42 28 Q38 24, 32 24 Q26 24, 22 28 Z"
        fill={`url(#${glow})`}
      />
      {/* neck/tie */}
      <rect x="26" y="17" width="12" height="10" rx="5" fill={color} stroke="#ffffff40" strokeWidth="0.6" />
      {/* rope knot */}
      <ellipse cx="32" cy="15" rx="7" ry="4.5" fill="none" stroke={color} strokeWidth="2.2" />
      <ellipse cx="32" cy="15" rx="7" ry="4.5" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.35" />
      {/* rope ends */}
      <path d="M26 15 C 22 10, 18 8, 20 5" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M38 15 C 42 10, 46 8, 44 5" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* stitching detail */}
      {[32, 38, 44].map((y) => (
        <line key={y} x1="20" y1={y} x2="26" y2={y} stroke="#ffffff" strokeWidth="0.8" opacity="0.18" strokeDasharray="1.5,2" />
      ))}
      {/* emblem dot */}
      <circle cx="32" cy="42" r="4" fill={color} stroke="#ffffff50" strokeWidth="0.6" opacity="0.7" />
      <circle cx="31" cy="41" r="1.5" fill="#ffffff" opacity="0.4" />
    </svg>
  );
}

// ─── ITEM ICON DISPATCHER ─────────────────────────────────────────────────────
export function ItemIcon({ name, tier, uid, size = 56 }) {
  const color = TIER_COLOR[tier];
  const type = itemShapeType(name);
  const props = { color, size, uid };

  // 👑 تفعيل الهالة المحيطة بالأيقونات تلقائياً حسب رتبة السلاح والـ Loot
  let auraClass = "";
  if (tier === "SSS") {
    auraClass = "aura-absolute"; // هالة أحمر متفجر تدميري لأقوى سلاح
  } else if (tier === "SS" || tier === "S") {
    auraClass = "aura-monarch";  // هالة ذهبية ملكية للرتب العالية
  }

  const renderIcon = () => {
    if (type === "weapon") return <WeaponShape {...props} />;
    if (type === "claw") return <ClawShape   {...props} />;
    if (type === "orb") return <OrbShape    {...props} />;
    if (type === "pouch") return <PouchShape  {...props} />;
    return <GemShape    {...props} />;
  };

  return (
    <div
      className={auraClass}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "10px", // انحناء زوايا خفيف ليتناسب مع الهالة
        padding: "4px",
        transition: "all 0.3s ease"
      }}
    >
      {renderIcon()}
    </div>
  );
}
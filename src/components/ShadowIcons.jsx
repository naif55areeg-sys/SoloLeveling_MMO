import { SHADOW_TIER_COLOR } from "../constants/gameData";

// ─── SHADOW SOLDIER SHAPE (طيف/جندي ظل — قلنسوة، طوق مرتفع، وعباءة بثلاث أطراف) ──
export function ShadowSoldierShape({ color, size = 56, uid }) {
  const body = `shadowBody-${uid}`, glow = `shadowGlow-${uid}`, eyeGlow = `shadowEye-${uid}`, collar = `shadowCollar-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ filter: `drop-shadow(0 4px 14px ${color}99)` }}>
      <defs>
        <radialGradient id={glow} cx="50%" cy="35%" r="62%">
          <stop offset="0%" stopColor={color} stopOpacity="0.38" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={body} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#3b1574" />
          <stop offset="50%" stopColor="#180335" />
          <stop offset="100%" stopColor="#04000f" />
        </linearGradient>
        <linearGradient id={collar} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#3b1574" />
          <stop offset="100%" stopColor="#0d0220" />
        </linearGradient>
        <radialGradient id={eyeGlow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="38%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* هالة الظل */}
      <ellipse cx="32" cy="30" rx="27" ry="27" fill={`url(#${glow})`} />

      {/* طوق/قرنين مرتفعين خلف القلنسوة */}
      <path d="M22 26 C 16 22, 10 16, 9 8 C 14 12, 19 17, 23 23 Z" fill={`url(#${collar})`} stroke={color} strokeWidth="0.5" strokeOpacity="0.5" />
      <path d="M42 26 C 48 22, 54 16, 55 8 C 50 12, 45 17, 41 23 Z" fill={`url(#${collar})`} stroke={color} strokeWidth="0.5" strokeOpacity="0.5" />

      {/* جسد العباءة بثلاث أطراف نظيفة بالأسفل */}
      <path
        d="M32 9 C 24 9, 17 15, 17 24 C 17 32, 15 40, 14 50 C 14 56, 18 58, 22 58 C 25 58, 26 52, 28 48 C 29 54, 30 60, 32 62 C 34 60, 35 54, 36 48 C 38 52, 39 58, 42 58 C 46 58, 50 56, 50 50 C 49 40, 47 32, 47 24 C 47 15, 40 9, 32 9 Z"
        fill={`url(#${body})`} stroke={color} strokeWidth="0.6" strokeOpacity="0.45"
      />

      {/* فتحة القلنسوة (ظل الوجه) */}
      <ellipse cx="32" cy="21" rx="9.5" ry="11.5" fill="#000000" opacity="0.9" />
      <path d="M23 19 Q26 9, 32 8 Q38 9, 41 19" fill="none" stroke={color} strokeWidth="0.7" opacity="0.4" />

      {/* العينين المتوهجتين */}
      <ellipse cx="27.5" cy="22" rx="2.4" ry="1.5" fill={`url(#${eyeGlow})`} />
      <ellipse cx="36.5" cy="22" rx="2.4" ry="1.5" fill={`url(#${eyeGlow})`} />
      <ellipse cx="27.5" cy="22" rx="0.9" ry="0.6" fill="#ffffff" />
      <ellipse cx="36.5" cy="22" rx="0.9" ry="0.6" fill="#ffffff" />

      {/* خط الصدر */}
      <path d="M28 32 L 32 46 L 36 32" fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />
    </svg>
  );
}

// ─── SHADOW SOLDIER ICON DISPATCHER ──────────────────────────────────────────
export function ShadowSoldierIcon({ tier, size = 56, uid }) {
  const color = SHADOW_TIER_COLOR[tier] || "#a855f7";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 10, padding: 4 }}>
      <ShadowSoldierShape color={color} size={size} uid={uid} />
    </div>
  );
}

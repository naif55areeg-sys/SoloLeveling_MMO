import { useRef } from "react";
import { T, glass } from "../constants/tokens";

// ─── HUD CORNERS ──────────────────────────────────────────────────────────────
export function HudCorners({ color = T.purple, size = 14 }) {
  const s = { position: "absolute", width: size, height: size };
  const bv = `2px solid ${color}`;
  return (
    <>
      <span style={{ ...s, top: 0, left: 0,    borderTop: bv,    borderLeft: bv   }} />
      <span style={{ ...s, top: 0, right: 0,   borderTop: bv,    borderRight: bv  }} />
      <span style={{ ...s, bottom: 0, left: 0, borderBottom: bv, borderLeft: bv   }} />
      <span style={{ ...s, bottom: 0, right: 0,borderBottom: bv, borderRight: bv  }} />
    </>
  );
}

// ─── RANK BADGE ───────────────────────────────────────────────────────────────
export function RankBadge({ rank, size = 36 }) {
  const isTop = !!rank.top;
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
      {isTop && [0, 1].map((i) => (
        <span key={i} style={{
          position: "absolute", inset: -10 - i * 9, borderRadius: 999,
          border: `1px solid ${rank.color}40`, animation: `pulse-ring ${2.2 + i * 0.6}s ease-in-out infinite`,
        }} />
      ))}
      <span style={{
        fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: size, letterSpacing: 1, position: "relative",
        ...(rank.title === "SSS-RANK"
          ? {
            backgroundImage: `linear-gradient(90deg, ${T.gold}, ${T.purple}, ${T.cyan}, ${T.gold})`,
            backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", animation: "shimmerText 2.6s linear infinite",
            filter: `drop-shadow(0 0 16px ${T.purple}80)`,
          }
          : { color: rank.color, textShadow: isTop ? `0 0 18px ${rank.color}90` : `0 0 10px ${rank.color}50` }),
      }}>
        {rank.title}
      </span>
    </span>
  );
}

// ─── EXP BAR ──────────────────────────────────────────────────────────────────
export function ExpBar({ exp, expToNext, color = T.purple, height = 8 }) {
  const pct = Math.min(100, (exp / expToNext) * 100);
  return (
    <div style={{ height, background: "rgba(139,92,246,0.12)", borderRadius: height / 2, overflow: "hidden", position: "relative" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${T.glowBlue}, ${color})`, borderRadius: height / 2, transition: "width 0.4s ease-out", position: "relative", overflow: "hidden" }}>
        {pct > 0 && <div style={{ position: "absolute", top: 0, bottom: 0, width: "40%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)", animation: "shimmerSweep 2.4s linear infinite" }} />}
      </div>
    </div>
  );
}

// ─── AMBIENT PARTICLES ────────────────────────────────────────────────────────
export function AmbientParticles({ count = 16 }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100, top: Math.random() * 100,
      size: 2 + Math.random() * 3, dur: 6 + Math.random() * 9, delay: Math.random() * 6,
      color: [T.purple, T.cyan, T.blue][i % 3],
    }))
  ).current;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size,
          borderRadius: "50%", background: p.color, boxShadow: `0 0 6px ${p.color}`,
          animation: `particleFloat ${p.dur}s ease-in-out infinite`, animationDelay: `${p.delay}s`,
        }} />
      ))}
    </div>
  );
}

// ─── SIGNATURE MARK (Ctrl+M) ──────────────────────────────────────────────────
export function SignatureMark({ visible }) {
  if (!visible) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 300, animation: "popIn 0.4s ease-out both" }}>
      <div style={{
        ...glass({ padding: "12px 22px" }),
        border: `1px solid ${T.gold}80`,
        boxShadow: `0 0 30px ${T.gold}50, 0 10px 30px rgba(0,0,0,0.4)`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, boxShadow: `0 0 8px ${T.gold}`, animation: "pulseOpacity 1.6s infinite" }} />
        <span style={{ fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: 16, letterSpacing: 4, color: T.gold, textShadow: `0 0 16px ${T.gold}80` }}>
          NYVORA
        </span>
      </div>
    </div>
  );
}

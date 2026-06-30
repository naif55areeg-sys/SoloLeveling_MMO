import { useState, useEffect, useRef } from "react";
import { T, glass } from "../constants/tokens";
import { TIER_COLOR, TIER_TOP, ACHIEVEMENT_TIERS, SHADOW_TIER_COLOR, SHADOW_EXTRACT } from "../constants/gameData";
import { RankBadge } from "./UI";
import { ItemIcon } from "./LootIcons";
import { ShadowSoldierIcon } from "./ShadowIcons";

// ─── LEVEL UP TOAST ───────────────────────────────────────────────────────────
export function LevelUpToast({ info, onDone }) {
  useEffect(() => {
    if (!info) return;
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [info, onDone]);

  if (!info) return null;
  return (
    <div style={{ position: "fixed", top: 90, left: "50%", zIndex: 200, animation: "toastIn 0.45s ease-out both, toastOut 0.4s ease-in 2.3s both" }}>
      <div style={{
        ...glass({ padding: "20px 36px" }), textAlign: "center",
        border: `1px solid ${info.rank.color}80`,
        boxShadow: `0 0 40px ${info.rank.color}40, 0 10px 30px rgba(0,0,0,0.4)`,
      }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: T.gold, marginBottom: 8 }}>
          ◈ {info.rankChanged ? "RANK UP" : "LEVEL UP"}
        </div>
        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 30, fontWeight: 900, color: T.text, marginBottom: info.rankChanged ? 8 : 0 }}>
          LV. {info.newLevel}
        </div>
        {info.rankChanged && <RankBadge rank={info.rank} size={22} />}
      </div>
    </div>
  );
}

// ─── ACHIEVEMENT TOAST ────────────────────────────────────────────────────────
export function AchievementToast({ info, onDone }) {
  useEffect(() => {
    if (!info) return;
    const t = setTimeout(onDone, 3600);
    return () => clearTimeout(t);
  }, [info, onDone]);

  const particles = useRef(
    Array.from({ length: 14 }, (_, i) => {
      const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 80 + Math.random() * 60;
      return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, delay: Math.random() * 0.15, size: 3 + Math.random() * 4 };
    })
  ).current;

  if (!info) return null;
  const tier = ACHIEVEMENT_TIERS[info.tier] || ACHIEVEMENT_TIERS.bronze;
  const color = tier.color;
  const isLegendary = info.tier === "legendary";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 450, display: "flex", alignItems: "center", justifyContent: "center",
      pointerEvents: "none", animation: "fadeIn 0.25s ease-out both",
    }}>
      <div style={{ position: "relative", animation: "toastIn 0.5s cubic-bezier(.34,1.56,.64,1) both, toastOut 0.4s ease-in 3.1s both" }}>
        {/* جسيمات منفجرة عند الظهور */}
        <div style={{ position: "absolute", top: "50%", left: "50%", width: 1, height: 1 }}>
          {particles.map((p, i) => (
            <span key={i} style={{
              position: "absolute", left: 0, top: 0, width: p.size, height: p.size, borderRadius: "50%",
              background: color, boxShadow: `0 0 8px ${color}`,
              "--fx": `${p.x}px`, "--fy": `${p.y}px`,
              animation: `flyOut 1s cubic-bezier(.2,.8,.2,1) ${p.delay}s forwards`,
            }} />
          ))}
        </div>

        {/* هالة دوّارة للإنجازات الأسطورية */}
        {isLegendary && (
          <div style={{ position: "absolute", inset: -40, opacity: 0.18, pointerEvents: "none", background: `conic-gradient(from 0deg, ${color}, transparent, ${color})`, animation: "auraSpin 5s linear infinite" }} />
        )}
        {[0, 1].map((i) => (
          <div key={i} style={{ position: "absolute", inset: -16 - i * 12, borderRadius: 20, border: `1px solid ${color}35`, animation: `pulse-ring ${2 + i * 0.5}s ease-in-out infinite` }} />
        ))}

        <div style={{
          ...glass({ padding: "26px 40px" }), textAlign: "center", position: "relative", minWidth: 260,
          border: `1px solid ${color}90`,
          boxShadow: `0 0 50px ${color}50, 0 20px 50px rgba(0,0,0,0.5)`,
        }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: T.gold, marginBottom: 10 }}>
            🏆 إنجاز جديد مُفتوح
          </div>

          <div style={{ fontSize: 56, marginBottom: 10, filter: `drop-shadow(0 0 18px ${color}90)`, animation: "itemFloat 3s ease-in-out infinite" }}>
            {info.icon}
          </div>

          <div style={{
            fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: 22, marginBottom: 6,
            ...(isLegendary
              ? { backgroundImage: `linear-gradient(90deg, ${T.gold}, ${color}, ${T.cyan}, ${T.gold})`, backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "shimmerText 2.2s linear infinite" }
              : { color, textShadow: `0 0 16px ${color}80` }),
          }}>
            {info.title}
          </div>

          <div style={{ fontSize: 13, color: T.text, opacity: 0.85, marginBottom: 10 }}>{info.desc}</div>

          <div style={{
            display: "inline-block", fontFamily: "monospace", fontSize: 10, fontWeight: 700, letterSpacing: 2,
            color, background: `${color}1a`, border: `1px solid ${color}55`, borderRadius: 6, padding: "4px 12px",
          }}>
            {tier.label.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SHADOW ARISE MODAL ───────────────────────────────────────────────────────
export function ShadowAriseModal({ info, onDone }) {
  const [phase, setPhase] = useState("seal"); // seal | rising | revealed

  useEffect(() => {
    if (info) setPhase("seal");
  }, [info]);

  useEffect(() => {
    if (phase === "revealed") {
      const t = setTimeout(onDone, 3800);
      return () => clearTimeout(t);
    }
  }, [phase, onDone]);

  const particles = useRef(
    Array.from({ length: 18 }, (_, i) => {
      const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 90 + Math.random() * 80;
      return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, delay: Math.random() * 0.14, size: 3 + Math.random() * 4 };
    })
  ).current;

  if (!info) return null;
  const color = SHADOW_TIER_COLOR[info.tier] || T.purple;
  const cfg = SHADOW_EXTRACT[info.tier] || {};

  const breakSeal = () => {
    if (phase !== "seal") return;
    setPhase("rising");
    setTimeout(() => setPhase("revealed"), 650);
  };

  return (
    <div
      onClick={() => phase === "revealed" && onDone()}
      style={{
        position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(4,0,15,0.82)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        animation: "fadeIn 0.3s ease-out both", cursor: phase === "revealed" ? "pointer" : "default",
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: 290, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>

        {phase !== "revealed" && (
          <div
            onClick={breakSeal}
            style={{
              position: "relative", cursor: phase === "seal" ? "pointer" : "default",
              animation: phase === "seal" ? "giftBounce 1.8s ease-in-out infinite" : "giftShake 0.55s ease-in-out",
            }}
          >
            {[0, 1].map((i) => (
              <div key={i} style={{ position: "absolute", inset: -16 - i * 14, borderRadius: "50%", border: `1px solid ${color}40`, animation: `pulse-ring ${2 + i * 0.6}s ease-in-out infinite` }} />
            ))}
            <div style={{ fontSize: 80, filter: `drop-shadow(0 0 26px ${color}90)` }}>🌑</div>
            {phase === "rising" && (
              <div style={{ position: "absolute", inset: -40, borderRadius: "50%", background: `radial-gradient(circle, ${color}, transparent 70%)`, animation: "giftFlash 0.55s ease-out forwards" }} />
            )}
          </div>
        )}

        {phase === "seal" && (
          <div style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: 2, color: T.muted, animation: "pulseOpacity 1.8s infinite", textAlign: "center" }}>
            🌑 شعرت بوجود ظل خاضع — اضغط للأمر بالانبعاث
          </div>
        )}

        {phase === "revealed" && (
          <>
            <div style={{ position: "absolute", top: -10, width: 1, height: 1 }}>
              {particles.map((p, i) => (
                <span key={i} style={{
                  position: "absolute", left: 0, top: 0, width: p.size, height: p.size, borderRadius: "50%",
                  background: color, boxShadow: `0 0 8px ${color}`,
                  "--fx": `${p.x}px`, "--fy": `${p.y}px`,
                  animation: `flyOut 0.95s cubic-bezier(.2,.8,.2,1) ${p.delay}s forwards`,
                }} />
              ))}
            </div>

            <div style={{ position: "relative", animation: "itemPop 0.5s cubic-bezier(.34,1.56,.64,1) both" }}>
              {[0, 1].map((i) => (
                <div key={i} style={{ position: "absolute", inset: -18 - i * 12, borderRadius: "50%", border: `1px solid ${color}40`, animation: `pulse-ring ${2 + i * 0.5}s ease-in-out infinite` }} />
              ))}
              <div style={{
                ...glass({ padding: "28px 36px" }), textAlign: "center",
                border: `1px solid ${color}90`,
                boxShadow: `0 0 50px ${color}50, 0 20px 50px rgba(0,0,0,0.5)`,
                minWidth: 230,
              }}>
                <div style={{
                  fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: 30, marginBottom: 4,
                  color, textShadow: `0 0 26px ${color}`, letterSpacing: 3,
                }}>ARISE!</div>
                <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, color: T.gold, marginBottom: 14 }}>
                  ◈ {info.duplicate ? "خبرة مضاعفة لجندي ظل موجود" : "جندي ظل جديد انضم لجيشك"}
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                  <div style={{ animation: "itemFloat 3.6s ease-in-out infinite" }}>
                    <ShadowSoldierIcon tier={info.tier} uid="arise-reveal" size={72} />
                  </div>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 6 }}>{info.name}</div>
                <div style={{
                  display: "inline-block", fontFamily: "monospace", fontSize: 10, fontWeight: 700, letterSpacing: 2,
                  color, background: `${color}1a`, border: `1px solid ${color}55`, borderRadius: 6, padding: "4px 12px",
                }}>
                  {(cfg.label || info.tier).toUpperCase()} · LV.{info.level || 1}
                </div>
              </div>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: T.muted, marginTop: 6 }}>اضغط في أي مكان للإغلاق</div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── LOOT REVEAL MODAL ────────────────────────────────────────────────────────
export function LootRevealModal({ info, onDone }) {
  const [phase, setPhase] = useState("box"); // box | opening | revealed

  useEffect(() => {
    if (info) setPhase("box");
  }, [info]);

  useEffect(() => {
    if (phase === "revealed") {
      const t = setTimeout(onDone, 3400);
      return () => clearTimeout(t);
    }
  }, [phase, onDone]);

  const particles = useRef(
    Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 90 + Math.random() * 70;
      return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, delay: Math.random() * 0.12, size: 3 + Math.random() * 4 };
    })
  ).current;

  if (!info) return null;
  const color = TIER_COLOR[info.tier];
  const isTop = !!TIER_TOP[info.tier];
  const isSSS = info.tier === "SSS";

  const openBox = () => {
    if (phase !== "box") return;
    setPhase("opening");
    setTimeout(() => setPhase("revealed"), 550);
  };

  return (
    <div
      onClick={() => phase === "revealed" && onDone()}
      style={{
        position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(4,0,15,0.72)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        animation: "fadeIn 0.3s ease-out both", cursor: phase === "revealed" ? "pointer" : "default",
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: 280, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>

        {phase !== "revealed" && (
          <div
            onClick={openBox}
            style={{
              position: "relative", cursor: phase === "box" ? "pointer" : "default",
              animation: phase === "box" ? "giftBounce 1.6s ease-in-out infinite" : "giftShake 0.5s ease-in-out",
            }}
          >
            {[0, 1].map((i) => (
              <div key={i} style={{ position: "absolute", inset: -16 - i * 14, borderRadius: "50%", border: `1px solid ${color}40`, animation: `pulse-ring ${2 + i * 0.6}s ease-in-out infinite` }} />
            ))}
            <div style={{ fontSize: 84, filter: `drop-shadow(0 0 24px ${color}80)` }}>🎁</div>
            {phase === "opening" && (
              <div style={{ position: "absolute", inset: -40, borderRadius: "50%", background: `radial-gradient(circle, ${color}, transparent 70%)`, animation: "giftFlash 0.5s ease-out forwards" }} />
            )}
          </div>
        )}

        {phase === "box" && (
          <div style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: 2, color: T.muted, animation: "pulseOpacity 1.8s infinite" }}>
            🎁 لووت جديد — اضغط للفتح
          </div>
        )}

        {phase === "revealed" && (
          <>
            <div style={{ position: "absolute", top: -10, width: 1, height: 1 }}>
              {particles.map((p, i) => (
                <span key={i} style={{
                  position: "absolute", left: 0, top: 0, width: p.size, height: p.size, borderRadius: "50%",
                  background: color, boxShadow: `0 0 8px ${color}`,
                  "--fx": `${p.x}px`, "--fy": `${p.y}px`,
                  animation: `flyOut 0.9s cubic-bezier(.2,.8,.2,1) ${p.delay}s forwards`,
                }} />
              ))}
            </div>

            <div style={{ position: "relative", animation: "itemPop 0.5s cubic-bezier(.34,1.56,.64,1) both" }}>
              {isTop && [0, 1].map((i) => (
                <div key={i} style={{ position: "absolute", inset: -18 - i * 12, borderRadius: "50%", border: `1px solid ${color}40`, animation: `pulse-ring ${2 + i * 0.5}s ease-in-out infinite` }} />
              ))}
              <div style={{
                ...glass({ padding: "28px 36px" }), textAlign: "center",
                border: `1px solid ${color}90`,
                boxShadow: `0 0 50px ${color}50, 0 20px 50px rgba(0,0,0,0.5)`,
                minWidth: 220,
              }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                  <div style={{ animation: "itemFloat 3.6s ease-in-out infinite" }}>
                    <ItemIcon name={info.name} tier={info.tier} uid="reveal" size={72} />
                  </div>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: T.gold, marginBottom: 10 }}>◈ حصلت على</div>
                <div style={{
                  fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: 26, marginBottom: 10,
                  ...(isSSS
                    ? { backgroundImage: `linear-gradient(90deg, ${T.gold}, ${T.purple}, ${T.cyan}, ${T.gold})`, backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "shimmerText 2.2s linear infinite" }
                    : { color, textShadow: isTop ? `0 0 18px ${color}90` : "none" }),
                }}>[{info.tier}]</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{info.name}</div>
              </div>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: T.muted, marginTop: 6 }}>اضغط في أي مكان للإغلاق</div>
          </>
        )}
      </div>
    </div>
  );
}

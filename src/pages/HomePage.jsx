import { useEffect, useState } from "react";
import { T, glass } from "../constants/tokens";
import { STAT_KEYS, rankFromLevel, SLOT_ORDER, SLOT_LABEL, SLOT_STAT, TIER_COLOR, ACHIEVEMENTS, ACHIEVEMENT_TIERS } from "../constants/gameData";
import { HudCorners, RankBadge, ExpBar } from "../components/UI";
import { ItemIcon } from "../components/LootIcons";
import { itemBonusValue } from "../constants/gameLogic";

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function lighten(hex, amount = 55) {
  const { r, g, b } = hexToRgb(hex);
  const c = (v) => Math.min(255, v + amount).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
function getRankColors(rank) {
  const core = rank?.color ?? T.red;
  const { r, g, b } = hexToRgb(core);
  const spark = lighten(core, 55);
  const glow = `rgba(${r},${g},${b},0.45)`;
  const aura = `rgba(${r},${g},${b},0.18)`;
  const dk = (v) => Math.max(0, Math.round(v * 0.22)).toString(16).padStart(2, "0");
  const base = `#${dk(r)}${dk(g)}${dk(b)}`;
  return { core, spark, glow, aura, base };
}

// ─── STAT ROW ────────────────────────────────────────────────────────────────
function StatRow({ label, value, color, delay }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let cur = 0;
      const step = Math.ceil(value / 30);
      const iv = setInterval(() => {
        cur = Math.min(cur + step, value);
        setDisplayed(cur);
        if (cur >= value) clearInterval(iv);
      }, 25);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div style={{ ...glass({ padding: "10px 14px" }), textAlign: "center", position: "relative", overflow: "hidden", animation: `fadeUp 0.4s ease-out ${delay}ms both` }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${(value / 200) * 100}%`, background: `${color}08`, transition: "height 1s ease" }} />
      <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, fontWeight: 900, color, textShadow: `0 0 14px ${color}60`, position: "relative" }}>{displayed}</div>
      <div style={{ fontFamily: "monospace", fontSize: 8, color: T.muted, letterSpacing: 3, marginTop: 3 }}>{label}</div>
    </div>
  );
}

const STAT_COLORS = { STR: "#ef4444", AGI: "#22d3ee", VIT: "#10b981", INT: "#a855f7", SENSE: "#fbbf24" };

// ─── EQUIPPED GEAR STRIP ─────────────────────────────────────────────────────
function EquippedGear({ state, onNavigate }) {
  const equipped = state.equipped || {};
  const inventory = state.inventory || [];
  const slots = SLOT_ORDER.map((slot) => {
    const key = equipped[slot];
    const item = key ? inventory.find((it) => `${it.tier}-${it.name}` === key) : null;
    return { slot, item };
  });
  const anyEquipped = slots.some((s) => s.item);

  return (
    <div onClick={() => onNavigate("LOOT")} style={{ ...glass({ padding: "14px 18px" }), marginBottom: 16, cursor: "pointer", position: "relative", overflow: "hidden" }}>
      <HudCorners size={9} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: T.purple }}>◈ التجهيز النشط</span>
          {anyEquipped && (
            <span style={{ fontFamily: "monospace", fontSize: 9, color: T.gold, background: "rgba(251,191,36,0.1)", border: `1px solid ${T.gold}40`, borderRadius: 4, padding: "1px 6px" }}>
              {slots.filter((s) => s.item).length} / {slots.length} مجهّز
            </span>
          )}
        </div>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: T.muted }}>المخزون ▶</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {slots.map(({ slot, item }) => {
          const color = item ? TIER_COLOR[item.tier] : "transparent";
          const bonus = item ? itemBonusValue(item) : 0;
          const statKey = SLOT_STAT[slot];
          return (
            <div key={slot} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, position: "relative" }}>
              <div style={{ width: "100%", aspectRatio: "1", minWidth: 48, maxWidth: 72, borderRadius: 10, background: item ? `radial-gradient(circle at 35% 30%,${color}22,${color}08)` : "rgba(255,255,255,0.03)", border: item ? `1px solid ${color}55` : "1px dashed rgba(255,255,255,0.10)", boxShadow: item ? `0 0 12px ${color}30` : "none", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease", position: "relative", overflow: "hidden" }}>
                {item && <div style={{ position: "absolute", inset: 0, background: `linear-gradient(105deg,transparent 40%,${color}18 50%,transparent 60%)`, animation: "shimmerSweep 3s ease-in-out infinite", pointerEvents: "none" }} />}
                {item ? (
                  <div style={{ animation: "itemFloat 3.5s ease-in-out infinite" }}>
                    <ItemIcon name={item.name} tier={item.tier} uid={`home-${slot}`} size={38} />
                  </div>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" opacity="0.2">
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke="white" strokeWidth="1.5" strokeDasharray="4 2" />
                    <line x1="12" y1="8" x2="12" y2="16" stroke="white" strokeWidth="1.5" />
                    <line x1="8" y1="12" x2="16" y2="12" stroke="white" strokeWidth="1.5" />
                  </svg>
                )}
                {item && <div style={{ position: "absolute", top: 3, right: 3, fontFamily: "'Orbitron',monospace", fontSize: 7, fontWeight: 900, color, background: "rgba(0,0,0,0.6)", borderRadius: 3, padding: "1px 3px", lineHeight: 1 }}>{item.tier}{item.level > 0 ? `+${item.level}` : ""}</div>}
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 8, color: item ? color : T.muted, letterSpacing: 1, textAlign: "center" }}>{SLOT_LABEL[slot]}</div>
              {item ? <div style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, color: T.gold, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap" }}>{statKey} +{bonus}</div>
                : <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.12)" }}>{statKey} —</div>}
            </div>
          );
        })}
      </div>
      {!anyEquipped && <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 11, color: T.muted, marginTop: 10, opacity: 0.6 }}>لا يوجد تجهيز نشط — اذهب للمخزون</div>}
    </div>
  );
}

// ─── MANA CORE CHARACTER ─────────────────────────────────────────────────────
function ManaCore({ rank }) {
  const [manaValue, setManaValue] = useState(4850);
  const colors = getRankColors(rank);

  useEffect(() => {
    const id = setInterval(() => {
      setManaValue((p) => {
        const n = p + Math.floor(Math.random() * 11) - 5;
        return n > 5000 ? 5000 : n < 4700 ? 4700 : n;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ width: 240, height: 240, position: "relative", display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0, animation: "float 4s ease-in-out infinite" }}>
      <style>{`
        @keyframes rotCW  { to { transform: rotate(360deg);  } }
        @keyframes rotCCW { to { transform: rotate(-360deg); } }
        @keyframes flameWave {
          0%,100%{ border-radius:42% 58% 45% 55%/45% 45% 55% 55%; transform:scale(1) rotate(0deg); }
          33%    { border-radius:50% 50% 40% 60%/40% 55% 45% 60%; transform:scale(1.05,1.1) rotate(2deg); }
          66%    { border-radius:45% 55% 50% 45%/55% 40% 60% 45%; transform:scale(0.97,1.05) rotate(-2deg); }
        }
        @keyframes ptRise {
          0%  { transform:translateY(20px) translateX(0) scale(1); opacity:0; }
          20% { opacity:1; }
          80% { opacity:.8; }
          100%{ transform:translateY(-110px) translateX(var(--xm)) scale(0); opacity:0; }
        }
      `}</style>

      {/* back flame */}
      <div style={{ position: "absolute", width: "90%", height: "115%", bottom: "-8%", background: `linear-gradient(to top,transparent 0%,${colors.base} 30%,${colors.core} 70%,transparent 100%)`, animation: "flameWave 4s ease-in-out infinite", filter: "blur(14px)", opacity: 0.65, mixBlendMode: "screen", zIndex: 1 }} />
      {/* front flame */}
      <div style={{ position: "absolute", width: "78%", height: "125%", bottom: "-6%", background: `linear-gradient(to top,transparent 10%,${colors.core} 50%,${colors.spark} 85%,transparent 100%)`, animation: "flameWave 2.8s ease-in-out infinite 0.4s", filter: "blur(6px)", opacity: 0.55, mixBlendMode: "plus-lighter", zIndex: 2 }} />

      {/* particles */}
      {[{ l: "25%", d: "0s", s: 6, x: "-20px" }, { l: "48%", d: "0.5s", s: 4, x: "14px" }, { l: "68%", d: "1.1s", s: 5, x: "-10px" }, { l: "35%", d: "1.6s", s: 3, x: "22px" }, { l: "58%", d: "0.2s", s: 5, x: "-14px" }].map((p, i) => (
        <div key={i} style={{ position: "absolute", bottom: "12%", left: p.l, width: p.s, height: p.s, borderRadius: "50%", background: colors.core, boxShadow: `0 0 10px ${colors.core}`, animation: `ptRise ${2 + i * 0.3}s infinite linear`, animationDelay: p.d, "--xm": p.x }} />
      ))}

      {/* outer rotating ring */}
      <svg viewBox="0 0 200 200" style={{ position: "absolute", width: "100%", height: "100%", animation: "rotCW 22s linear infinite", opacity: 0.55, zIndex: 3 }}>
        <circle cx="100" cy="100" r="92" fill="none" stroke={colors.core} strokeWidth="1.2" strokeDasharray="10 28" />
      </svg>
      {/* inner ring */}
      <svg viewBox="0 0 200 200" style={{ position: "absolute", width: "84%", height: "84%", animation: "rotCCW 14s linear infinite", opacity: 0.7, zIndex: 3 }}>
        <circle cx="100" cy="100" r="80" fill="none" stroke={colors.core} strokeWidth="0.8" strokeDasharray="6 10" />
        <circle cx="100" cy="100" r="80" fill="none" stroke={colors.core} strokeWidth="3" strokeDasharray="260 400" strokeLinecap="round" />
      </svg>

      {/* dark core */}
      <div style={{ position: "absolute", width: "72%", height: "72%", borderRadius: "50%", background: "radial-gradient(circle,rgba(0,0,0,0) 20%,#000000f5 90%)", border: `1px dashed ${colors.glow}`, boxShadow: `inset 0 0 28px ${colors.glow}, 0 0 20px ${colors.glow}`, zIndex: 3 }} />

      {/* MP text */}
      <div style={{ position: "absolute", bottom: "8%", display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "'Orbitron',monospace", zIndex: 5, textShadow: `0 0 12px ${colors.core},0 0 24px #000`, pointerEvents: "none" }}>
        <span style={{ fontSize: 8, color: colors.core, letterSpacing: 2, fontWeight: "bold" }}>MP CORE</span>
        <span style={{ fontSize: 16, color: "#fff", fontWeight: 900, marginTop: 1 }}>{manaValue} <span style={{ fontSize: 10, color: T.muted }}>/ 5000</span></span>
      </div>

      {/* character image */}
      <img src="https://i.postimg.cc/sxDncP2Z/naif.webp" alt="Hunter" style={{ width: "73%", height: "73%", objectFit: "contain", zIndex: 4, filter: `drop-shadow(0 0 14px ${colors.glow}) drop-shadow(0 0 4px ${colors.core})` }} />
    </div>
  );
}

// ─── DAILY PROGRESS RING ─────────────────────────────────────────────────────
function DailyRing({ state }) {
  const todayQuests = state.quests.filter((q) => q.frequency !== "once");
  const done = todayQuests.filter((q) => q.completed).length;
  const total = todayQuests.length || 1;
  const pct = done / total;
  const r = 28, circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = pct === 1 ? T.green : pct > 0.5 ? T.cyan : T.purple;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <svg width="68" height="68" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 34 34)" style={{ transition: "stroke-dasharray 0.5s ease, stroke 0.3s" }}
          filter={`drop-shadow(0 0 4px ${color})`} />
        <text x="34" y="38" textAnchor="middle" fontFamily="'Orbitron',monospace" fontSize="13" fontWeight="900" fill={color}>{done}/{total}</text>
      </svg>
      <div>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: T.cyan, marginBottom: 3 }}>◈ مهام اليوم</div>
        <div style={{ fontSize: 13, color: T.text }}>{done < total ? `باقي ${total - done} مهمة` : "✓ أنجزت الكل!"}</div>
      </div>
    </div>
  );
}

// ─── ACHIEVEMENT STRIP (profile) ──────────────────────────────────────────────
function AchievementStrip({ state, onNavigate }) {
  const unlockedIds = state.unlockedAchievements || [];
  const total = ACHIEVEMENTS.length;
  if (total === 0) return null;

  const unlockedAchs = ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id));
  const pct = Math.round((unlockedAchs.length / total) * 100);

  // رتب حسب الرتبة: legendary ثم gold ثم silver ثم bronze
  const TIER_ORDER = ["legendary", "gold", "silver", "bronze"];
  const sorted = [...unlockedAchs].sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
  // عرض أحدث 10 فقط
  const preview = sorted.slice(0, 10);
  const remaining = unlockedAchs.length - preview.length;

  return (
    <div
      onClick={() => onNavigate("ACHIEVEMENTS")}
      style={{
        ...glass({ padding: "16px 18px" }),
        marginBottom: 16, cursor: "pointer", position: "relative", overflow: "hidden",
        border: `1px solid ${T.gold}25`,
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 28px ${T.gold}25, 0 8px 30px rgba(0,0,0,0.4)`;
        e.currentTarget.style.borderColor = `${T.gold}60`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.borderColor = `${T.gold}25`;
      }}
    >
      <HudCorners size={9} color={T.gold} />

      {/* خلفية */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 10% 50%, ${T.gold}08, transparent 60%)`, pointerEvents: "none" }} />

      {/* الهيدر */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16, filter: `drop-shadow(0 0 6px ${T.gold})` }}>🏆</span>
          <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: T.gold }}>ACHIEVEMENTS</span>
          {unlockedAchs.length === 0 && (
            <span style={{ fontFamily: "monospace", fontSize: 9, color: T.muted }}>— لا يوجد بعد</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "monospace", fontSize: 10, color: T.gold, fontWeight: 700 }}>{unlockedAchs.length}/{total}</span>
          <span style={{ fontFamily: "monospace", fontSize: 9, color: T.muted }}>▶</span>
        </div>
      </div>

      {/* شريط التقدم */}
      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: unlockedAchs.length > 0 ? 14 : 0, position: "relative" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${T.gold}80, #fde68a, ${T.gold})`,
          backgroundSize: "200% auto",
          borderRadius: 99,
          boxShadow: `0 0 8px ${T.gold}80`,
          animation: "shimmerText 2.5s linear infinite",
          transition: "width 0.6s ease",
        }} />
      </div>

      {/* الإنجازات */}
      {unlockedAchs.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, position: "relative" }}>
          {preview.map((ach) => {
            const tier = ACHIEVEMENT_TIERS[ach.tier] || ACHIEVEMENT_TIERS.bronze;
            const color = tier.color;
            const isLegendary = ach.tier === "legendary";
            const isGold = ach.tier === "gold";
            return (
              <div
                key={ach.id}
                title={`${ach.title} — ${ach.desc}`}
                style={{
                  width: 44, height: 44, borderRadius: 11,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                  background: `${color}15`,
                  border: `1px solid ${color}55`,
                  boxShadow: (isLegendary || isGold)
                    ? `0 0 14px ${color}60, inset 0 0 6px ${color}20`
                    : `0 0 6px ${color}30`,
                  position: "relative", overflow: "hidden",
                  filter: `drop-shadow(0 0 ${isLegendary ? 8 : 4}px ${color}${isLegendary ? "cc" : "70"})`,
                  transition: "transform 0.15s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.18) translateY(-2px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = ""}
              >
                {/* هالة دوّارة للأسطوري والذهبي */}
                {(isLegendary || isGold) && (
                  <div style={{
                    position: "absolute", inset: -6, opacity: 0.25, pointerEvents: "none",
                    background: `conic-gradient(from 0deg, ${color}, transparent, ${color})`,
                    animation: `auraSpin ${isLegendary ? 4 : 7}s linear infinite`,
                  }} />
                )}
                {ach.icon}
              </div>
            );
          })}
          {/* المتبقي */}
          {remaining > 0 && (
            <div style={{
              width: 44, height: 44, borderRadius: 11,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 900,
              color: T.gold,
              background: "rgba(251,191,36,0.08)",
              border: `1px solid ${T.gold}30`,
            }}>+{remaining}</div>
          )}
        </div>
      )}

      {/* حالة فارغة */}
      {unlockedAchs.length === 0 && (
        <div style={{
          textAlign: "center", fontFamily: "monospace", fontSize: 11,
          color: T.muted, paddingTop: 4, opacity: 0.6,
        }}>
          أكمل مهاماً وبوابات لفتح إنجازاتك
        </div>
      )}
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
export function HomePage({ state, onNavigate, user, onLogin, onLogout }) {
  const rank = rankFromLevel(state.level);
  const colors = getRankColors(rank);

  return (
    <div style={{ minHeight: "100vh", padding: "80px 24px 40px", maxWidth: 760, margin: "0 auto", animation: "fadeIn 0.4s ease-out both", position: "relative" }}>

      {/* ── MAIN PROFILE CARD ── */}
      <div style={{ ...glass({ padding: 28 }), position: "relative", marginBottom: 16, overflow: "hidden", border: `1px solid ${colors.core}30` }}>
        <HudCorners size={14} color={colors.core} />

        {/* rank-colored corner glow */}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 260, background: `radial-gradient(ellipse at right, ${colors.glow} 0%, transparent 70%)`, pointerEvents: "none" }} />
        {/* top left accent */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 180, height: 120, background: `radial-gradient(ellipse at left top, ${colors.aura} 0%, transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
          {/* left */}
          <div style={{ flex: 1, minWidth: 0, zIndex: 2 }}>
            <div style={{ marginBottom: 8 }}><RankBadge rank={rank} size={15} /></div>
            <div key={state.level} style={{ fontFamily: "'Orbitron',monospace", fontSize: 44, fontWeight: 900, color: T.text, animation: "levelPop 0.5s ease-out both", textShadow: `0 0 40px ${colors.glow}, 0 0 80px ${colors.aura}`, lineHeight: 1 }}>
              LV. {state.level}
            </div>

            {state.statPoints > 0 && (
              <button onClick={() => onNavigate("STATS")} style={{ ...glass({ padding: "8px 14px" }), border: `1px solid ${T.gold}60`, cursor: "pointer", color: T.gold, fontFamily: "monospace", fontSize: 11, fontWeight: 700, animation: "pulseOpacity 1.6s infinite", marginTop: 12 }}>
                ✦ {state.statPoints} نقطة مهارة بانتظارك
              </button>
            )}

            {/* EXP */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "monospace", fontSize: 10, color: T.muted, marginBottom: 6 }}>
                <span style={{ color: colors.core }}>⬡ EXP</span>
                <span>{state.exp} / {state.expToNext}</span>
              </div>
              <div style={{ height: 10, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden", border: `1px solid ${colors.core}20` }}>
                <div style={{ height: "100%", width: `${(state.exp / state.expToNext) * 100}%`, background: `linear-gradient(90deg, ${T.glowBlue}, ${colors.core})`, borderRadius: 99, transition: "width 0.5s ease", boxShadow: `0 0 8px ${colors.core}60`, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)", animation: "shimmerSweep 2s linear infinite" }} />
                </div>
              </div>
            </div>
          </div>

          {/* right — mana core */}
          <div style={{ zIndex: 10, flexShrink: 0, marginRight: "-16px", marginTop: "-12px", marginBottom: "-12px" }}>
            <ManaCore rank={rank} />
          </div>
        </div>
      </div>

      {/* ── EQUIPPED GEAR ── */}
      <EquippedGear state={state} onNavigate={onNavigate} />

      {/* ── STATS GRID with counters ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10, marginBottom: 16 }}>
        {STAT_KEYS.map((k, i) => (
          <StatRow key={k} label={k} value={state.stats[k]} color={STAT_COLORS[k] || T.purple} delay={i * 80} />
        ))}
      </div>

      {/* ── QUEST SHORTCUT with progress ring ── */}
      <div onClick={() => onNavigate("QUESTS")} style={{ ...glass({ padding: "18px 22px" }), cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "box-shadow 0.2s", border: `1px solid ${T.border}` }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 0 24px ${T.purple}25, 0 10px 30px rgba(0,0,0,0.4)`}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)"}>
        <DailyRing state={state} />
        <div style={{ color: T.purple, fontSize: 20 }}>▶</div>
      </div>

      {/* ── ACHIEVEMENTS STRIP ── */}
      <AchievementStrip state={state} onNavigate={onNavigate} />

      {/* ── DISCORD LOGIN ── */}
      <DiscordCard user={user} onLogin={onLogin} onLogout={onLogout} />
    </div>
  );
}

// ─── DISCORD CARD ─────────────────────────────────────────────────────────────
function DiscordCard({ user, onLogin, onLogout }) {
  const [hovered, setHovered] = useState(false);

  if (user) {
    return (
      <div style={{ ...glass({ padding: "16px 20px" }), position: "relative", overflow: "hidden", border: "1px solid rgba(88,101,242,0.35)", marginTop: 12, animation: "fadeUp 0.4s ease-out both" }}>
        <HudCorners size={9} color="#5865f2" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, transparent 40%, rgba(88,101,242,0.06) 50%, transparent 60%)", animation: "shimmerSweep 4s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: "1px solid #5865f2", animation: "pulse-ring 2.5s ease-in-out infinite" }} />
            <img
              src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/0.png`}
              alt="avatar"
              style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid #5865f2", display: "block", position: "relative", zIndex: 1 }}
              onError={(e) => { e.target.src = `https://cdn.discordapp.com/embed/avatars/0.png`; }}
            />
            <div style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: "50%", background: "#23a55a", border: "2px solid #04000f", zIndex: 2 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#5865f2", marginBottom: 3 }}>◈ DISCORD LINKED</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 14, fontWeight: 700, color: "#e9d5ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.global_name || user.username}
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6b7280", marginTop: 2 }}>#{user.discriminator || "0000"}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(88,101,242,0.15)", border: "1px solid rgba(88,101,242,0.3)", borderRadius: 20, padding: "3px 10px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#23a55a", boxShadow: "0 0 6px #23a55a" }} />
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "#5865f2", fontWeight: 700 }}>متصل</span>
            </div>
            <button onClick={onLogout} style={{ fontFamily: "monospace", fontSize: 9, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>تسجيل خروج</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onLogin}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", marginTop: 12,
        padding: "18px 24px", borderRadius: 14,
        border: `1px solid ${hovered ? "#5865f2" : "rgba(88,101,242,0.28)"}`,
        background: hovered ? "linear-gradient(135deg,rgba(88,101,242,0.22),rgba(88,101,242,0.08))" : "linear-gradient(135deg,rgba(88,101,242,0.1),rgba(88,101,242,0.04))",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        boxShadow: hovered ? "0 0 30px rgba(88,101,242,0.3), 0 8px 30px rgba(0,0,0,0.5)" : "none",
        transition: "all 0.25s ease", position: "relative", overflow: "hidden",
        backdropFilter: "blur(20px)", animation: "fadeUp 0.4s ease-out both",
      }}
    >
      {hovered && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 30%,rgba(88,101,242,0.12) 50%,transparent 70%)", animation: "shimmerSweep 1.2s ease-out", pointerEvents: "none" }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: hovered ? "#5865f2" : "rgba(88,101,242,0.2)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s", flexShrink: 0, boxShadow: hovered ? "0 0 24px rgba(88,101,242,0.6)" : "none" }}>
          <svg width="24" height="18" viewBox="0 0 24 18" fill="white">
            <path d="M20.317 1.492a19.825 19.825 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.285 18.285 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 1.492a.07.07 0 0 0-.032.027C.533 6.093-.32 10.555.099 14.961a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.442a.061.061 0 0 0-.031-.03zM8.02 12.278c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#5865f2", marginBottom: 4 }}>◈ MULTIPLAYER</div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 14, fontWeight: 700, color: "#e9d5ff" }}>تسجيل دخول Discord</div>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6b7280", marginTop: 3 }}>للمنافسة واللوحة العالمية</div>
        </div>
      </div>
      <div style={{ color: hovered ? "#5865f2" : "#6b7280", fontSize: 18, transition: "all 0.2s", transform: hovered ? "translateX(-3px)" : "none" }}>▶</div>
    </button>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { T, glass } from "../constants/tokens";
import { GATE_DIFFICULTY, RANK_SKILLS, rankFromLevel, GATE_WEIGHTS, SHADOW_EXTRACT } from "../constants/gameData";
import { HudCorners } from "../components/UI";
import { hpColor, maxPlayerHp, todayStr, effectiveStats, rollLoot } from "../constants/gameLogic";
import { SoundManager } from "../utils/soundManager";

// ─── SOUND EFFECTS (تشغّل ملفات صوتية حقيقية عبر SoundManager المركزي) ─────────
// كل دالة هنا غلاف رقيق فوق SoundManager.play() — لإضافة مؤثر جديد:
// 1) ضيف الملف بمجلد public/assets/sounds
// 2) سجّله بـ SOUND_LIBRARY داخل utils/soundManager.js
// 3) أضف دالة sfxXxx() هنا بسطر واحد، واستخدمها بأي مكان بالقتال
function sfxSword() { SoundManager.play("sword"); }
function sfxHit() { SoundManager.play("hit"); }
function sfxBossRoar() { SoundManager.play("bossRoar"); }
function sfxCrit() { SoundManager.play("crit"); }
function sfxSkill() { SoundManager.play("skill"); }
function sfxHeal() { SoundManager.play("heal"); }
function sfxDodge() { SoundManager.play("dodge"); }
function sfxVictory() { SoundManager.play("victory"); }
function sfxDefeat() { SoundManager.play("defeat"); }

// ─── SPARK PARTICLES (جسيمات SVG خالصة) ──────────────────────────────────
function SparkParticles({ active, color = "#fbbf24", x = "50%", y = "50%", count = 14, isBoss = false }) {
  const [sparks, setSparks] = useState([]);
  const prevActive = useRef(false);

  useEffect(() => {
    if (active && !prevActive.current) {
      const newSparks = Array.from({ length: count }, (_, i) => {
        const angle = (Math.random() * 360);
        const speed = isBoss ? 60 + Math.random() * 80 : 30 + Math.random() * 60;
        const size = isBoss ? 2 + Math.random() * 4 : 1.5 + Math.random() * 3;
        const life = 0.4 + Math.random() * 0.4;
        const colors = isBoss
          ? ["#ff003c", "#fbbf24", "#ef4444", "#fff", "#ff6b6b"]
          : [color, "#fff", color + "cc"];
        return {
          id: i,
          angle,
          speed,
          size,
          life,
          col: colors[Math.floor(Math.random() * colors.length)],
          dx: Math.cos(angle * Math.PI / 180) * speed,
          dy: Math.sin(angle * Math.PI / 180) * speed,
        };
      });
      setSparks(newSparks);
      setTimeout(() => setSparks([]), 700);
    }
    prevActive.current = active;
  }, [active]);

  if (sparks.length === 0) return null;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50, overflow: "hidden" }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        {sparks.map(s => (
          <g key={s.id}>
            <line
              x1={x} y1={y}
              x2={`calc(${x} + ${s.dx}px)`} y2={`calc(${y} + ${s.dy}px)`}
              stroke={s.col} strokeWidth={s.size} strokeLinecap="round"
              style={{ animation: `sparkFly ${s.life}s ease-out forwards` }}
            />
            <circle
              cx={x} cy={y} r={s.size * 1.5}
              fill={s.col}
              style={{ animation: `sparkDot ${s.life * 0.8}s ease-out forwards` }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── SPARK CANVAS (بديل Canvas أكثر سلاسة) ─────────────────────────────────
function SparkCanvas({ trigger, color, isBoss, side }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const prevTrigger = useRef(null);

  useEffect(() => {
    if (!trigger || trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;

    // نقطة الانطلاق: وسط بطاقة العدو (يمين) أو اللاعب (يسار)
    const ox = side === "enemy" ? W * 0.5 : W * 0.5;
    const oy = H * 0.4;

    const count = isBoss ? 22 : 14;
    const cols = isBoss
      ? ["#ff003c", "#fbbf24", "#ef4444", "#fff", "#ff8800"]
      : [color, "#fff", "#fbbf24", color];

    const particles = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const spd = isBoss ? 4 + Math.random() * 7 : 2.5 + Math.random() * 5;
      return {
        x: ox, y: oy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - (Math.random() * 2),
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        size: isBoss ? 2.5 + Math.random() * 4 : 1.5 + Math.random() * 3,
        col: cols[Math.floor(Math.random() * cols.length)],
        trail: [],
      };
    });

    cancelAnimationFrame(animRef.current);

    function draw() {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of particles) {
        if (p.life <= 0) continue;
        alive = true;
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 5) p.trail.shift();
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18; // gravity
        p.vx *= 0.96;
        p.life -= p.decay;

        // ذيل
        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          p.trail.forEach(pt => ctx.lineTo(pt.x, pt.y));
          ctx.strokeStyle = p.col + Math.floor(p.life * 99).toString(16).padStart(2, "0");
          ctx.lineWidth = p.size * 0.5;
          ctx.lineCap = "round";
          ctx.stroke();
        }

        // الجسيم
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.col + Math.floor(p.life * 255).toString(16).padStart(2, "0");
        ctx.fill();

        // توهج
        if (isBoss && p.life > 0.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5 * p.life, 0, Math.PI * 2);
          ctx.fillStyle = p.col + "22";
          ctx.fill();
        }
      }
      if (alive) animRef.current = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, W, H);
    }
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 40 }}
    />
  );
}

// ─── MONSTERS ─────────────────────────────────────────────────────────────────
// أسماء مأخوذة من عالم Solo Leveling نفسه — مرتبة حسب قوة كل بوابة
const MONSTERS = {
  NORMAL: ["غوبلن الكهف", "العنكبوت الكهفي العاتي", "خفاش الظلام", "جرذ الموتى الزاحف", "دودة الأرض العملاقة"],
  ELITE: ["أورك المحارب", "تمثال الحارس الحجري", "العنكبوت الملكة الصغرى", "ذئب الجليد الكاسر", "زومبي الزنزانة المتعفن"],
  BOSS: ["إيغريس - القائد الأحمر الدموي", "تانك - القائد الأزرق الفولاذي", "آيرون - قائد الفرسان الحديدي", "باروكا حامل الخنجر الملعون", "كاماش الصغير"],
  DUNGEON: ["كاساكا ملك الثعابين", "بيرو - أقوى جندي نمل قبل الاستخراج", "يوغومنت ملك الجن الجليدي", "ملكة النمل الحمراء", "فارس الموت الجليدي"],
  DESTRUCTION_KING: ["أنتاريس، ملك الدمار"],
};

const GATE_VISUALS = {
  NORMAL: { label: "E_بوابة", rank: "E~D", icon: "◈", gradient: "linear-gradient(135deg,#0e4a4a,#0a2a2a)", border: T.cyan, glow: "#22d3ee", portalColor: ["#22d3ee", "#0891b2"], desc: "مغارات ومناطق مشبعة بالطاقة" },
  ELITE: { label: "D_بوابة", rank: "D~C", icon: "◆", gradient: "linear-gradient(135deg,#0e1f4a,#060d2a)", border: T.blue, glow: "#7c3aed", portalColor: ["#4600c7", "#ae00ff"], desc: "طاقة أعلى، وحوش متطورة" },
  BOSS: { label: "A_بوابة", rank: "A", icon: "❖", gradient: "linear-gradient(135deg,#3a2a00,#1a1000)", border: T.gold, glow: "#fbbf24", portalColor: ["#fbbf24", "#d97706"], desc: "كائن واحد بقوة هائلة" },
  DUNGEON: { label: "C_بوابة", rank: "C~B", icon: "⬡", gradient: "linear-gradient(135deg,#2a0a3a,#120018)", border: T.purple, glow: "#f75555", portalColor: ["#da0000", "#d93428"], desc: "أخطر بوابة — مكافأة عالية" },
  DESTRUCTION_KING: { label: "B_بوابة", rank: "B~A", icon: "💀", gradient: "linear-gradient(135deg,#2a0005,#0a0002)", border: "#ff003c", glow: "#ff003c", portalColor: ["#ff003c", "#5a000c"], desc: "نهاية العالم" },
};

// ─── PORTAL SVG ───────────────────────────────────────────────────────────────
function PortalSVG({ colors, size = 90, pulse = false }) {
  const [c1, c2] = colors;
  const id = c1.replace("#", "");
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={`pg-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c1} stopOpacity="0.9" />
          <stop offset="60%" stopColor={c2} stopOpacity="0.5" />
          <stop offset="100%" stopColor={c2} stopOpacity="0" />
        </radialGradient>
        <filter id="pblur"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <circle cx="45" cy="45" r="38" fill="none" stroke={c1} strokeWidth="1.5" strokeDasharray="8 4" opacity="0.7" style={{ animation: "auraSpin 8s linear infinite", transformOrigin: "45px 45px" }} />
      <circle cx="45" cy="45" r="28" fill="none" stroke={c2} strokeWidth="1" style={{ animation: "auraSpin 5s linear infinite reverse", transformOrigin: "45px 45px" }} />
      <circle cx="45" cy="45" r="24" fill={`url(#pg-${id})`} style={pulse ? { animation: "pulseOpacity 2s ease-in-out infinite" } : {}} />
      <circle cx="45" cy="45" r="16" fill="rgba(0,0,0,0.85)" />
      <circle cx="45" cy="45" r="10" fill={c1} opacity="0.3" filter="url(#pblur)" style={{ animation: "pulseOpacity 1.5s ease-in-out infinite" }} />
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = deg * Math.PI / 180;
        return <circle key={i} cx={45 + 33 * Math.cos(rad)} cy={45 + 33 * Math.sin(rad)} r="2" fill={c1} opacity="0.8" style={{ animation: `pulseOpacity ${1.2 + i * 0.2}s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />;
      })}
    </svg>
  );
}

// ─── BOSS PORTAL SVG ──────────────────────────────────────────────────────────
function BossPortalSVG({ size = 130, pulse = false }) {
  const c1 = "#fbbf24", c2 = "#b45309", c3 = "#ef4444";
  const pts = Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 - Math.PI / 2; const r = i % 2 === 0 ? 52 : 38; return `${65 + r * Math.cos(a)},${65 + r * Math.sin(a)}`; }).join(" ");
  const innerPts = Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 - Math.PI / 2 + Math.PI / 8; const r = i % 2 === 0 ? 28 : 20; return `${65 + r * Math.cos(a)},${65 + r * Math.sin(a)}`; }).join(" ");
  return (
    <svg width={size} height={size} viewBox="0 0 130 130" style={{ overflow: "visible" }}>
      <circle cx="65" cy="65" r="58" fill="none" stroke={c1} strokeWidth="1" strokeDasharray="14 6" opacity="0.5" style={{ animation: "auraSpin 12s linear infinite", transformOrigin: "65px 65px" }} />
      <circle cx="65" cy="65" r="46" fill="none" stroke={c2} strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" style={{ animation: "auraSpin 7s linear infinite reverse", transformOrigin: "65px 65px" }} />
      <polygon points={pts} fill="none" stroke={c1} strokeWidth="1.2" opacity="0.6" style={{ animation: "auraSpin 18s linear infinite", transformOrigin: "65px 65px" }} />
      <circle cx="65" cy="65" r="34" fill={c2} opacity="0.18" style={pulse ? { animation: "pulseOpacity 1.8s ease-in-out infinite" } : {}} />
      <circle cx="65" cy="65" r="26" fill="rgba(0,0,0,0.92)" />
      <polygon points={innerPts} fill="none" stroke={c1} strokeWidth="1" opacity="0.9" style={{ animation: "auraSpin 5s linear infinite reverse", transformOrigin: "65px 65px" }} />
      <circle cx="65" cy="65" r="10" fill={c1} opacity="0.25" style={{ animation: "pulseOpacity 1.2s ease-in-out infinite" }} />
      <circle cx="65" cy="62" r="6" fill="none" stroke={c1} strokeWidth="1.2" opacity="0.8" />
      <line x1="62" y1="68" x2="61" y2="71" stroke={c1} strokeWidth="1.2" opacity="0.8" />
      <line x1="65" y1="69" x2="65" y2="72" stroke={c1} strokeWidth="1.2" opacity="0.8" />
      <line x1="68" y1="68" x2="69" y2="71" stroke={c1} strokeWidth="1.2" opacity="0.8" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => { const rad = deg * Math.PI / 180; const col = i % 3 === 0 ? c3 : i % 3 === 1 ? c1 : c2; return <circle key={i} cx={65 + 50 * Math.cos(rad)} cy={65 + 50 * Math.sin(rad)} r={i % 2 === 0 ? 2.5 : 1.5} fill={col} opacity="0.9" style={{ animation: `pulseOpacity ${1 + i * 0.18}s ease-in-out infinite`, animationDelay: `${i * 0.12}s` }} />; })}
    </svg>
  );
}

// ─── GATE CARD ────────────────────────────────────────────────────────────────
function GateCard({ diffKey, onSelect }) {
  const v = GATE_VISUALS[diffKey] || GATE_VISUALS.NORMAL;
  const d = GATE_DIFFICULTY[diffKey] || GATE_DIFFICULTY.NORMAL;
  const [hovered, setHovered] = useState(false);
  const isBoss = diffKey === "BOSS";

  if (isBoss) {
    return (
      <div onClick={() => onSelect(diffKey)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ ...glass({ padding: "28px 20px 22px" }), background: "linear-gradient(160deg,#2a1800,#1a0c00,#0a0500)", border: `1px solid ${hovered ? "#fbbf24" : "#b4530970"}`, boxShadow: hovered ? "0 0 60px #fbbf2440,0 12px 40px rgba(0,0,0,0.7)" : "0 0 24px #b4530925", cursor: "pointer", textAlign: "center", position: "relative", overflow: "visible", transform: hovered ? "translateY(-6px) scale(1.03)" : "none", transition: "all 0.3s cubic-bezier(.34,1.4,.64,1)", display: "flex", flexDirection: "column", alignItems: "center", gap: 0, gridColumn: "span 2" }}>
        <HudCorners color="#fbbf24" size={13} />
        {[{ top: -8, left: -8 }, { top: -8, right: -8 }, { bottom: -8, left: -8 }, { bottom: -8, right: -8 }].map((pos, i) => (
          <div key={i} style={{ position: "absolute", ...pos, width: 14, height: 14, background: "#fbbf24", clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)", opacity: hovered ? 0.9 : 0.35, animation: `pulseOpacity ${1.5 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
        ))}
        <div style={{ position: "absolute", top: 12, right: 14, fontFamily: "monospace", fontSize: 9, letterSpacing: 2, color: "#fbbf24", fontWeight: 700, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 4, padding: "2px 7px" }}>A~S</div>
        <div style={{ position: "absolute", top: 12, left: 14, fontFamily: "'Orbitron',monospace", fontSize: 8, letterSpacing: 1, color: "#ef4444", fontWeight: 700, animation: "pulseOpacity 1.6s ease-in-out infinite" }}>⚠ BOSS</div>
        <div style={{ marginTop: 8, marginBottom: 10 }}><BossPortalSVG size={140} pulse={hovered} /></div>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 16, fontWeight: 900, color: "#fbbf24", letterSpacing: 2, marginBottom: 4, textShadow: hovered ? "0 0 20px #fbbf2490" : "0 0 10px #fbbf2440" }}>❖ بوابة البوس</div>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#b45309", letterSpacing: 1, marginBottom: 14 }}>كائن واحد بقوة هائلة</div>
        <div style={{ display: "flex", gap: 0, width: "100%", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 8, overflow: "hidden" }}>
          {[{ label: "HP", val: d?.hp || 0, color: "#ef4444" }, { label: "EXP", val: `+${d?.exp || 0}`, color: "#fbbf24" }, { label: "STA", val: d?.stamina || 0, color: T.blue }].map(({ label, val, color }, i) => (
            <div key={label} style={{ flex: 1, textAlign: "center", padding: "10px 6px", borderLeft: i > 0 ? "1px solid rgba(251,191,36,0.12)" : "none", background: "rgba(0,0,0,0.3)" }}>
              <div style={{ fontFamily: "monospace", fontSize: 14, color, fontWeight: 700 }}>{val}</div>
              <div style={{ fontFamily: "monospace", fontSize: 8, color: T.muted, letterSpacing: 1, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div onClick={() => onSelect(diffKey)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ ...glass({ padding: "20px 16px" }), background: v.gradient, border: `1px solid ${hovered ? v.border : v.border + "60"}`, boxShadow: hovered ? `0 0 30px ${v.glow}40` : `0 0 10px ${v.glow}15`, cursor: "pointer", textAlign: "center", position: "relative", overflow: "visible", transform: hovered ? "translateY(-4px) scale(1.02)" : "none", transition: "all 0.25s ease", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <HudCorners color={v.border} size={10} />
      <div style={{ position: "absolute", top: 10, right: 12, fontFamily: "monospace", fontSize: 9, letterSpacing: 2, color: v.glow, fontWeight: 700 }}>{v.rank}</div>
      <PortalSVG colors={v.portalColor} size={80} pulse={hovered} />
      <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 700, color: v.glow, letterSpacing: 1 }}>{v.icon} {v.label}</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        {[{ label: "HP", val: d.hp }, { label: "EXP", val: `+${d.exp}` }, { label: "STA", val: d.stamina }].map(({ label, val }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: v.glow, fontWeight: 700 }}>{val}</div>
            <div style={{ fontFamily: "monospace", fontSize: 8, color: T.muted, letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: T.muted, fontFamily: "monospace" }}>{v.desc}</div>
    </div>
  );
}

// ─── HP BAR ───────────────────────────────────────────────────────────────────
function HpBar({ current, max, color, label, icon }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: T.muted }}>{icon} {label}</span>
        <span style={{ fontFamily: "monospace", fontSize: 12, color, fontWeight: 700 }}>{current} / {max}</span>
      </div>
      <div style={{ height: 10, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden", border: `1px solid ${color}25` }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${color}80,${color})`, borderRadius: 99, transition: "width 0.4s ease", boxShadow: `0 0 8px ${color}80`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)", animation: "shimmerSweep 2s ease-in-out infinite" }} />
        </div>
      </div>
    </div>
  );
}

// ─── FLOAT TEXT ───────────────────────────────────────────────────────────────
function FloatText({ text, color, big, key: k }) {
  return (
    <div key={k} style={{
      position: "absolute", top: big ? "32%" : "20%", left: "50%", transform: "translateX(-50%)",
      fontFamily: "'Orbitron',monospace",
      fontSize: big ? 30 : 23,
      fontWeight: 900,
      color,
      textShadow: `0 0 ${big ? 24 : 16}px ${color}`,
      animation: "floatUpFade 1.1s ease-out forwards",
      pointerEvents: "none", whiteSpace: "nowrap", zIndex: 99
    }}>
      {text}
    </div>
  );
}

// ─── COMBAT LOG ───────────────────────────────────────────────────────────────
function CombatLog({ entries }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [entries]);
  const colors = { player: "#22d3ee", enemy: "#ef4444", crit: "#fbbf24", skill: "#a855f7", heal: "#10b981", system: "#6b7280", dodge: "#fbbf24", victory: "#10b981", defeat: "#ef4444" };
  return (
    <div ref={ref} style={{ maxHeight: 130, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3, padding: "8px 10px" }}>
      {entries.map((e, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: "monospace", fontSize: 10, opacity: Math.max(0.4, 1 - (entries.length - 1 - i) * 0.12) }}>
          <span style={{ color: T.muted, fontSize: 9, flexShrink: 0 }}>{e.time}</span>
          <span style={{ color: colors[e.type] || T.muted }}>{e.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ─── BATTLE SCREEN (نظام الدور بالدور الكامل) ────────────────────────────────
function BattleScreen({ gate, monster, state, onVictory, onDefeat, onEscape, playerName, skillName, skillMult, skillUsedToday }) {
  const v = GATE_VISUALS[gate];
  const d = GATE_DIFFICULTY[gate];
  const isBoss = gate === "BOSS";
  const maxPHP = maxPlayerHp(effectiveStats(state));
  const eff = effectiveStats(state);

  // ── حالة القتال ──
  const [enemyHp, setEnemyHp] = useState(d.hp);
  const [playerHp, setPlayerHp] = useState(state.playerHp);
  const [turn, setTurn] = useState("player"); // player | enemy | end
  const [phase, setPhase] = useState("choice"); // choice | result | end
  const [log, setLog] = useState([{ type: "system", msg: `⚔ دخلت البوابة! واجهت ${monster}`, time: now() }]);
  const [floats, setFloats] = useState([]);
  const [skillUsed, setSkillUsed] = useState(skillUsedToday);
  const [potions, setPotions] = useState(state.potions || 0);
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [outcome, setOutcome] = useState(null); // "victory" | "defeat"
  // 💥 محفّزات جسيمات الشرر (نغيّر القيمة كل ضربة عشان SparkCanvas يعيد تشغيل الانفجار)
  const [enemyHitTrigger, setEnemyHitTrigger] = useState(0);
  const [playerHitTrigger, setPlayerHitTrigger] = useState(0);
  // 🔥 وضع الغضب: يتفعّل مرة واحدة وبس لما دم العدو يوصل نصه، ويفضل مفعّل لين تنتهي المعركة
  const [isRaged, setIsRaged] = useState(false);
  const rage = isRaged;

  function now() {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function addFloat(text, color, big = false) {
    const id = Date.now() + Math.random();
    setFloats(f => [...f, { id, text, color, big }]);
    setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 1200);
  }

  function addLog(type, msg) {
    setLog(prev => [...prev, { type, msg, time: now() }]);
  }

  // ── الهجوم ──
  function doAttack(multiplier = 1) {
    if (turn !== "player" || phase !== "choice") return;
    setPhase("result");

    const str = eff.STR || 10;
    const base = Math.floor(str * 2.2 + Math.random() * (str * 0.8));
    const isCrit = Math.random() < 0.12;
    const dmg = Math.floor(base * multiplier * (isCrit ? 2 : 1));
    const newEnemyHp = Math.max(0, enemyHp - dmg);

    setShakeEnemy(true);
    setTimeout(() => setShakeEnemy(false), 400);
    setEnemyHp(newEnemyHp);
    setEnemyHitTrigger(Date.now()); // 💥 شرارات اصطدام السيف بالعدو

    // 🔊 أصوات الضربة: سيف/مهارة/كريت ثم صوت الاصطدام، وصراخ البوس لو هو العدو
    if (multiplier > 1.5) sfxSkill();
    else if (isCrit) sfxCrit();
    else sfxSword();
    setTimeout(() => sfxHit(), 90);

    if (isCrit) {
      addFloat(`⚡ CRITICAL! -${dmg}`, "#fbbf24", true);
      addLog("crit", `⚡ CRITICAL! ضربت ${monster} بـ ${dmg} دمج`);
    } else if (multiplier > 1.5) {
      addFloat(`🌑 -${dmg}`, "#a855f7");
      addLog("skill", `🌑 مهارة ${skillName}! ضربت ${dmg} دمج`);
    } else {
      addFloat(`-${dmg}`, "#22d3ee");
      addLog("player", `⚔ ضربت ${monster} بـ ${dmg} دمج`);
    }

    if (newEnemyHp <= 0) {
      addLog("victory", `🏆 انتصرت! ${monster} هُزم!`);
      sfxVictory();
      setTurn("end");
      setOutcome("victory");
      setPhase("end");
      setTimeout(() => onVictory({ playerHp: playerHp, potions }), 900);
      return;
    }

    // 🔥 وضع الغضب: يتفعّل مرة واحدة بس لما دم العدو يوصل نصه — يزمجر مرة وحدة وتتضاعف قوته
    if (!isRaged && newEnemyHp / d.hp <= 0.5) {
      setIsRaged(true);
      if (isBoss) setTimeout(() => sfxBossRoar(), 250);
      addLog("system", `🔥 ${monster} دخل وضع الغضب! قوته تضاعفت!`);
    }

    // دور العدو
    setTimeout(() => enemyTurn(newEnemyHp), 700);
  }

  // ── دور العدو ──
  function enemyTurn(currentEnemyHp) {
    setTurn("enemy");
    setPhase("result");

    const [min, max] = d.monsterDmg;
    const rawDmg = min + Math.floor(Math.random() * (max - min + 1));
    const rageMult = isRaged ? 2 : 1; // 🔥 وضع الغضب يضاعف القوة (مرة واحدة عند تفعيله، يفضل مفعّل)
    const agi = eff.AGI || 10;
    const dodgeChance = Math.min(0.35, agi * 0.004);
    const dodged = Math.random() < dodgeChance;

    if (dodged) {
      addFloat("DODGE!", "#fbbf24");
      addLog("dodge", `💨 تحاشيت هجوم ${monster}!`);
      sfxDodge();
    } else {
      const finalDmg = Math.floor(rawDmg * rageMult);
      const newPlayerHp = Math.max(0, playerHp - finalDmg);
      setShakePlayer(true);
      setTimeout(() => setShakePlayer(false), 400);
      setPlayerHp(newPlayerHp);
      setPlayerHitTrigger(Date.now()); // 💥 شرارات اصطدام ضربة العدو باللاعب
      setTimeout(() => sfxHit(), 80);
      addFloat(`-${finalDmg}`, "#ef4444");
      addLog("enemy", `🩸 ${monster} ضربك بـ ${finalDmg} دمج${rageMult > 1 ? " (RAGE!)" : ""}`);

      if (newPlayerHp <= 0) {
        addLog("defeat", "💀 سقطت في المعركة...");
        sfxDefeat();
        setTurn("end");
        setOutcome("defeat");
        setPhase("end");
        setTimeout(() => onDefeat({ playerHp: 0, potions }), 900);
        return;
      }
    }

    setTimeout(() => { setTurn("player"); setPhase("choice"); }, 600);
  }

  // ── مهارة ──
  function doSkill() {
    if (skillUsed || !skillName) return;
    setSkillUsed(true);
    doAttack(skillMult || 1.5);
  }

  // ── جرعة شفاء ──
  function doPotion() {
    if (potions <= 0 || turn !== "player" || phase !== "choice") return;
    const heal = 50;
    const newHp = Math.min(maxPHP, playerHp + heal);
    setPotions(p => p - 1);
    setPlayerHp(newHp);
    sfxHeal();
    addFloat(`+${heal} HP`, "#10b981");
    addLog("heal", `🧪 استخدمت جرعة شفاء! +${heal} HP`);
    // الشفاء لا يضيع الدور — نضيف دور العدو بعده
    setTimeout(() => enemyTurn(enemyHp), 700);
    setPhase("result");
  }

  // ── هروب ──
  function doEscape() {
    const agi = eff.AGI || 10;
    const chance = Math.min(0.7, 0.3 + agi * 0.005);
    if (Math.random() < chance) {
      addLog("system", "🏃 هربت من المعركة!");
      onEscape({ playerHp, potions });
    } else {
      addLog("system", "❌ فشل الهروب!");
      addFloat("فشل!", "#ef4444");
      setTimeout(() => enemyTurn(enemyHp), 600);
      setPhase("result");
    }
  }

  const enemyHpPct = Math.max(0, (enemyHp / d.hp) * 100);
  const playerHpPct = Math.max(0, (playerHp / maxPHP) * 100);
  const enemyHpColor = enemyHpPct > 50 ? "#10b981" : enemyHpPct > 25 ? "#eab308" : "#ef4444";
  const playerHpColor = playerHpPct > 50 ? "#10b981" : playerHpPct > 25 ? "#eab308" : "#ef4444";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(4,0,15,0.97)",
      backdropFilter: "blur(16px)",
      display: "flex", flexDirection: "column",
      animation: "fadeIn 0.3s ease-out",
      overflow: "hidden",
    }}>
      {/* ── هيدر البوابة ── */}
      <div style={{ ...glass({ padding: "10px 20px" }), display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${v.border}30`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: v.glow }}>{v.icon} {v.label}</span>
          <span style={{ fontFamily: "monospace", fontSize: 9, color: T.muted }}>{v.rank}</span>
          {rage && <span style={{ fontFamily: "monospace", fontSize: 9, color: "#ef4444", fontWeight: 700, animation: "pulseOpacity 0.7s ease-in-out infinite" }}>⚠ RAGE</span>}
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: turn === "player" ? T.cyan : "#ef4444", fontWeight: 700 }}>
          {outcome ? (outcome === "victory" ? "🏆 انتصار!" : "💀 هزيمة") : turn === "player" ? "⚔ دورك" : "🩸 دور العدو"}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 }}>

        {/* ── ساحة المعركة ── */}
        <div style={{ display: "flex", gap: 0, padding: "120px 16px 0", flexShrink: 0 }}>

          {/* اللاعب */}
          <div style={{ flex: 1, ...glass({ padding: "14px 16px" }), marginRight: 8, border: `1px solid ${shakePlayer ? "#ef4444" : T.border}`, transition: "border-color 0.2s", position: "relative", animation: shakePlayer ? "giftShake 0.4s ease-in-out" : "none" }}>
            <HudCorners color={T.cyan} size={8} />
            <SparkCanvas trigger={playerHitTrigger} color="#ef4444" isBoss={false} side="player" />
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 700, color: T.cyan, marginBottom: 10 }}>👤 {playerName || "صياد"}</div>
            <HpBar current={playerHp} max={maxPHP} color={playerHpColor} label="HP" icon="❤️" />
            <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "STR", val: eff.STR },
                { label: "AGI", val: eff.AGI },
                { label: "VIT", val: eff.VIT },
              ].map(({ label, val }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 12, color: T.cyan, fontWeight: 700 }}>{val}</div>
                  <div style={{ fontFamily: "monospace", fontSize: 8, color: T.muted }}>{label}</div>
                </div>
              ))}
            </div>
            {/* float texts للاعب */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, pointerEvents: "none" }}>
              {floats.filter(f => f.color === "#ef4444").map(f => <FloatText key={f.id} text={f.text} color={f.color} big={f.big} />)}
            </div>
          </div>

          {/* VS */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 6px", gap: 4 }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, color: T.muted, fontWeight: 900 }}>VS</div>
          </div>

          {/* العدو */}
          <div style={{ flex: 1, ...glass({ padding: "14px 16px" }), marginLeft: 8, border: `1px solid ${shakeEnemy ? "#22d3ee" : v.border + "60"}`, background: rage ? "linear-gradient(135deg,#2a0000,#0a0000)" : v.gradient, transition: "border-color 0.2s", position: "relative", animation: shakeEnemy ? "giftShake 0.4s ease-in-out" : "none" }}>
            <HudCorners color={rage ? "#ef4444" : v.border} size={8} />
            <SparkCanvas trigger={enemyHitTrigger} color={v.glow} isBoss={isBoss} side="enemy" />
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, color: rage ? "#ef4444" : v.glow, marginBottom: 10, animation: rage ? "pulseOpacity 0.9s ease-in-out infinite" : "none" }}>{rage ? "💀" : "👾"} {monster}</div>
            <HpBar current={enemyHp} max={d.hp} color={enemyHpColor} label="HP" icon={rage ? "🔥" : "❤️"} />
            {rage && <div style={{ marginTop: 6, fontFamily: "monospace", fontSize: 9, color: "#ef4444", fontWeight: 700, animation: "pulseOpacity 0.7s ease-in-out infinite" }}>⚠ وضع الغضب — الدمج مضاعف!</div>}
            {/* float texts للعدو */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, pointerEvents: "none" }}>
              {floats.filter(f => f.color !== "#ef4444").map(f => <FloatText key={f.id} text={f.text} color={f.color} big={f.big} />)}
            </div>
          </div>
        </div>

        {/* ── سجل القتال ── */}
        <div style={{ margin: "10px 16px 0", ...glass({ padding: 0 }), border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "6px 10px", borderBottom: `1px solid ${T.border}`, fontFamily: "monospace", fontSize: 8, letterSpacing: 2, color: T.muted }}>◈ سجل القتال</div>
          <CombatLog entries={log} />
        </div>

        {/* ── أزرار القتال ── */}
        {phase === "choice" && turn === "player" && !outcome && (
          <div style={{ margin: "12px 16px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {/* هجوم */}
            <button onClick={() => doAttack(1)} style={{
              padding: "16px 10px", borderRadius: 12, border: `2px solid ${v.border}`,
              background: `linear-gradient(135deg,${v.glow}22,${v.glow}08)`,
              color: v.glow, cursor: "pointer", fontFamily: "'Orbitron',monospace",
              fontSize: 14, fontWeight: 900, letterSpacing: 1,
              boxShadow: `0 0 20px ${v.glow}30`,
              transition: "all 0.2s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 0 30px ${v.glow}60`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 0 20px ${v.glow}30`; }}
            >
              <span style={{ fontSize: 22 }}>⚔</span>
              <span>هجوم</span>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: T.muted, fontWeight: 400 }}>STR × 2.2</span>
            </button>

            {/* مهارة */}
            <button onClick={doSkill} disabled={skillUsed || !skillName}
              style={{
                padding: "16px 10px", borderRadius: 12,
                border: `2px solid ${skillUsed ? T.border : T.gold}`,
                background: skillUsed ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg,rgba(251,191,36,0.2),rgba(251,191,36,0.05))",
                color: skillUsed ? T.muted : T.gold,
                cursor: skillUsed ? "default" : "pointer",
                fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 900,
                boxShadow: skillUsed ? "none" : "0 0 20px rgba(251,191,36,0.3)",
                transition: "all 0.2s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}
              onMouseEnter={e => { if (!skillUsed) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(251,191,36,0.6)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = skillUsed ? "none" : "0 0 20px rgba(251,191,36,0.3)"; }}
            >
              <span style={{ fontSize: 22 }}>✨</span>
              <span style={{ fontSize: 11 }}>{skillName || "لا مهارة"}</span>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: skillUsed ? T.muted : "#fbbf24", fontWeight: 400 }}>
                {skillUsed ? "✓ استُخدمت" : `×${skillMult || 1}`}
              </span>
            </button>

            {/* جرعة */}
            <button onClick={doPotion} disabled={potions <= 0}
              style={{
                padding: "14px 10px", borderRadius: 12,
                border: `2px solid ${potions > 0 ? "#10b981" : T.border}`,
                background: potions > 0 ? "linear-gradient(135deg,rgba(16,185,129,0.2),rgba(16,185,129,0.05))" : "rgba(255,255,255,0.03)",
                color: potions > 0 ? "#10b981" : T.muted,
                cursor: potions > 0 ? "pointer" : "default",
                fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700,
                transition: "all 0.2s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}
              onMouseEnter={e => { if (potions > 0) { e.currentTarget.style.transform = "translateY(-2px)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
            >
              <span style={{ fontSize: 22 }}>🧪</span>
              <span>جرعة شفاء</span>
              <span style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 400 }}>+50 HP · {potions} متبقية</span>
            </button>

            {/* هروب */}
            <button onClick={doEscape}
              style={{
                padding: "14px 10px", borderRadius: 12,
                border: `2px solid rgba(239,68,68,0.4)`,
                background: "linear-gradient(135deg,rgba(239,68,68,0.1),rgba(239,68,68,0.03))",
                color: "#ef4444",
                cursor: "pointer",
                fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700,
                transition: "all 0.2s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
            >
              <span style={{ fontSize: 22 }}>🏃</span>
              <span>هروب</span>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: T.muted, fontWeight: 400 }}>AGI يحدد النجاح</span>
            </button>
          </div>
        )}

        {/* دور العدو — انتظار */}
        {turn === "enemy" && !outcome && (
          <div style={{ margin: "16px", textAlign: "center", fontFamily: "monospace", fontSize: 12, color: "#ef4444", animation: "pulseOpacity 0.8s ease-in-out infinite" }}>
            🩸 {monster} يهاجم...
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VICTORY SCREEN ───────────────────────────────────────────────────────────
function VictoryScreen({ gate, monster, loot, exp, onClose }) {
  const v = GATE_VISUALS[gate];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(4,0,15,0.97)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.4s ease-out" }}>
      <div style={{ ...glass({ padding: 36 }), background: "linear-gradient(160deg,#001a00,#002200)", border: "1px solid rgba(16,185,129,0.5)", maxWidth: 380, width: "90%", textAlign: "center", position: "relative", animation: "popIn 0.5s cubic-bezier(.34,1.56,.64,1) both" }}>
        <HudCorners color="#10b981" size={13} />
        <div style={{ position: "absolute", inset: -30, opacity: 0.08, background: "conic-gradient(from 0deg,#10b981,transparent,#10b981)", animation: "auraSpin 10s linear infinite", pointerEvents: "none" }} />
        <div style={{ fontSize: 52, marginBottom: 8, animation: "itemFloat 3s ease-in-out infinite", filter: "drop-shadow(0 0 20px #10b981)" }}>🏆</div>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 26, fontWeight: 900, color: "#10b981", marginBottom: 4, textShadow: "0 0 24px #10b98190" }}>VICTORY!</div>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: T.muted, marginBottom: 20 }}>هزمت {monster}</div>

        <div style={{ ...glass({ padding: "14px 20px" }), marginBottom: 16, display: "flex", justifyContent: "space-around", border: "1px solid rgba(16,185,129,0.2)" }}>
          <div>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 20, color: T.gold, fontWeight: 900 }}>+{exp}</div>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: T.muted, letterSpacing: 1 }}>EXP</div>
          </div>
          {loot && (
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 14, color: T.cyan, fontWeight: 700 }}>{loot.name}</div>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: T.muted, letterSpacing: 1 }}>{loot.tier} ITEM</div>
            </div>
          )}
        </div>

        <button onClick={onClose} style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", cursor: "pointer", fontFamily: "'Orbitron',monospace", fontSize: 14, fontWeight: 900, boxShadow: "0 0 24px rgba(16,185,129,0.5)" }}>
          ✓ استمر
        </button>
      </div>
    </div>
  );
}

// ─── DEFEAT SCREEN ────────────────────────────────────────────────────────────
function DefeatScreen({ monster, onRetry, onEscape }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(4,0,15,0.97)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.4s ease-out" }}>
      <div style={{ ...glass({ padding: 36 }), background: "linear-gradient(160deg,#1a0000,#0a0000)", border: "1px solid rgba(239,68,68,0.5)", maxWidth: 360, width: "90%", textAlign: "center", position: "relative", animation: "popIn 0.5s cubic-bezier(.34,1.56,.64,1) both" }}>
        <HudCorners color="#ef4444" size={13} />
        <div style={{ fontSize: 52, marginBottom: 8, animation: "pulseOpacity 1.5s ease-in-out infinite" }}>💀</div>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 24, fontWeight: 900, color: "#ef4444", marginBottom: 4, textShadow: "0 0 24px #ef444490" }}>DEFEAT</div>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: T.muted, marginBottom: 24 }}>سقطت أمام {monster}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onEscape} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontFamily: "monospace", fontSize: 12 }}>🚪 خروج</button>
          <button onClick={onRetry} style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ef4444,#b91c1c)", color: "#fff", cursor: "pointer", fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 900, boxShadow: "0 0 20px rgba(239,68,68,0.5)" }}>↺ إعادة المحاولة</button>
        </div>
      </div>
    </div>
  );
}

// ─── GATES PAGE ───────────────────────────────────────────────────────────────
export function GatesPage({ state, onComplete, onDelete, onAdd, onPotion, onRest, combatFlash, onUseSkill, onBattleEnd }) {
  const [selectedGate, setSelectedGate] = useState(null);
  const [monster, setMonster] = useState(null);
  const [inBattle, setInBattle] = useState(false);
  const [victoryData, setVictoryData] = useState(null);
  const [defeatData, setDefeatData] = useState(null);

  // 🔊 نحمّل كل أصوات القتال مسبقاً أول ما تفتح صفحة البوابات — صفر تأخير عند أول ضربة
  useEffect(() => { SoundManager.preload(); }, []);

  const rank = rankFromLevel(state.level);
  const skill = RANK_SKILLS[rank.title];
  const today = todayStr();
  const skillUsedToday = state.skillUsedDate === today;
  const playerName = state.playerName || "صياد";

  const handleSelectGate = (diffKey) => {
    const pool = MONSTERS[diffKey];
    setSelectedGate(diffKey);
    setMonster(pool[Math.floor(Math.random() * pool.length)]);
  };

  const handleStartBattle = () => setInBattle(true);
  const handleCancel = () => { setSelectedGate(null); setMonster(null); };

  const handleVictory = useCallback(({ playerHp, potions: newPotions }) => {
    const d = GATE_DIFFICULTY[selectedGate];
    const loot = Math.random() < (d.dropChance || 0.5)
      ? rollLoot(1, d.weights || GATE_WEIGHTS)
      : null;

    // 👤⚡ فرصة استخراج جندي ظل — فقط من بوسات قوية (BOSS / DUNGEON / DESTRUCTION_KING)
    let shadowExtracted = null;
    const shadowCfg = SHADOW_EXTRACT[selectedGate];
    if (shadowCfg && Math.random() < shadowCfg.chance) {
      const existing = (state.shadowSoldiers || []).find((s) => s.name === monster);
      shadowExtracted = existing
        ? { name: monster, tier: selectedGate, level: existing.level, duplicate: true }
        : { name: monster, tier: selectedGate, level: 1, duplicate: false };
    }

    setVictoryData({ exp: d.exp, loot, playerHp, potions: newPotions, shadowExtracted });
    setInBattle(false);
  }, [selectedGate, monster, state.shadowSoldiers]);

  const handleDefeat = useCallback(({ playerHp }) => {
    setDefeatData({ playerHp });
    setInBattle(false);
  }, []);

  const handleEscape = useCallback(({ playerHp, potions: newPotions }) => {
    setInBattle(false);
    setSelectedGate(null);
    setMonster(null);
    if (onBattleEnd) onBattleEnd({ playerHp, potions: newPotions, escaped: true });
  }, [onBattleEnd]);

  const handleVictoryClose = () => {
    if (onBattleEnd) onBattleEnd({ ...victoryData, gate: selectedGate, monster, won: true });
    setVictoryData(null);
    setSelectedGate(null);
    setMonster(null);
  };

  const handleRetry = () => {
    setDefeatData(null);
    setInBattle(true);
  };

  const handleDefeatEscape = () => {
    if (onBattleEnd) onBattleEnd({ ...defeatData, gate: selectedGate, won: false });
    setDefeatData(null);
    setSelectedGate(null);
    setMonster(null);
  };

  return (
    <div style={{ minHeight: "100vh", padding: "80px 24px 40px", maxWidth: 740, margin: "0 auto", animation: "pageInRight 0.4s ease-out both" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: T.purple, marginBottom: 8 }}>◈ GATE SYSTEM</div>
        <h2 style={{ fontFamily: "'Orbitron',monospace", fontSize: 24, fontWeight: 700, color: T.text }}>البوابات</h2>
        <div style={{ marginTop: 6, fontFamily: "monospace", fontSize: 11, color: T.muted }}>اختر بوابة وخض معركة دور بدور</div>
      </div>

      {/* STATUS PANEL */}
      <div style={{ ...glass({ padding: "18px 20px" }), marginBottom: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: T.muted, marginBottom: 2 }}>◈ HUNTER STATUS</div>
        {(() => {
          const maxHp = maxPlayerHp(state.stats);
          const hpPct = Math.max(0, Math.min(100, (state.playerHp / maxHp) * 100));
          const hpCol = hpPct > 50 ? "#10b981" : hpPct > 20 ? "#eab308" : "#ef4444";
          return <HpBar current={state.playerHp} max={maxHp} color={hpCol} label="HP" icon="❤️" />;
        })()}
        {(() => {
          const maxSta = state.maxStamina || 700;
          const stPct = Math.max(0, Math.min(100, (state.stamina / maxSta) * 100));
          return <HpBar current={state.stamina} max={maxSta} color={T.blue} label="STAMINA" icon="⚡" />;
        })()}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onPotion} disabled={state.potions <= 0} style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, background: state.potions > 0 ? "rgba(16,185,129,0.12)" : "transparent", color: state.potions > 0 ? "#10b981" : T.muted, cursor: state.potions > 0 ? "pointer" : "default" }}>🧪 جرعة (+50) · {state.potions}</button>
          <button onClick={onRest} style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, background: "rgba(96,165,250,0.12)", color: T.blue, cursor: "pointer" }}>😴 راحة (+10 HP)</button>
        </div>
      </div>

      {/* SKILL */}
      {skill && (
        <div style={{ ...glass({ padding: "14px 18px" }), marginBottom: 24, border: `1px solid ${rank.color}40`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: rank.color, marginBottom: 3 }}>⚡ مهارة {rank.title}</div>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 14, fontWeight: 800, color: T.text }}>{skill.name}</div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: T.muted, marginTop: 2 }}>{skill.desc}</div>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: skillUsedToday ? T.muted : T.gold, whiteSpace: "nowrap" }}>
            {skillUsedToday ? "✓ استُخدمت" : `×${skill.multiplier} جاهزة`}
          </div>
        </div>
      )}

      {/* GATE GRID */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: T.muted, marginBottom: 14 }}>— اختر بوابة —</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14 }}>
          {Object.keys(GATE_VISUALS).map(key => <GateCard key={key} diffKey={key} onSelect={handleSelectGate} />)}
        </div>
      </div>

      {/* GATE CONFIRM MODAL */}
      {selectedGate && monster && !inBattle && !victoryData && !defeatData && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(4,0,15,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.25s ease-out" }}>
          <div style={{ ...glass({ padding: 32 }), background: GATE_VISUALS[selectedGate].gradient, border: `1px solid ${GATE_VISUALS[selectedGate].border}`, maxWidth: 380, width: "90%", textAlign: "center", position: "relative", animation: "popIn 0.35s cubic-bezier(.34,1.56,.64,1) both" }}>
            <HudCorners color={GATE_VISUALS[selectedGate].border} size={12} />
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              {selectedGate === "BOSS" ? <BossPortalSVG size={110} pulse /> : <PortalSVG colors={GATE_VISUALS[selectedGate].portalColor} size={100} pulse />}
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: GATE_VISUALS[selectedGate].glow, marginBottom: 6 }}>{GATE_VISUALS[selectedGate].icon} {GATE_VISUALS[selectedGate].label} · {GATE_VISUALS[selectedGate].rank}</div>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, color: T.red, letterSpacing: 2, marginBottom: 14, animation: "pulseOpacity 1.4s ease-in-out infinite" }}>⚠ مواجهة عدو</div>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, fontWeight: 900, color: GATE_VISUALS[selectedGate].glow, textShadow: `0 0 20px ${GATE_VISUALS[selectedGate].glow}80`, marginBottom: 20 }}>{monster}</div>
            <div style={{ display: "flex", justifyContent: "space-around", ...glass({ padding: "12px 16px" }), marginBottom: 20 }}>
              {[{ val: GATE_DIFFICULTY[selectedGate].hp, label: "HP", color: T.red }, { val: `+${GATE_DIFFICULTY[selectedGate].exp}`, label: "EXP", color: T.gold }, { val: `${GATE_DIFFICULTY[selectedGate].monsterDmg[0]}~${GATE_DIFFICULTY[selectedGate].monsterDmg[1]}`, label: "DMG", color: GATE_VISUALS[selectedGate].glow }].map(({ val, label, color }) => (
                <div key={label}><div style={{ fontFamily: "monospace", fontSize: 14, color, fontWeight: 700 }}>{val}</div><div style={{ fontFamily: "monospace", fontSize: 8, color: T.muted, letterSpacing: 1 }}>{label}</div></div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleCancel} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontWeight: 700 }}>تراجع</button>
              <button onClick={handleStartBattle} style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${GATE_VISUALS[selectedGate].glow},${GATE_VISUALS[selectedGate].portalColor[1]})`, color: "#fff", cursor: "pointer", fontWeight: 900, fontSize: 13, fontFamily: "'Orbitron',monospace", boxShadow: `0 0 20px ${GATE_VISUALS[selectedGate].glow}60` }}>⚔ ابدأ المعركة!</button>
            </div>
          </div>
        </div>
      )}

      {/* BATTLE */}
      {inBattle && selectedGate && monster && (
        <BattleScreen
          gate={selectedGate}
          monster={monster}
          state={state}
          playerName={playerName}
          skillName={skill?.name}
          skillMult={skill?.multiplier}
          skillUsedToday={skillUsedToday}
          onVictory={handleVictory}
          onDefeat={handleDefeat}
          onEscape={handleEscape}
        />
      )}

      {/* VICTORY */}
      {victoryData && <VictoryScreen gate={selectedGate} monster={monster} loot={victoryData.loot} exp={victoryData.exp} onClose={handleVictoryClose} />}

      {/* DEFEAT */}
      {defeatData && <DefeatScreen monster={monster} onRetry={handleRetry} onEscape={handleDefeatEscape} />}
    </div>
  );
}

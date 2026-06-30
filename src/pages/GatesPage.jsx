import { useState, useEffect, useRef, useCallback } from "react";
import { T, glass } from "../constants/tokens";
import { GATE_DIFFICULTY, RANK_SKILLS, rankFromLevel, GATE_WEIGHTS, SHADOW_TIER_COLOR, SHADOW_SPECIAL_NAMES } from "../constants/gameData";
import { HudCorners } from "../components/UI";
import { ShadowSoldierIcon } from "../components/ShadowIcons";
import { hpColor, maxPlayerHp, todayStr, effectiveStats, rollLoot, rollShadowFromPool, rollCrystalDrop } from "../constants/gameLogic";
import { SoundManager } from "../utils/soundManager";

// ─── SOUND EFFECTS ────────────────────────────────────────────────────────────
function sfxSword() { SoundManager.play("sword"); }
function sfxHit() { SoundManager.play("hit"); }
function sfxBossRoar() { SoundManager.play("bossRoar"); }
function sfxCrit() { SoundManager.play("crit"); }
function sfxSkill() { SoundManager.play("skill"); }
function sfxHeal() { SoundManager.play("heal"); }
function sfxDodge() { SoundManager.play("dodge"); }
function sfxVictory() { SoundManager.play("victory"); }
function sfxDefeat() { SoundManager.play("defeat"); }

// ─── SPARK CANVAS ─────────────────────────────────────────────────────────────
function SparkParticles({ active, color = "#fbbf24", x = "50%", y = "50%", count = 14, isBoss = false }) {
  const [sparks, setSparks] = useState([]);
  useEffect(() => {
    if (!active) return;
    setSparks(Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * 360,
      speed: isBoss ? 4 + Math.random() * 6 : 2 + Math.random() * 4,
      size: isBoss ? 3 + Math.random() * 3 : 2 + Math.random() * 2,
    })));
    const t = setTimeout(() => setSparks([]), 700);
    return () => clearTimeout(t);
  }, [active]);
  if (!sparks.length) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 50 }}>
      {sparks.map(s => {
        const rad = s.angle * Math.PI / 180;
        return (
          <div key={s.id} style={{
            position: "absolute", width: s.size, height: s.size,
            borderRadius: "50%", background: color,
            boxShadow: `0 0 ${s.size * 2}px ${color}`,
            animation: `sparkOut 0.65s ease-out forwards`,
            "--tx": `${Math.cos(rad) * s.speed * 12}px`,
            "--ty": `${Math.sin(rad) * s.speed * 12}px`,
          }} />
        );
      })}
    </div>
  );
}

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
    const ox = W * 0.5, oy = H * 0.4;
    const count = isBoss ? 22 : 14;
    const cols = isBoss ? ["#ff003c", "#fbbf24", "#ef4444", "#fff", "#ff8800"] : [color, "#fff", "#fbbf24", color];
    const particles = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const spd = isBoss ? 4 + Math.random() * 7 : 2.5 + Math.random() * 5;
      return { x: ox, y: oy, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd - Math.random() * 2, life: 1, decay: 0.02 + Math.random() * 0.03, size: isBoss ? 2.5 + Math.random() * 4 : 1.5 + Math.random() * 3, col: cols[Math.floor(Math.random() * cols.length)], trail: [] };
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
        p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.vx *= 0.96; p.life -= p.decay;
        if (p.trail.length > 1) {
          ctx.beginPath(); ctx.moveTo(p.trail[0].x, p.trail[0].y);
          p.trail.forEach(pt => ctx.lineTo(pt.x, pt.y));
          ctx.strokeStyle = p.col + Math.floor(p.life * 99).toString(16).padStart(2, "0");
          ctx.lineWidth = p.size * 0.5; ctx.lineCap = "round"; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.col + Math.floor(p.life * 255).toString(16).padStart(2, "0"); ctx.fill();
      }
      if (alive) animRef.current = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, W, H);
    }
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [trigger]);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 40 }} />;
}

// ─── GATE VISUALS ─────────────────────────────────────────────────────────────
// ترتيب الأنمي من الأضعف للأقوى
const GATE_VISUALS = {
  E_RANK: { label: "بوابة E", rank: "E", icon: "🟢", gradient: "linear-gradient(135deg,#0a2a1a,#051208)", border: "#4ade80", glow: "#4ade80", portalColor: ["#4ade80", "#16a34a"], desc: "أضعف بوابة — سلايمات وحشرات" },
  D_RANK: { label: "بوابة D", rank: "D", icon: "🔵", gradient: "linear-gradient(135deg,#0a1a3a,#050d20)", border: "#38bdf8", glow: "#38bdf8", portalColor: ["#38bdf8", "#0369a1"], desc: "ذئاب أقوى وكائنات متوحشة" },
  C_RANK: { label: "بوابة C", rank: "C", icon: "🟡", gradient: "linear-gradient(135deg,#1a1a0a,#0e0e05)", border: "#facc15", glow: "#facc15", portalColor: ["#facc15", "#ca8a04"], desc: "غيلان وأوغار — بداية الخطر الحقيقي" },
  B_RANK: { label: "بوابة B", rank: "B", icon: "🟠", gradient: "linear-gradient(135deg,#2a1000,#100800)", border: "#f97316", glow: "#fb923c", portalColor: ["#f97316", "#c2410c"], desc: "غيلان أقوياء وزعماء صغار" },
  A_RANK: { label: "بوابة A", rank: "A", icon: "🔴", gradient: "linear-gradient(135deg,#1a0a2a,#0a0515)", border: "#a855f7", glow: "#c084fc", portalColor: ["#a855f7", "#6d28d9"], desc: "زعماء أقوياء وقدرات سحرية خطرة" },
  S_RANK: { label: "بوابة S", rank: "S", icon: "⚫", gradient: "linear-gradient(135deg,#0a0020,#040010)", border: "#7c3aed", glow: "#8b5cf6", portalColor: ["#7c3aed", "#4c1d95"], desc: "وحوش كارثية — معارك إبادة حقيقية" },
  RED_GATE: { label: "البوابة الحمراء", rank: "RED", icon: "🟥", gradient: "linear-gradient(135deg,#2a0005,#0a0002)", border: "#ff003c", glow: "#ff003c", portalColor: ["#ff003c", "#5a000c"], desc: "⚠ أخطر بوابة — احتمال نجاة قليل جداً" },
};

// ─── MONSTERS (نظام الأنمي من E إلى البوابة الحمراء) ────────────────────────
const MONSTERS = {
  // 🟢 E Rank — سلايمات وحشرات وذئاب ضعيفة
  E_RANK: [
    "سلايم أزرق",
    "سلايم أحمر سام",
    "حشرة الكهف ",
    "ذئب الغابة الصغير",
    "خفاش الكهف",
    "دودة الأرض ",
  ],
  // 🔵 D Rank — ذئاب أقوى وكائنات متوحشة
  D_RANK: [
    "ذئب الجليد الأبيض",
    "كائن الظلام الصغير",
    "وحش الغابة المتوحش",
    "جرذ الكهف العملاق",
    "غوبلن متشرس",
    "حارس الحجرة الحجري الصغير",
  ],
  // 🟡 C Rank — غيلان وأوغار ووحوش متوسطة
  C_RANK: [
    "غول أسود ضعيف",
    "أورك مقاتل",
    "وحش الأراضي القاحلة",
    "ساحر وحوش صغير",
    "زعيم الغوبلن",
    "ذئب دموي متوحش",
  ],
  // 🟠 B Rank — غيلان أقوياء وزعماء صغار ووحوش ذكية
  B_RANK: [
    "غول ملكي",
    "قائد الأوركيين",
    "ساحر الوحوش الكبير",
    "بارون الأعماق المظلمة",
    "حارس البوابة الأسود",
    "فارس الظلام الأول",
  ],
  // 🔴 A Rank — زعماء أقوياء ووحوش ضخمة وقدرات سحرية
  A_RANK: [
    "فارس الظلام الملكي",
    "تنين الكهف العتيق",
    "الأمير الشيطاني الأحمر",
    "قائد جيش الجحيم",
    "سيد الغاب المظلم",
    "ساحر الدمار الكبير",
  ],
  // ⚫ S Rank — وحوش كارثية وزعماء ملوك (مصدر جنود الظل النادرين)
  S_RANK: [
    "إيغريس — فارس النخبة الأحمر",
    "تانك — القائد الأزرق الفولاذي",
    "تاسك — ساحر الظل الأعظم",
    "كاساكا — ملك الثعابين السام",
    "يوغومنت — ملك الجن الجليدي",
    "آيرون — قائد الفرسان الحديدي",
  ],
  // 🟥 البوابة الحمراء — أخطر وحوش في العالم (مصدر بيرو وبيليون)
  RED_GATE: [
    "ملك الشياطين باران",
    "ملك الوحوش راكان",
    " ملك الحشرات كوريشا ",
    "ملك الجليد سيلد",
    "ملك العمالقه ليجيا",
    "ملك الجسد الحديدي تارناك"
  ],
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
  const v = GATE_VISUALS[diffKey] || GATE_VISUALS.E_RANK;
  const d = GATE_DIFFICULTY[diffKey] || GATE_DIFFICULTY.E_RANK;
  const [hovered, setHovered] = useState(false);
  // البوابة الحمراء تحصل على كارت كامل العرض مع BossPortalSVG
  const isRedGate = diffKey === "RED_GATE";
  // S Rank تحصل على BossPortalSVG لكن بدون span-2
  const isSRank = diffKey === "S_RANK";

  if (isRedGate) {
    return (
      <div onClick={() => onSelect(diffKey)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ ...glass({ padding: "28px 20px 22px" }), background: "linear-gradient(160deg,#1a0002,#0a0001,#040001)", border: `1px solid ${hovered ? "#ff003c" : "#ff003c60"}`, boxShadow: hovered ? "0 0 70px #ff003c50,0 12px 40px rgba(0,0,0,0.8)" : "0 0 24px #ff003c20", cursor: "pointer", textAlign: "center", position: "relative", overflow: "visible", transform: hovered ? "translateY(-6px) scale(1.03)" : "none", transition: "all 0.3s cubic-bezier(.34,1.4,.64,1)", display: "flex", flexDirection: "column", alignItems: "center", gap: 0, gridColumn: "span 2" }}>
        <HudCorners color="#ff003c" size={13} />
        {[{ top: -8, left: -8 }, { top: -8, right: -8 }, { bottom: -8, left: -8 }, { bottom: -8, right: -8 }].map((pos, i) => (
          <div key={i} style={{ position: "absolute", ...pos, width: 14, height: 14, background: "#ff003c", clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)", opacity: hovered ? 0.9 : 0.4, animation: `pulseOpacity ${1.4 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
        ))}
        <div style={{ position: "absolute", top: 12, right: 14, fontFamily: "monospace", fontSize: 9, letterSpacing: 2, color: "#ff003c", fontWeight: 700, background: "rgba(255,0,60,0.12)", border: "1px solid rgba(255,0,60,0.35)", borderRadius: 4, padding: "2px 7px" }}>RED</div>
        <div style={{ position: "absolute", top: 12, left: 14, fontFamily: "'Orbitron',monospace", fontSize: 8, letterSpacing: 1, color: "#ff003c", fontWeight: 700, animation: "pulseOpacity 0.8s ease-in-out infinite" }}>⚠ DANGER</div>
        <div style={{ marginTop: 8, marginBottom: 10 }}><BossPortalSVG size={130} pulse={hovered} /></div>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 16, fontWeight: 900, color: "#ff003c", letterSpacing: 2, marginBottom: 4, textShadow: hovered ? "0 0 24px #ff003c90" : "0 0 12px #ff003c50" }}>🟥 البوابة الحمراء</div>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#ff003c90", letterSpacing: 1, marginBottom: 14 }}>⚠ أخطر بوابة — احتمال نجاة قليل جداً</div>
        <div style={{ display: "flex", gap: 0, width: "100%", border: "1px solid rgba(255,0,60,0.15)", borderRadius: 8, overflow: "hidden" }}>
          {[{ label: "HP", val: (d?.hp || 0).toLocaleString(), color: "#ef4444" }, { label: "EXP", val: `+${(d?.exp || 0).toLocaleString()}`, color: "#ff003c" }, { label: "STA", val: d?.stamina || 0, color: T.blue }].map(({ label, val, color }, i) => (
            <div key={label} style={{ flex: 1, textAlign: "center", padding: "10px 6px", borderLeft: i > 0 ? "1px solid rgba(255,0,60,0.12)" : "none", background: "rgba(0,0,0,0.3)" }}>
              <div style={{ fontFamily: "monospace", fontSize: 12, color, fontWeight: 700 }}>{val}</div>
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
      {isSRank ? <BossPortalSVG size={90} pulse={hovered} /> : <PortalSVG colors={v.portalColor} size={80} pulse={hovered} />}
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

// ─── HP BAR (used in status panel) ───────────────────────────────────────────
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

// ─── COMBAT LOG ───────────────────────────────────────────────────────────────
function CombatLog({ entries }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [entries]);
  const colors = { player: "#22d3ee", enemy: "#ef4444", crit: "#fbbf24", skill: "#a855f7", heal: "#10b981", system: "#6b7280", dodge: "#fbbf24", victory: "#10b981", defeat: "#ef4444" };
  return (
    <div ref={ref} style={{ maxHeight: 90, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3, padding: "6px 10px" }}>
      {entries.map((e, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: "monospace", fontSize: 10, opacity: Math.max(0.35, 1 - (entries.length - 1 - i) * 0.12) }}>
          <span style={{ color: T.muted, fontSize: 9, flexShrink: 0 }}>{e.time}</span>
          <span style={{ color: colors[e.type] || T.muted }}>{e.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── VISUAL COMPONENTS (no game logic) ───────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// CSS pixel-art figure (head + body + legs)
function CssFigure({ head, body, legs, scale = 1 }) {
  const s = scale;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: s * 2, paddingBottom: s * 4 }}>
      <div style={{ width: s * 22, height: s * 22, borderRadius: "50% 50% 42% 42%", background: head }} />
      <div style={{ width: s * 28, height: s * 32, borderRadius: s * 4, background: body, boxShadow: `inset 0 -${s * 4}px ${s * 8}px rgba(0,0,0,0.4)` }} />
      <div style={{ display: "flex", gap: s * 4 }}>
        <div style={{ width: s * 11, height: s * 22, borderRadius: `0 0 ${s * 4}px ${s * 4}px`, background: legs }} />
        <div style={{ width: s * 11, height: s * 22, borderRadius: `0 0 ${s * 4}px ${s * 4}px`, background: legs }} />
      </div>
    </div>
  );
}

// Player color theme
const PLAYER_THEME = {
  head: "linear-gradient(135deg,#c4b5fd,#8b5cf6)",
  body: "linear-gradient(180deg,#1e1b4b,#0f0a2d)",
  legs: "#06040f",
  glow: "#8b5cf6",
  label: "HUNTER",
};

// Monster color themes per gate type (نظام الأنمي)
const MONSTER_THEME = {
  E_RANK: { head: "linear-gradient(135deg,#4ade80,#16a34a)", body: "linear-gradient(180deg,#0a2a12,#041008)", legs: "#020802", glow: "#4ade80" },
  D_RANK: { head: "linear-gradient(135deg,#38bdf8,#0369a1)", body: "linear-gradient(180deg,#0a1a30,#040c18)", legs: "#020608", glow: "#38bdf8" },
  C_RANK: { head: "linear-gradient(135deg,#facc15,#ca8a04)", body: "linear-gradient(180deg,#1a1604,#0a0c02)", legs: "#040400", glow: "#facc15" },
  B_RANK: { head: "linear-gradient(135deg,#fb923c,#c2410c)", body: "linear-gradient(180deg,#2a1004,#120800)", legs: "#060300", glow: "#f97316" },
  A_RANK: { head: "linear-gradient(135deg,#c084fc,#6d28d9)", body: "linear-gradient(180deg,#1a0a30,#0a0418)", legs: "#040208", glow: "#a855f7" },
  S_RANK: { head: "linear-gradient(135deg,#818cf8,#3730a3)", body: "linear-gradient(180deg,#0f0e2a,#060614)", legs: "#020208", glow: "#6366f1" },
  RED_GATE: { head: "linear-gradient(135deg,#ff003c,#7f0000)", body: "linear-gradient(180deg,#1a0000,#080000)", legs: "#030000", glow: "#ff003c" },
};

// Character card with border, aura, and idle animation
function CharCard({ theme, scale = 1, isHit, isAttacking, anim, name, rankBadge, rankColor, hp, maxHp, showRage }) {
  const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const hpCol = hpPct > 50 ? "#10b981" : hpPct > 20 ? "#eab308" : "#ef4444";
  const activeGlow = showRage ? "#ef4444" : theme.glow;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, position: "relative" }}>

      {/* Outer aura rings */}
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 90 * scale, height: 90 * scale, borderRadius: "50%", border: `1px solid ${activeGlow}30`, animation: "charAura 3s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 120 * scale, height: 120 * scale, borderRadius: "50%", border: `1px solid ${activeGlow}18`, animation: "charAura 4s ease-in-out infinite reverse", pointerEvents: "none", zIndex: 0 }} />

      {/* Card frame */}
      <div
        style={{
          width: 72 * scale,
          height: 92 * scale,
          borderRadius: 12,
          overflow: "hidden",
          border: `1.5px solid ${activeGlow}50`,
          boxShadow: `0 0 20px ${activeGlow}25, inset 0 0 20px rgba(0,0,0,0.5)`,
          background: "linear-gradient(160deg,#0d1220,#080c1a)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
          animation: isHit
            ? "charHit 0.4s ease-out"
            : isAttacking
              ? "charAttack 0.45s ease-out"
              : anim === "idle"
                ? "charIdle 3s ease-in-out infinite"
                : anim === "rage"
                  ? "charRage 0.9s ease-in-out infinite"
                  : "charIdle 3s ease-in-out infinite",
        }}
      >
        {/* Bottom gradient */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", background: `linear-gradient(0deg,${activeGlow}18,transparent)`, pointerEvents: "none" }} />
        <CssFigure head={theme.head} body={theme.body} legs={theme.legs} scale={scale} />
      </div>

      {/* Name */}
      <div
        style={{
          fontFamily: "'Orbitron',monospace",
          fontSize: 9 * scale,
          color: activeGlow,
          letterSpacing: 1,
          textShadow: `0 0 8px ${activeGlow}80`,
          textAlign: "center",
          maxWidth: 100 * scale,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </div>

      {/* Rank badge */}
      {rankBadge && (
        <div style={{ fontFamily: "monospace", fontSize: 8, color: rankColor || activeGlow, background: `${rankColor || activeGlow}15`, border: `1px solid ${rankColor || activeGlow}40`, borderRadius: 4, padding: "1px 6px", letterSpacing: 1 }}>
          {rankBadge}
        </div>
      )}

      {/* HP bar */}
      <div style={{ width: 80 * scale }}>
        <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden", border: `1px solid ${hpCol}30` }}>
          <div style={{ height: "100%", width: `${hpPct}%`, background: `linear-gradient(90deg,${hpCol}80,${hpCol})`, borderRadius: 99, transition: "width 0.4s ease", boxShadow: `0 0 6px ${hpCol}80` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
          <span style={{ fontFamily: "monospace", fontSize: 8, color: T.muted }}>HP</span>
          <span style={{ fontFamily: "monospace", fontSize: 8, color: hpCol, fontWeight: 700 }}>{hp.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// Perspective grid floor
function GridFloor({ glow }) {
  return (
    <div style={{ position: "absolute", bottom: "22%", left: 0, right: 0, height: "50%", overflow: "hidden", pointerEvents: "none" }}>
      {/* Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${glow}08 1px,transparent 1px),linear-gradient(90deg,${glow}08 1px,transparent 1px)`,
          backgroundSize: "55px 55px",
          transform: "perspective(500px) rotateX(55deg) scaleY(2.4) translateY(28%)",
          transformOrigin: "bottom center",
        }}
      />
      {/* Glow line on floor */}
      <div style={{ position: "absolute", bottom: 0, left: "5%", right: "5%", height: 2, background: `linear-gradient(90deg,transparent,${glow},transparent)`, boxShadow: `0 0 18px ${glow}, 0 0 40px ${glow}50` }} />
    </div>
  );
}

// ── بوابة ضوئية خلف العدو ──────────────────────────────────────────────────────
function GatePortalBG({ glow, isBoss, rage }) {
  const color = rage ? "#ff003c" : glow;
  const size = isBoss ? 290 : 220;
  return (
    <div style={{ position: "absolute", top: "1%", left: "50%", transform: "translateX(-50%)", width: size, height: size, pointerEvents: "none", zIndex: 1 }}>
      {/* حلقات دوارة */}
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${color}30`, animation: "portalSpin1 16s linear infinite", boxShadow: `0 0 70px ${color}22` }} />
      <div style={{ position: "absolute", inset: "12%", borderRadius: "50%", border: `1px solid ${color}45`, animation: "portalSpin1 10s linear infinite reverse" }} />
      <div style={{ position: "absolute", inset: "24%", borderRadius: "50%", border: `2px dashed ${color}65`, animation: "portalSpin1 7s linear infinite" }} />
      <div style={{ position: "absolute", inset: "36%", borderRadius: "50%", border: `1px solid ${color}80`, animation: "portalSpin1 4s linear infinite reverse" }} />
      {/* قلب متوهج */}
      <div style={{ position: "absolute", inset: "20%", borderRadius: "50%", background: `radial-gradient(circle, ${color}35 0%, ${color}12 45%, transparent 75%)`, animation: "portalPulse 2.5s ease-in-out infinite" }} />
      {/* هالة خارجية */}
      <div style={{ position: "absolute", inset: "-8%", borderRadius: "50%", background: `radial-gradient(circle, transparent 42%, ${color}0a 70%, transparent 100%)`, animation: "portalPulse 3.5s ease-in-out infinite", animationDelay: "0.6s" }} />
      {/* ظل الأرضية */}
      <div style={{ position: "absolute", bottom: "-28%", left: "18%", right: "18%", height: 24, borderRadius: "50%", background: `radial-gradient(ellipse, ${color}28 0%, transparent 70%)`, filter: "blur(12px)" }} />
    </div>
  );
}

// ── ضباب جوي بالأرضية ─────────────────────────────────────────────────────────
function FogLayer({ glow }) {
  const fogs = [
    { w: "72%", l: "14%", h: 52, delay: "0s", dur: "9s" },
    { w: "58%", l: "28%", h: 38, delay: "1.5s", dur: "11s" },
    { w: "82%", l: "4%", h: 44, delay: "3s", dur: "8s" },
    { w: "48%", l: "38%", h: 32, delay: "2s", dur: "13s" },
    { w: "62%", l: "18%", h: 28, delay: "4s", dur: "10s" },
  ];
  return (
    <div style={{ position: "absolute", bottom: "18%", left: 0, right: 0, height: "34%", pointerEvents: "none", zIndex: 2, overflow: "hidden" }}>
      {fogs.map((f, i) => (
        <div key={i} style={{ position: "absolute", bottom: `${i * 11}%`, left: f.l, width: f.w, height: f.h, borderRadius: "50%", background: `radial-gradient(ellipse, ${glow}0e 0%, transparent 70%)`, filter: "blur(16px)", animation: `fogDrift ${f.dur} ease-in-out infinite`, animationDelay: f.delay }} />
      ))}
    </div>
  );
}

// ── ركائز رونية جانبية (S/RED) ────────────────────────────────────────────────
function RunePillars({ color }) {
  return (
    <>
      {["left", "right"].map((side, idx) => (
        <div key={side} style={{ position: "absolute", bottom: "18%", [side]: "4%", width: 2, height: "44%", background: `linear-gradient(180deg,transparent,${color}55,transparent)`, boxShadow: `0 0 14px ${color}40`, animation: `portalPulse ${2.2 + idx * 0.6}s ease-in-out infinite`, animationDelay: `${idx * 0.5}s`, pointerEvents: "none", zIndex: 3 }}>
          {[18, 44, 70].map((top, j) => (
            <div key={j} style={{ position: "absolute", top: `${top}%`, left: -5, width: 12, height: 2, background: `${color}75`, boxShadow: `0 0 7px ${color}`, animation: `portalPulse ${1.6 + j * 0.4}s ease-in-out infinite`, animationDelay: `${j * 0.6}s` }} />
          ))}
        </div>
      ))}
    </>
  );
}

// ── برق / شرارات (RED gate فقط) ───────────────────────────────────────────────
function LightningStreaks() {
  const c = "#ff003c";
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}>
      {[
        { top: "7%", left: "16%", rot: -14, dur: "2.3s", del: "0s" },
        { top: "13%", left: "68%", rot: 11, dur: "3.2s", del: "0.9s" },
        { top: "4%", left: "44%", rot: -4, dur: "1.9s", del: "1.7s" },
      ].map((s, i) => (
        <div key={i} style={{ position: "absolute", top: s.top, left: s.left, width: 1, height: "24%", background: `linear-gradient(180deg,transparent,${c},transparent)`, boxShadow: `0 0 8px ${c}, 0 0 18px ${c}55`, animation: `lightningFlash ${s.dur} ease-in-out infinite`, animationDelay: s.del, opacity: 0, transform: `rotate(${s.rot}deg)` }} />
      ))}
    </div>
  );
}

// Floating damage numbers
function FloatDmg({ text, color, big }) {
  return (
    <div style={{
      position: "absolute",
      top: big ? "15%" : "25%",
      left: "50%",
      transform: "translateX(-50%)",
      fontFamily: "'Orbitron',monospace",
      fontSize: big ? 32 : 22,
      fontWeight: 900,
      color,
      textShadow: `0 0 ${big ? 24 : 14}px ${color}, 0 0 ${big ? 48 : 24}px ${color}60`,
      animation: "floatUpFade 1.2s ease-out forwards",
      pointerEvents: "none",
      whiteSpace: "nowrap",
      zIndex: 60,
      letterSpacing: big ? 2 : 1,
    }}>
      {text}
    </div>
  );
}

// Slash effect SVG
function SlashEffect({ active, color }) {
  if (!active) return null;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 55 }}>
      <svg width="160" height="120" viewBox="0 0 160 120" style={{ overflow: "visible" }}>
        <defs>
          <filter id="sf-blur"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>
        {/* Glow */}
        <line x1="20" y1="100" x2="140" y2="20" stroke={color} strokeWidth="16" strokeLinecap="round" opacity="0.25" filter="url(#sf-blur)" style={{ animation: "sfIn 0.28s ease-out forwards" }} />
        {/* Sharp */}
        <line x1="20" y1="100" x2="140" y2="20" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{ animation: "sfIn 0.28s ease-out forwards" }} />
        {/* Secondary */}
        <line x1="35" y1="110" x2="148" y2="32" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.45" style={{ animation: "sfIn 0.32s ease-out 0.03s forwards" }} />
        {/* White core */}
        <line x1="60" y1="90" x2="120" y2="45" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.6" style={{ animation: "sfIn 0.24s ease-out forwards" }} />
      </svg>
      <style>{`
        @keyframes sfIn {
          0%   { opacity:0; stroke-dasharray:300; stroke-dashoffset:300; }
          40%  { opacity:1; }
          100% { stroke-dashoffset:0; opacity:0; }
        }
      `}</style>
    </div>
  );
}

// Critical screen flash
function CritFlash({ active }) {
  if (!active) return null;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 150, animation: "critScreenFlash 0.45s ease-out forwards" }} />
  );
}

// ─── SKILL BUTTON ─────────────────────────────────────────────────────────────
function SkillBtn({ icon, label, sublabel, color, onClick, disabled, ultimate, style: extraStyle }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      disabled={disabled}
      style={{
        width: 62,
        height: 62,
        borderRadius: 12,
        border: `1.5px solid ${disabled ? "rgba(255,255,255,0.1)" : hov ? color : color + "60"}`,
        background: disabled
          ? "rgba(255,255,255,0.04)"
          : hov
            ? `${color}22`
            : ultimate
              ? `${color}12`
              : "rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        boxShadow: disabled ? "none" : hov ? `0 4px 22px ${color}45, 0 0 0 1px ${color}30` : ultimate ? `0 0 12px ${color}25` : "none",
        transform: hov && !disabled ? "translateY(-3px)" : "none",
        transition: "all 0.2s cubic-bezier(.34,1.4,.64,1)",
        position: "relative",
        overflow: "hidden",
        ...extraStyle,
      }}
    >
      {/* Shimmer on hover */}
      {hov && !disabled && (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,0.08),transparent)", pointerEvents: "none" }} />
      )}
      <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 7.5, color: disabled ? T.muted : color, letterSpacing: 0.5, fontWeight: 700 }}>{label}</span>
      {sublabel && (
        <span style={{ fontFamily: "monospace", fontSize: 6.5, color: disabled ? T.muted : color + "aa", letterSpacing: 0 }}>{sublabel}</span>
      )}
      {/* Ultimate energy bar at bottom */}
      {ultimate && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.08)" }}>
          <div style={{ height: "100%", width: disabled ? "0%" : "100%", background: `linear-gradient(90deg,${color},${color}cc)`, boxShadow: `0 0 6px ${color}` }} />
        </div>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── BATTLE SCREEN ────────────────────────────────────────────────────────────
// ALL game logic functions below are 100% UNCHANGED from the original.
// Only the JSX return() has been replaced with the new visual design.
// ═══════════════════════════════════════════════════════════════════════════════
function BattleScreen({ gate, monster, state, onVictory, onDefeat, onEscape, playerName, skillName, skillMult, skillUsedToday }) {
  const v = GATE_VISUALS[gate];
  const d = GATE_DIFFICULTY[gate];
  const isBoss = gate === "S_RANK" || gate === "RED_GATE";
  const maxPHP = maxPlayerHp(effectiveStats(state));
  const eff = effectiveStats(state);

  // ── حالة القتال (UNCHANGED) ──
  const [enemyHp, setEnemyHp] = useState(d.hp);
  const [playerHp, setPlayerHp] = useState(state.playerHp);
  const [turn, setTurn] = useState("player");
  const [phase, setPhase] = useState("choice");
  const [log, setLog] = useState([{ type: "system", msg: `⚔ دخلت البوابة! واجهت ${monster}`, time: now() }]);
  const [floats, setFloats] = useState([]);
  const [skillUsed, setSkillUsed] = useState(skillUsedToday);
  const [potions, setPotions] = useState(state.potions || 0);
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [enemyHitTrigger, setEnemyHitTrigger] = useState(0);
  const [playerHitTrigger, setPlayerHitTrigger] = useState(0);
  const [isRaged, setIsRaged] = useState(false);
  const rage = isRaged;

  // ── Visual-only state (purely cosmetic, zero impact on game logic) ──
  const [slashActive, setSlashActive] = useState(false);
  const [critFlashOn, setCritFlashOn] = useState(false);
  const [playerDashing, setPlayerDashing] = useState(false);
  const [monsterDyingFx, setMonsterDyingFx] = useState(false);
  const prevEnemyTrig = useRef(0);
  const prevPlayerTrig = useRef(0);

  // ── Parry System ──
  const [parryActive, setParryActive] = useState(false);
  const [parryDmg, setParryDmg] = useState(null);
  const parryTimerRef = useRef(null);

  // Player attack → dash + slash (triggered by enemyHitTrigger without touching logic)
  useEffect(() => {
    if (!enemyHitTrigger || enemyHitTrigger === prevEnemyTrig.current) return;
    prevEnemyTrig.current = enemyHitTrigger;
    setPlayerDashing(true);
    setTimeout(() => setSlashActive(true), 180);
    setTimeout(() => setSlashActive(false), 430);
    setTimeout(() => setPlayerDashing(false), 480);
  }, [enemyHitTrigger]);

  // Crit float → screen flash (triggered by floats without touching logic)
  useEffect(() => {
    const hasCrit = floats.some(f => f.text && f.text.includes("CRITICAL"));
    if (hasCrit) {
      setCritFlashOn(true);
      setTimeout(() => setCritFlashOn(false), 500);
    }
  }, [floats]);

  // Monster death visual
  useEffect(() => {
    if (outcome === "victory") {
      setTimeout(() => setMonsterDyingFx(true), 100);
    }
  }, [outcome]);

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

  // ── الهجوم (UNCHANGED) ──
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
    setEnemyHitTrigger(Date.now());
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
      setTurn("end"); setOutcome("victory"); setPhase("end");
      setTimeout(() => onVictory({ playerHp: playerHp, potions }), 900);
      return;
    }
    if (!isRaged && newEnemyHp / d.hp <= 0.5) {
      setIsRaged(true);
      if (isBoss) setTimeout(() => sfxBossRoar(), 250);
      addLog("system", `🔥 ${monster} دخل وضع الغضب! قوته تضاعفت!`);
    }
    setTimeout(() => enemyTurn(newEnemyHp), 700);
  }

  // ── تطبيق ضرر الوحش (مشترك بين الهجوم العادي وعقوبة الباري) ──
  function applyMonsterDmg(rawDmg, rageMult, penaltyMult = 1) {
    const finalDmg = Math.floor(rawDmg * rageMult * penaltyMult);
    const newPlayerHp = Math.max(0, playerHp - finalDmg);
    setShakePlayer(true);
    setTimeout(() => setShakePlayer(false), 400);
    setPlayerHp(newPlayerHp);
    setPlayerHitTrigger(Date.now());
    setTimeout(() => sfxHit(), 80);
    if (penaltyMult >= 2) {
      addFloat(`💥 -${finalDmg} ×2`, "#ef4444", true);
      addLog("enemy", `💥 فشلت في الصد! ${monster} ضربك بـ ${finalDmg} دمج مضاعف!`);
    } else {
      addFloat(`-${finalDmg}`, "#ef4444");
      addLog("enemy", `🩸 ${monster} ضربك بـ ${finalDmg} دمج${rageMult > 1 ? " (RAGE!)" : ""}`);
    }
    if (newPlayerHp <= 0) {
      addLog("defeat", "💀 سقطت في المعركة...");
      sfxDefeat();
      setTurn("end"); setOutcome("defeat"); setPhase("end");
      setTimeout(() => onDefeat({ playerHp: 0, potions }), 900);
      return;
    }
    setTimeout(() => { setTurn("player"); setPhase("choice"); }, 600);
  }

  // ── دور العدو ──
  function enemyTurn(currentEnemyHp) {
    setTurn("enemy"); setPhase("result");
    const [min, max] = d.monsterDmg;
    const rawDmg = min + Math.floor(Math.random() * (max - min + 1));
    const rageMult = isRaged ? 2 : 1;
    const agi = eff.AGI || 10;
    const dodgeChance = Math.min(0.35, agi * 0.004);
    const dodged = Math.random() < dodgeChance;
    if (dodged) {
      addFloat("DODGE!", "#fbbf24");
      addLog("dodge", `💨 تحاشيت هجوم ${monster}!`);
      sfxDodge();
      setTimeout(() => { setTurn("player"); setPhase("choice"); }, 600);
      return;
    }
    // 25% فرصة تفعيل نافذة الباري
    if (Math.random() < 0.25) {
      setParryDmg({ rawDmg, rageMult });
      setParryActive(true);
      parryTimerRef.current = setTimeout(() => {
        setParryActive(false);
        setParryDmg(null);
        applyMonsterDmg(rawDmg, rageMult, 7); // ضرر مضاعف كعقوبة
      }, 500);
      return;
    }
    applyMonsterDmg(rawDmg, rageMult);
  }

  // ── الضغط على زر الباري ──
  function doParry() {
    if (!parryActive) return;
    clearTimeout(parryTimerRef.current);
    setParryActive(false);
    setParryDmg(null);
    addFloat("⚡ PARRY!", "#fbbf24", true);
    addLog("dodge", `⚡ صددت هجوم ${monster}! ضربة معاكسة!`);
    sfxDodge();
    // ضربة معاكسة ×1.5
    setTimeout(() => {
      const str = eff.STR || 10;
      const base = Math.floor(str * 2.2 + Math.random() * (str * 0.8));
      const dmg = Math.floor(base * 1.5);
      const newEnemyHp = Math.max(0, enemyHp - dmg);
      setShakeEnemy(true);
      setTimeout(() => setShakeEnemy(false), 400);
      setEnemyHp(newEnemyHp);
      setEnemyHitTrigger(Date.now());
      sfxSword();
      setTimeout(() => sfxHit(), 90);
      addFloat(`⚡ -${dmg}`, "#fbbf24", true);
      addLog("skill", `⚡ ضربة معاكسة! ضربت ${monster} بـ ${dmg} دمج`);
      if (newEnemyHp <= 0) {
        addLog("victory", `🏆 انتصرت! ${monster} هُزم!`);
        sfxVictory();
        setTurn("end"); setOutcome("victory"); setPhase("end");
        setTimeout(() => onVictory({ playerHp, potions }), 900);
        return;
      }
      if (!isRaged && newEnemyHp / d.hp <= 0.5) {
        setIsRaged(true);
        if (isBoss) setTimeout(() => sfxBossRoar(), 250);
        addLog("system", `🔥 ${monster} دخل وضع الغضب! قوته تضاعفت!`);
      }
      setTimeout(() => { setTurn("player"); setPhase("choice"); }, 600);
    }, 200);
  }

  // ── مهارة (UNCHANGED) ──
  function doSkill() {
    if (skillUsed || !skillName) return;
    setSkillUsed(true);
    doAttack(skillMult || 1.5);
  }

  // ── جرعة شفاء (UNCHANGED) ──
  function doPotion() {
    if (potions <= 0 || turn !== "player" || phase !== "choice") return;
    const heal = 50;
    const newHp = Math.min(maxPHP, playerHp + heal);
    setPotions(p => p - 1);
    setPlayerHp(newHp);
    sfxHeal();
    addFloat(`+${heal} HP`, "#10b981");
    addLog("heal", `🧪 استخدمت جرعة شفاء! +${heal} HP`);
    setTimeout(() => enemyTurn(enemyHp), 700);
    setPhase("result");
  }

  // ── هروب (UNCHANGED) ──
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
  const rank = rankFromLevel(state.level || 1);
  const monsterTheme = MONSTER_THEME[gate] || MONSTER_THEME.E_RANK;
  const activeMTheme = rage ? { ...monsterTheme, head: "linear-gradient(135deg,#ef4444,#7f1d1d)", glow: "#ef4444" } : monsterTheme;
  const isPlayerTurn = turn === "player" && phase === "choice" && !outcome;
  const isWaiting = turn === "enemy" && !outcome;

  // ── NEW VISUAL RENDER (Star Rail-style) ──────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", flexDirection: "column",
      background: `radial-gradient(ellipse 130% 55% at 50% 0%, ${v.glow}0c 0%, #04060f 50%)`,
      animation: "bsFadeIn 0.35s ease-out both",
    }}>

      {/* ── STAGE (top ~62%) ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0 }}>

        {/* Stage background — طبقات متدرجة */}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 110% 70% at 50% 110%,${v.glow}20 0%,#080d1e 55%,#04060f 100%)` }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 50% at 50% 10%,${v.glow}10 0%,transparent 65%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg,transparent 35%,${v.glow}05 52%,transparent 68%)`, pointerEvents: "none" }} />

        {/* بوابة ضوئية خلف العدو */}
        <GatePortalBG glow={v.glow} isBoss={isBoss} rage={rage} />

        {/* ركائز رونية — S/RED فقط */}
        {(gate === "S_RANK" || gate === "RED_GATE") && <RunePillars color={rage ? "#ff003c" : v.glow} />}

        {/* برق — RED gate فقط */}
        {gate === "RED_GATE" && <LightningStreaks />}

        {/* Perspective grid floor */}
        <GridFloor glow={rage ? "#ef4444" : v.glow} />

        {/* ضباب جوي */}
        <FogLayer glow={rage ? "#ff003c" : v.glow} />

        {/* Ambient particles */}
        {[...Array(14)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${(i * 37 + 13) % 95}%`,
            top: `${(i * 53 + 20) % 70}%`,
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            borderRadius: "50%",
            background: rage ? "#ff003c" : v.glow,
            opacity: 0.4 + (i % 4) * 0.1,
            animation: `stageP${i % 4} ${5 + (i % 5) * 2}s ease-in-out infinite`,
            animationDelay: `${(i % 7) * 0.6}s`,
            pointerEvents: "none",
          }} />
        ))}

        {/* Vignette */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 100% 100% at 50% 50%,transparent 30%,rgba(0,0,0,0.65) 100%)", pointerEvents: "none" }} />

        {/* Rage overlay */}
        {rage && <div style={{ position: "absolute", inset: 0, background: "rgba(255,0,60,0.04)", animation: "rageFlicker 0.5s ease-in-out infinite", pointerEvents: "none" }} />}

        {/* Crit flash */}
        {critFlashOn && <CritFlash active={true} />}

        {/* ── Top bar (gate info + turn) ── */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
          padding: "10px 16px",
          background: "linear-gradient(180deg,rgba(4,6,15,0.95),transparent)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Gate label */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: rage ? "#ef4444" : v.glow }}>{v.icon} {v.label}</span>
            <span style={{ fontFamily: "monospace", fontSize: 8, color: T.muted }}>{v.rank}</span>
            {rage && <span style={{ fontFamily: "monospace", fontSize: 8, color: "#ef4444", fontWeight: 700, animation: "pulseOpacity 0.7s ease-in-out infinite", letterSpacing: 2 }}>⚠ RAGE</span>}
          </div>
          {/* Turn pill */}
          {!outcome ? (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 12px", borderRadius: 999,
              background: isPlayerTurn ? "rgba(34,211,238,0.12)" : isWaiting ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${isPlayerTurn ? "rgba(34,211,238,0.4)" : isWaiting ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.1)"}`,
              fontFamily: "'Orbitron',monospace", fontSize: 9, fontWeight: 700,
              color: isPlayerTurn ? T.cyan : isWaiting ? "#ef4444" : T.muted,
              animation: "pulseOpacity 1.5s ease-in-out infinite",
            }}>
              {isPlayerTurn ? "⚔ دورك" : isWaiting ? `🩸 ${monster} يهاجم...` : "⏳"}
            </div>
          ) : (
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, fontWeight: 900, color: outcome === "victory" ? "#10b981" : "#ef4444", animation: "pulseOpacity 0.9s ease-in-out infinite" }}>
              {outcome === "victory" ? "🏆 VICTORY!" : "💀 DEFEAT"}
            </div>
          )}
        </div>

        {/* ── MONSTER (top center of stage) ── */}
        <div style={{
          position: "absolute", top: "10%", left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex", flexDirection: "column", alignItems: "center",
          animation: shakeEnemy ? "charHit 0.4s ease-out" : "none",
          filter: monsterDyingFx ? "brightness(0)" : undefined,
          opacity: monsterDyingFx ? 0 : 1,
          transition: monsterDyingFx ? "opacity 0.8s ease, filter 0.6s ease" : "none",
        }}>
          {/* Spark canvas */}
          <div style={{ position: "relative" }}>
            <SparkCanvas trigger={enemyHitTrigger} color={v.glow} isBoss={isBoss} side="enemy" />
            <CharCard
              theme={activeMTheme}
              scale={1.35}
              isHit={shakeEnemy}
              isAttacking={false}
              anim={rage ? "rage" : "idle"}
              name={monster}
              rankBadge={rage ? "RAGE MODE" : v.rank}
              rankColor={rage ? "#ef4444" : v.glow}
              hp={enemyHp}
              maxHp={d.hp}
              showRage={rage}
            />
            {/* Slash effect overlaid on monster */}
            <SlashEffect active={slashActive} color={v.glow} />
            {/* Monster float texts */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {floats.filter(f => f.color !== "#ef4444").map(f => <FloatDmg key={f.id} text={f.text} color={f.color} big={f.big} />)}
            </div>
          </div>
          {/* Death smoke */}
          {monsterDyingFx && (
            <div style={{ position: "absolute", inset: "-20px", background: "radial-gradient(circle,rgba(255,255,255,0.3),transparent)", borderRadius: "50%", animation: "deathBurst 0.8s ease-out forwards", pointerEvents: "none", zIndex: 20 }} />
          )}
        </div>

        {/* ── PLAYER (bottom center of stage) ── */}
        <div style={{
          position: "absolute", bottom: "26%", left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex", flexDirection: "column", alignItems: "center",
          animation: shakePlayer ? "charHit 0.4s ease-out" : playerDashing ? "playerDash 0.48s ease-out" : "none",
        }}>
          <div style={{ position: "relative" }}>
            <SparkCanvas trigger={playerHitTrigger} color="#ef4444" isBoss={false} side="player" />
            <CharCard
              theme={PLAYER_THEME}
              scale={1.15}
              isHit={shakePlayer}
              isAttacking={playerDashing}
              anim="idle"
              name={playerName || "صياد"}
              rankBadge={rank.title}
              rankColor={rank.color}
              hp={playerHp}
              maxHp={maxPHP}
              showRage={false}
            />
            {/* Player float texts (damage received) */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {floats.filter(f => f.color === "#ef4444" || f.text === "DODGE!").map(f => <FloatDmg key={f.id} text={f.text} color={f.color} big={f.big} />)}
            </div>
          </div>
        </div>

        {/* ── DEPLOYED SHADOWS (flanking player) ── */}
        {(state.equippedShadows || []).map((id, i) => {
          const soldier = (state.shadowSoldiers || []).find(s => s.id === id);
          if (!soldier) return null;
          const col = SHADOW_SPECIAL_NAMES.includes(soldier.name || "") ? "#ff003c" : (SHADOW_TIER_COLOR[soldier.tier] || "#a855f7");
          const positions = ["30%", "70%"];
          return (
            <div key={id} style={{
              position: "absolute", bottom: "22%",
              left: positions[i] || (i % 2 === 0 ? "20%" : "80%"),
              transform: "translateX(-50%)",
              zIndex: 9,
              display: "flex", flexDirection: "column", alignItems: "center",
              animation: "itemFloat 3s ease-in-out infinite",
              animationDelay: `${i * 0.8}s`,
              opacity: 0.9,
              pointerEvents: "none",
            }}>
              <div style={{
                border: `1px solid ${col}60`,
                borderRadius: "50%",
                padding: 5,
                background: `${col}18`,
                boxShadow: `0 0 14px ${col}50, 0 0 6px ${col}30`,
              }}>
                <ShadowSoldierIcon tier={soldier.tier} uid={soldier.id} size={30} />
              </div>
              <span style={{ fontFamily: "monospace", fontSize: 7, color: col, marginTop: 3, textShadow: `0 0 6px ${col}` }}>
                {soldier.name ? soldier.name.split(" ")[0] : "ظل"} · LV{soldier.level}
              </span>
            </div>
          );
        })}

        {/* ── Combat log (bottom-left of stage) ── */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 15,
          background: "linear-gradient(0deg,rgba(4,6,15,0.95),transparent)",
          paddingBottom: 6,
        }}>
          <div style={{ margin: "0 12px", background: "rgba(4,6,15,0.7)", backdropFilter: "blur(8px)", borderRadius: "8px 8px 0 0", border: `1px solid ${T.border}`, borderBottom: "none" }}>
            <div style={{ padding: "4px 10px", borderBottom: `1px solid ${T.border}30`, fontFamily: "monospace", fontSize: 7.5, letterSpacing: 2, color: T.muted }}>◈ سجل القتال</div>
            <CombatLog entries={log} />
          </div>
        </div>
      </div>

      {/* ── BOTTOM PANEL (Skill Bar) ── */}
      <div style={{
        flexShrink: 0,
        background: "rgba(6,8,18,0.97)",
        borderTop: `1px solid ${v.glow}20`,
        backdropFilter: "blur(16px)",
        padding: "12px 16px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        minHeight: 100,
      }}>

        {/* Player portrait mini */}
        <div style={{
          width: 64, height: 64, borderRadius: 10, overflow: "hidden",
          border: `1.5px solid ${rank.color}60`,
          boxShadow: `0 0 14px ${rank.color}25`,
          background: "linear-gradient(160deg,#0d1220,#080c18)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          flexShrink: 0,
          position: "relative",
        }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", background: `linear-gradient(0deg,${rank.color}20,transparent)` }} />
          <CssFigure head={PLAYER_THEME.head} body={PLAYER_THEME.body} legs={PLAYER_THEME.legs} scale={0.9} />
        </div>

        {/* Player quick-stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginRight: 4, flexShrink: 0 }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, fontWeight: 700, color: T.cyan, letterSpacing: 1 }}>{playerName || "صياد"}</div>
          <div style={{ fontFamily: "monospace", fontSize: 8, color: rank.color }}>{rank.title}</div>
          {/* Mini HP bar */}
          <div style={{ width: 56, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.max(0, (playerHp / maxPHP) * 100)}%`, background: playerHp / maxPHP > 0.5 ? "#10b981" : playerHp / maxPHP > 0.2 ? "#eab308" : "#ef4444", borderRadius: 99, transition: "width 0.4s ease" }} />
          </div>
          {/* Potions */}
          <div style={{ fontFamily: "monospace", fontSize: 8, color: T.muted }}>🧪 ×{potions}</div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 60, background: `linear-gradient(180deg,transparent,${v.glow}30,transparent)`, flexShrink: 0 }} />

        {/* Skill buttons */}
        <div style={{ display: "flex", gap: 8, flex: 1, justifyContent: "center" }}>
          {/* Attack */}
          <SkillBtn
            icon="⚔"
            label="هجوم"
            sublabel="STR×2.2"
            color={v.glow}
            onClick={() => doAttack(1)}
            disabled={!isPlayerTurn}
          />
          {/* Skill */}
          <SkillBtn
            icon="✨"
            label={skillName ? skillName.slice(0, 6) : "لا مهارة"}
            sublabel={skillUsed ? "✓ مُستخدمة" : skillMult ? `×${skillMult}` : ""}
            color={T.gold}
            onClick={doSkill}
            disabled={!isPlayerTurn || skillUsed || !skillName}
            ultimate={!skillUsed && !!skillName}
          />
          {/* Potion */}
          <SkillBtn
            icon="🧪"
            label="شفاء"
            sublabel={`+50 HP`}
            color="#10b981"
            onClick={doPotion}
            disabled={!isPlayerTurn || potions <= 0}
          />
          {/* Escape */}
          <SkillBtn
            icon="🏃"
            label="هروب"
            sublabel="AGI"
            color="#ef4444"
            onClick={doEscape}
            disabled={!isPlayerTurn}
          />
        </div>

        {/* Enemy mini info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0, marginLeft: 4 }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 8, color: rage ? "#ef4444" : v.glow, letterSpacing: 1, textAlign: "right", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{monster}</div>
          <div style={{ fontFamily: "monospace", fontSize: 7, color: T.muted }}>{rage ? "⚠ RAGE" : v.rank}</div>
          <div style={{ width: 56, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${enemyHpPct}%`, background: rage ? "#ef4444" : v.glow, borderRadius: 99, transition: "width 0.4s ease", boxShadow: `0 0 4px ${rage ? "#ef4444" : v.glow}80` }} />
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 7, color: T.muted }}>{enemyHp.toLocaleString()} HP</div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 60, background: `linear-gradient(180deg,transparent,rgba(255,255,255,0.08),transparent)`, flexShrink: 0 }} />

        {/* Monster portrait mini */}
        <div style={{
          width: 64, height: 64, borderRadius: 10, overflow: "hidden",
          border: `1.5px solid ${rage ? "#ef4444" : activeMTheme.glow}50`,
          boxShadow: `0 0 14px ${rage ? "#ef4444" : activeMTheme.glow}20`,
          background: "linear-gradient(160deg,#120a0a,#080608)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          flexShrink: 0,
          position: "relative",
        }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", background: `linear-gradient(0deg,${rage ? "#ef444420" : activeMTheme.glow + "18"},transparent)` }} />
          <CssFigure head={activeMTheme.head} body={activeMTheme.body} legs={activeMTheme.legs} scale={0.9} />
        </div>
      </div>

      {/* ── PARRY OVERLAY ── */}
      {parryActive && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 300,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(3px)",
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <div style={{
              fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 700,
              color: "#fbbf24", letterSpacing: 3,
              animation: "parryWarn 0.25s ease infinite alternate",
            }}>⚠ هجوم قادم!</div>
            <div
              onClick={doParry}
              style={{
                width: 130, height: 130, borderRadius: "50%",
                border: "4px solid #fbbf24",
                boxShadow: "0 0 40px #fbbf2470, 0 0 80px #fbbf2430",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                animation: "parryShrink 0.5s linear forwards",
                background: "rgba(251,191,36,0.08)",
              }}
            >
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 20, fontWeight: 900, color: "#fbbf24", textAlign: "center", lineHeight: 1.2 }}>صـد!</div>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#fbbf2470", letterSpacing: 2 }}>اضغط الآن!</div>
          </div>
        </div>
      )}

      {/* ── All keyframes ── */}
      <style>{`
        @keyframes bsFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes charIdle {
          0%,100% { transform:translateY(0) rotate(0deg); }
          50%      { transform:translateY(-7px) rotate(-2deg); }
        }
        @keyframes charRage {
          0%,100% { transform:translateY(0) scale(1);    }
          50%      { transform:translateY(-9px) scale(1.04); }
        }
        @keyframes charHit {
          0%,100% { transform:translateX(0); filter:brightness(1); }
          15%     { transform:translateX(-10px); filter:brightness(3) saturate(0); }
          40%     { transform:translateX(8px);  filter:brightness(2); }
          65%     { transform:translateX(-5px); filter:brightness(1.5); }
          85%     { transform:translateX(3px);  }
        }
        @keyframes charAttack {
          0%   { transform:translateX(0) scale(1); }
          35%  { transform:translateX(55px) scale(1.1); }
          65%  { transform:translateX(50px) scale(1.05); }
          100% { transform:translateX(0) scale(1); }
        }
        @keyframes playerDash {
          0%   { transform:translateX(-50%) translateY(0); }
          35%  { transform:translateX(calc(-50% + 70px)) translateY(-8px); }
          70%  { transform:translateX(calc(-50% + 60px)) translateY(-5px); }
          100% { transform:translateX(-50%) translateY(0); }
        }
        @keyframes charAura {
          0%,100% { transform:translate(-50%,-50%) scale(1);    opacity:0.6; }
          50%      { transform:translate(-50%,-50%) scale(1.08); opacity:0.3; }
        }
        @keyframes rageFlicker {
          0%,100% { opacity:1;   }
          50%      { opacity:0.2; }
        }
        @keyframes critScreenFlash {
          0%   { background:rgba(255,255,255,0.12); }
          40%  { background:rgba(255,200,0,0.08); }
          100% { background:transparent; }
        }
        @keyframes stageP0 {
          0%,100% { transform:translate(0,0); opacity:0.4; }
          50%      { transform:translate(-12px,-28px); opacity:0.9; }
        }
        @keyframes stageP1 {
          0%,100% { transform:translate(0,0); opacity:0.5; }
          50%      { transform:translate(16px,-34px); opacity:0.2; }
        }
        @keyframes stageP2 {
          0%,100% { transform:translate(0,0) scale(1); opacity:0.6; }
          50%      { transform:translate(-20px,-20px) scale(1.4); opacity:0.3; }
        }
        @keyframes stageP3 {
          0%,100% { transform:translate(0,0); opacity:0.7; }
          40%      { transform:translate(10px,-42px); opacity:0.8; }
          80%      { transform:translate(-8px,-18px); opacity:0.2; }
        }
        @keyframes floatUpFade {
          0%   { transform:translate(-50%,0)     scale(1);    opacity:1; }
          60%  { transform:translate(-50%,-45px)  scale(1.1); opacity:0.9; }
          100% { transform:translate(-50%,-90px)  scale(0.8); opacity:0; }
        }
        @keyframes deathBurst {
          0%   { transform:scale(0);   opacity:0.8; }
          60%  { transform:scale(2.5); opacity:0.5; }
          100% { transform:scale(4);   opacity:0; }
        }
        @keyframes sparkOut {
          0%   { transform:translate(0,0) scale(1); opacity:1; }
          100% { transform:translate(var(--tx),var(--ty)) scale(0); opacity:0; }
        }
        @keyframes portalSpin1 {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
        @keyframes portalPulse {
          0%,100% { opacity:0.55; transform:scale(1);    }
          50%      { opacity:1;    transform:scale(1.06); }
        }
        @keyframes fogDrift {
          0%,100% { transform:translateX(0);    opacity:0.75; }
          50%      { transform:translateX(22px); opacity:0.35; }
        }
        @keyframes lightningFlash {
          0%,80%,100% { opacity:0;   }
          87%          { opacity:0.9; }
          93%          { opacity:0.2; }
        }
        @keyframes parryShrink {
          0%   { transform:scale(1);   opacity:1;   border-color:#fbbf24; box-shadow:0 0 40px #fbbf2470; }
          60%  { transform:scale(0.55); opacity:0.9; border-color:#f97316; box-shadow:0 0 20px #f9731670; }
          100% { transform:scale(0.1); opacity:0;   border-color:#ef4444; }
        }
        @keyframes parryWarn {
          from { opacity:0.6; transform:scale(1);    }
          to   { opacity:1;   transform:scale(1.04); }
        }
      `}</style>
    </div>
  );
}

// ─── VICTORY SCREEN (enhanced) ────────────────────────────────────────────────
function VictoryScreen({ gate, monster, loot, exp, onClose, shadowExtracted, crystalDropped }) {
  const v = GATE_VISUALS[gate];
  return (
    <>
      <style>{`
      @keyframes monarchAppear {
        0%   { opacity:0; transform:translateY(18px) scale(0.94); }
        100% { opacity:1; transform:translateY(0)    scale(1);    }
      }
      @keyframes monarchGlow {
        0%,100% { box-shadow: 0 0 18px rgba(200,0,30,0.25), inset 0 0 20px rgba(80,0,0,0.3); }
        50%      { box-shadow: 0 0 40px rgba(255,0,40,0.55), inset 0 0 35px rgba(120,0,0,0.5); }
      }
      @keyframes monarchTextPulse {
        0%,100% { text-shadow: 0 0 18px #ff003c, 0 0 36px #ff003c60; }
        50%      { text-shadow: 0 0 32px #ff003c, 0 0 65px #ff003c80, 0 0 90px #ff003c30; }
      }
      @keyframes monarchRuneSpin {
        from { transform: rotate(0deg);   opacity: 0.18; }
        to   { transform: rotate(360deg); opacity: 0.22; }
      }
      @keyframes monarchCrownFloat {
        0%,100% { transform: translateY(0)    scale(1);    filter: drop-shadow(0 0 14px #ff003c) brightness(1);   }
        50%      { transform: translateY(-7px) scale(1.07); filter: drop-shadow(0 0 28px #ff003c) brightness(1.2); }
      }
      @keyframes monarchLineExpand {
        from { transform: scaleX(0); opacity:0; }
        to   { transform: scaleX(1); opacity:1; }
      }
    `}</style>
      <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(2,10,4,0.97)", backdropFilter: "blur(22px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.4s ease-out" }}>

        {/* Rotating aura */}
        <div style={{ position: "absolute", inset: -50, opacity: 0.06, background: "conic-gradient(from 0deg,#10b981,transparent,#10b981,transparent)", animation: "auraSpin 8s linear infinite", pointerEvents: "none" }} />

        {/* Grid floor lines */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", backgroundImage: "linear-gradient(rgba(16,185,129,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.04) 1px,transparent 1px)", backgroundSize: "50px 50px", transform: "perspective(400px) rotateX(55deg) scaleY(2) translateY(25%)", transformOrigin: "bottom center", pointerEvents: "none" }} />

        <div style={{
          ...glass({ padding: "36px 32px" }),
          background: "linear-gradient(160deg,#001a06,#00120a,#000e06)",
          border: "1px solid rgba(16,185,129,0.45)",
          maxWidth: 400, width: "90%",
          textAlign: "center", position: "relative",
          animation: "popIn 0.55s cubic-bezier(.34,1.56,.64,1) both",
          boxShadow: "0 0 60px rgba(16,185,129,0.15), 0 20px 60px rgba(0,0,0,0.8)",
        }}>
          <HudCorners color="#10b981" size={13} />

          {/* Trophy */}
          <div style={{ fontSize: 58, marginBottom: 8, animation: "itemFloat 2.5s ease-in-out infinite", filter: "drop-shadow(0 0 24px #10b981)" }}>🏆</div>

          {/* Title */}
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 28, fontWeight: 900, color: "#10b981", marginBottom: 2, textShadow: "0 0 30px #10b98190, 0 0 60px #10b98140", letterSpacing: 3 }}>VICTORY!</div>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: T.muted, marginBottom: 20, letterSpacing: 1 }}>هزمت {monster}</div>

          {/* Divider */}
          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(16,185,129,0.4),transparent)", marginBottom: 20 }} />

          {/* Rewards */}
          <div style={{ display: "flex", gap: 0, marginBottom: 20, border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ flex: 1, padding: "16px 10px", textAlign: "center", background: "rgba(16,185,129,0.06)" }}>
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, color: T.gold, fontWeight: 900, textShadow: "0 0 16px #fbbf2460" }}>+{exp.toLocaleString()}</div>
              <div style={{ fontFamily: "monospace", fontSize: 8, color: T.muted, letterSpacing: 2, marginTop: 3 }}>EXP</div>
            </div>
            {loot && (
              <div style={{ flex: 1, padding: "16px 10px", textAlign: "center", borderLeft: "1px solid rgba(16,185,129,0.15)" }}>
                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 13, color: T.cyan, fontWeight: 700 }}>{loot.name}</div>
                <div style={{ fontFamily: "monospace", fontSize: 8, color: T.muted, letterSpacing: 2, marginTop: 3 }}>{loot.tier} LOOT</div>
              </div>
            )}
          </div>

          {/* ── SHADOW EXTRACTION RESULT ── */}
          {shadowExtracted && (
            <div style={{
              marginBottom: 16,
              padding: "14px",
              background: shadowExtracted.duplicate
                ? "rgba(30,20,0,0.7)"
                : "linear-gradient(160deg,rgba(0,30,15,0.8),rgba(0,15,8,0.95))",
              border: shadowExtracted.duplicate
                ? "1px solid rgba(251,191,36,0.4)"
                : "1px solid rgba(16,185,129,0.45)",
              borderRadius: 12,
              textAlign: "center",
            }}>
              {shadowExtracted.duplicate ? (
                <>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>💰</div>
                  <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, fontWeight: 800, color: "#fbbf24", letterSpacing: 1 }}>جندي مكرر</div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(251,191,36,0.8)", marginTop: 4, direction: "rtl" }}>{shadowExtracted.name}</div>
                  <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, color: "#fbbf24", marginTop: 6, fontWeight: 700 }}>
                    +{SHADOW_SPECIAL_NAMES.includes(shadowExtracted.name || "") ? 300 : 150} 💰 ذهب
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 28, marginBottom: 6, animation: "itemFloat 2.5s ease-in-out infinite" }}>👻</div>
                  <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "rgba(16,185,129,0.6)", marginBottom: 4 }}>◈ SHADOW EXTRACTED</div>
                  <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#10b981", direction: "rtl", textShadow: "0 0 12px #10b98160" }}>
                    {shadowExtracted.name}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── CRYSTAL DROP ── */}
          {crystalDropped && (
            <div style={{
              marginBottom: 16,
              padding: "12px 14px",
              background: "linear-gradient(160deg,rgba(0,10,40,0.8),rgba(0,5,20,0.95))",
              border: "1px solid rgba(96,165,250,0.45)",
              borderRadius: 12,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>💎</div>
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, fontWeight: 800, color: "#60a5fa", letterSpacing: 2 }}>EVOLUTION CRYSTAL</div>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(96,165,250,0.7)", marginTop: 4, direction: "rtl" }}>كرستال التطوير +1</div>
            </div>
          )}

          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "14px",
              borderRadius: 10, border: "none",
              background: "linear-gradient(135deg,#10b981,#059669)",
              color: "#fff", cursor: "pointer",
              fontFamily: "'Orbitron',monospace", fontSize: 14, fontWeight: 900,
              boxShadow: "0 0 28px rgba(16,185,129,0.5), 0 4px 16px rgba(0,0,0,0.4)",
              letterSpacing: 2,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(16,185,129,0.7), 0 6px 20px rgba(0,0,0,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 0 28px rgba(16,185,129,0.5), 0 4px 16px rgba(0,0,0,0.4)"; }}
          >
            ✓ استمر
          </button>
        </div>
      </div>
    </>
  );
}

// ─── DEFEAT SCREEN (enhanced) ─────────────────────────────────────────────────
function DefeatScreen({ monster, onRetry, onEscape }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(10,2,2,0.97)", backdropFilter: "blur(22px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.4s ease-out" }}>

      {/* Rotating aura */}
      <div style={{ position: "absolute", inset: -50, opacity: 0.05, background: "conic-gradient(from 0deg,#ef4444,transparent,#ef4444,transparent)", animation: "auraSpin 10s linear infinite", pointerEvents: "none" }} />

      <div style={{
        ...glass({ padding: "36px 32px" }),
        background: "linear-gradient(160deg,#1a0000,#0f0000,#080000)",
        border: "1px solid rgba(239,68,68,0.45)",
        maxWidth: 380, width: "90%",
        textAlign: "center", position: "relative",
        animation: "popIn 0.55s cubic-bezier(.34,1.56,.64,1) both",
        boxShadow: "0 0 60px rgba(239,68,68,0.15), 0 20px 60px rgba(0,0,0,0.8)",
      }}>
        <HudCorners color="#ef4444" size={13} />

        <div style={{ fontSize: 58, marginBottom: 8, animation: "pulseOpacity 1.5s ease-in-out infinite" }}>💀</div>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 26, fontWeight: 900, color: "#ef4444", marginBottom: 2, textShadow: "0 0 28px #ef444490, 0 0 55px #ef444440", letterSpacing: 3 }}>DEFEAT</div>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: T.muted, marginBottom: 20, letterSpacing: 1 }}>سقطت أمام {monster}</div>

        <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(239,68,68,0.35),transparent)", marginBottom: 20 }} />

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onEscape}
            style={{
              flex: 1, padding: "13px", borderRadius: 10,
              border: `1px solid ${T.border}`, background: "transparent",
              color: T.muted, cursor: "pointer",
              fontFamily: "monospace", fontSize: 12,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            🚪 خروج
          </button>
          <button
            onClick={onRetry}
            style={{
              flex: 2, padding: "13px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg,#ef4444,#b91c1c)",
              color: "#fff", cursor: "pointer",
              fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 900,
              boxShadow: "0 0 22px rgba(239,68,68,0.5), 0 4px 16px rgba(0,0,0,0.4)",
              letterSpacing: 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 32px rgba(239,68,68,0.7)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 0 22px rgba(239,68,68,0.5)"; }}
          >
            ↺ إعادة المحاولة
          </button>
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
    const loot = Math.random() < (d.dropChance || 0.5) ? rollLoot(1, d.weights || GATE_WEIGHTS) : null;
    const shadowResult = rollShadowFromPool(selectedGate);
    let shadowExtracted = null;
    if (shadowResult) {
      const existing = (state.shadowSoldiers || []).find((s) => s.name === shadowResult.name);
      shadowExtracted = { name: shadowResult.name, tier: selectedGate, duplicate: !!existing };
    }
    const crystalDropped = rollCrystalDrop(selectedGate);
    setVictoryData({ exp: d.exp, loot, playerHp, potions: newPotions, shadowExtracted, crystalDropped });
    setInBattle(false);
  }, [selectedGate, state.shadowSoldiers]);

  const handleDefeat = useCallback(({ playerHp }) => {
    setDefeatData({ playerHp });
    setInBattle(false);
  }, []);

  const handleEscape = useCallback(({ playerHp, potions: newPotions }) => {
    setInBattle(false); setSelectedGate(null); setMonster(null);
    if (onBattleEnd) onBattleEnd({ playerHp, potions: newPotions, escaped: true });
  }, [onBattleEnd]);

  const handleVictoryClose = () => {
    if (onBattleEnd) onBattleEnd({ ...victoryData, gate: selectedGate, monster, won: true });
    setVictoryData(null); setSelectedGate(null); setMonster(null);
  };

  const handleRetry = () => { setDefeatData(null); setInBattle(true); };

  const handleDefeatEscape = () => {
    if (onBattleEnd) onBattleEnd({ ...defeatData, gate: selectedGate, won: false });
    setDefeatData(null); setSelectedGate(null); setMonster(null);
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
          const maxHp = maxPlayerHp(effectiveStats(state));
          const hpPct = Math.max(0, Math.min(100, (state.playerHp / maxHp) * 100));
          const hpCol = hpPct > 50 ? "#10b981" : hpPct > 20 ? "#eab308" : "#ef4444";
          return <HpBar current={state.playerHp} max={maxHp} color={hpCol} label="HP" icon="❤️" />;
        })()}
        {(() => {
          const maxSta = state.maxStamina || 700;
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
              {(selectedGate === "S_RANK" || selectedGate === "RED_GATE") ? <BossPortalSVG size={110} pulse /> : <PortalSVG colors={GATE_VISUALS[selectedGate].portalColor} size={100} pulse />}
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
          gate={selectedGate} monster={monster} state={state}
          playerName={playerName} skillName={skill?.name}
          skillMult={skill?.multiplier} skillUsedToday={skillUsedToday}
          onVictory={handleVictory} onDefeat={handleDefeat} onEscape={handleEscape}
        />
      )}

      {/* VICTORY */}
      {victoryData && <VictoryScreen gate={selectedGate} monster={monster} loot={victoryData.loot} exp={victoryData.exp} shadowExtracted={victoryData.shadowExtracted} crystalDropped={victoryData.crystalDropped} onClose={handleVictoryClose} />}

      {/* DEFEAT */}
      {defeatData && <DefeatScreen monster={monster} onRetry={handleRetry} onEscape={handleDefeatEscape} />}
    </div>
  );
}

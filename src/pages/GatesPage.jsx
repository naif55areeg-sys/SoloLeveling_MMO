import { useState, useRef, useEffect, useCallback } from "react";
import { T, glass } from "../constants/tokens";
import { GATE_DIFFICULTY, RANK_SKILLS, rankFromLevel } from "../constants/gameData";
import { HudCorners } from "../components/UI";
import { hpColor } from "../constants/gameLogic";
import { maxPlayerHp, todayStr } from "../constants/gameLogic";

// ─── MONSTERS PER DIFFICULTY ──────────────────────────────────────────────────
const MONSTERS = {
  NORMAL: ["غوبلن المغارة", "ذئب الظلام", "ضفدع السم", "خنزير وحشي", "وحش الصخر"],
  ELITE: ["أورك المحارب", "ذئب الجليد", "عقرب الصحراء", "تنين صغير", "ساحر الظلام"],
  BOSS: ["ملك الغوبلن", "الذئب الأسطوري", "عملاق الجبل", "تنين الجليد", "قائد الشياطين"],
  DUNGEON: ["كاساكا ملك الأفاعي", "ملكة النمل الإمبراطورية", "الشبح الجبار", "ملك الجن الأحمر", "تنين الهاوية الأسود"],
  // 👑 وحش بوابة ملك الدمار الجديدة:
  DESTRUCTION_KING: ["ملك الدمار الأسطوري"],
};

const GATE_VISUALS = {
  NORMAL: {
    label: "بوابة عادية",
    rank: "E~C",
    icon: "◈",
    gradient: `linear-gradient(135deg, #0e4a4a, #0a2a2a)`,
    border: T.cyan,
    glow: "#22d3ee",
    portalColor: ["#22d3ee", "#0891b2"],
    desc: "مغارات ومناطق مشبعة بالطاقة",
  },
  ELITE: {
    label: "بوابة نخبة",
    rank: "B~A",
    icon: "◆",
    gradient: `linear-gradient(135deg, #0e1f4a, #060d2a)`,
    border: T.blue,
    glow: "#260063",
    portalColor: ["#4600c7", "#ae00ff"],
    desc: "طاقة أعلى، وحوش متطورة",
  },
  BOSS: {
    label: "بوابة بوس",
    rank: "A~S",
    icon: "❖",
    gradient: `linear-gradient(135deg, #3a2a00, #1a1000)`,
    border: T.gold,
    glow: "#fbbf24",
    portalColor: ["#fbbf24", "#d97706"],
    desc: "كائن واحد بقوة هائلة",
  },
  DUNGEON: {
    label: "زنزانة",
    rank: "S~SSS",
    icon: "⬡",
    gradient: `linear-gradient(135deg, #2a0a3a, #120018)`,
    border: T.purple,
    glow: "#f75555",
    portalColor: ["#da0000", "#d93428"],
    desc: "أخطر بوابة — مكافأة عالية",
  },
  // 👑 البصريات المرعبة لملحمة ملك الدمار:
  DESTRUCTION_KING: {
    label: "عرش ملك الدمار",
    rank: "مستحيل EX",
    icon: "💀",
    gradient: `linear-gradient(135deg, #2a0005, #0a0002)`, // أسود مع دموي داكن جداً
    border: "#ff003c", // لون الإطار أحمر حاد
    glow: "#ff003c",   // التوهج أحمر صارخ
    portalColor: ["#ff003c", "#5a000c"], // البوابة تدمج الأحمر والأسود الدموي
    desc: "نهاية العالم — البقاء هنا مجرد وهم",
  }
};

// ─── PORTAL SVG ───────────────────────────────────────────────────────────────
function PortalSVG({ colors, size = 90, pulse = false }) {
  const [c1, c2] = colors;
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={`pg-${c1}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c1} stopOpacity="0.9" />
          <stop offset="60%" stopColor={c2} stopOpacity="0.5" />
          <stop offset="100%" stopColor={c2} stopOpacity="0" />
        </radialGradient>
        <filter id="pblur">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {/* outer ring */}
      <circle cx="45" cy="45" r="38" fill="none" stroke={c1} strokeWidth="1.5" strokeDasharray="8 4"
        opacity="0.7"
        style={{ animation: "auraSpin 8s linear infinite", transformOrigin: "45px 45px" }} />
      {/* middle ring */}
      <circle cx="45" cy="45" r="28" fill="none" stroke={c2} strokeWidth="1"
        style={{ animation: "auraSpin 5s linear infinite reverse", transformOrigin: "45px 45px" }} />
      {/* glow fill */}
      <circle cx="45" cy="45" r="24" fill={`url(#pg-${c1})`}
        style={pulse ? { animation: "pulseOpacity 2s ease-in-out infinite" } : {}} />
      {/* inner dark void */}
      <circle cx="45" cy="45" r="16" fill="rgba(0,0,0,0.85)" />
      {/* inner glow */}
      <circle cx="45" cy="45" r="10" fill={c1} opacity="0.3" filter="url(#pblur)"
        style={{ animation: "pulseOpacity 1.5s ease-in-out infinite" }} />
      {/* sparkles */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x = 45 + 33 * Math.cos(rad);
        const y = 45 + 33 * Math.sin(rad);
        return <circle key={i} cx={x} cy={y} r="2" fill={c1} opacity="0.8"
          style={{ animation: `pulseOpacity ${1.2 + i * 0.2}s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />;
      })}
    </svg>
  );
}

// ─── GATE CARD ────────────────────────────────────────────────────────────────
function GateCard({ diffKey, onSelect }) {
  // ◄ حماية جلب البيانات: إذا لم يجد الصعوبة يأخذ الصعوبة العادية (NORMAL) كاحتياط لمنع الكراش
  const v = GATE_VISUALS[diffKey] || GATE_VISUALS.NORMAL;
  const d = GATE_DIFFICULTY[diffKey] || GATE_DIFFICULTY.NORMAL;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onSelect(diffKey)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...glass({ padding: "20px 16px" }),
        background: v?.gradient || "linear-gradient(135deg, #0e4a4a, #0a2a2a)",
        border: `1px solid ${hovered ? v?.border : (v?.border || "#fff") + "60"}`,
        boxShadow: hovered ? `0 0 30px ${v?.glow}40, 0 8px 32px rgba(0,0,0,0.5)` : `0 0 10px ${v?.glow}15`,
        cursor: "pointer",
        textAlign: "center",
        position: "relative",
        overflow: "visible", // ◄ غيرناها لـ visible لكي يظهر نص التولتيب فوق الكرت بدون اختفاء
        transform: hovered ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
        transition: "all 0.25s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <HudCorners color={v?.border} size={10} />

      {/* rank badge */}
      <div style={{
        position: "absolute", top: 10, right: 12,
        fontFamily: "monospace", fontSize: 9, letterSpacing: 2,
        color: v?.glow, fontWeight: 700,
      }}>{v?.rank}</div>

      {/* portal */}
      <PortalSVG colors={v?.portalColor} size={80} pulse={hovered} />

      {/* label */}
      <div style={{
        fontFamily: "'Orbitron', monospace", fontSize: 13, fontWeight: 700,
        color: v?.glow, letterSpacing: 1,
      }}>{v?.icon} {v?.label}</div>

      {/* stats */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {[
          { label: "HP", val: d?.hp || 0 },
          { label: "EXP", val: `+${d?.exp || 0}` },
          { label: "Stamina", val: d?.stamina || 0 },
        ].map(({ label, val }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: v?.glow, fontWeight: 700 }}>{val}</div>
            <div style={{ fontFamily: "monospace", fontSize: 8, color: T.muted, letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10, color: T.muted, fontFamily: "monospace" }}>{v?.desc}</div>

      {/* ◄ تأثير ظهور نص دخول البوابة الطافي فوق الكرت بشكل رائع ومحمي */}
      {hovered && (
        <div style={{
          position: "absolute",
          bottom: "105%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(10, 10, 12, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          padding: "6px 12px",
          borderRadius: 8,
          fontFamily: "'Orbitron', monospace",
          fontSize: 11,
          fontWeight: 700,
          color: "#fff",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.95)",
          whiteSpace: "nowrap",
          zIndex: 50,
        }}>
        </div>
      )}
    </div>
  );
}

// ─── MONSTER ENCOUNTER MODAL ──────────────────────────────────────────────────
function MonsterModal({ gate, monster, onConfirm, onCancel }) {
  const v = GATE_VISUALS[gate];
  const d = GATE_DIFFICULTY[gate];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(4,0,15,0.85)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.25s ease-out",
    }}>
      <div style={{
        ...glass({ padding: 32 }),
        background: v.gradient,
        border: `1px solid ${v.border}`,
        boxShadow: `0 0 60px ${v.glow}40, 0 20px 60px rgba(0,0,0,0.6)`,
        maxWidth: 380, width: "90%", textAlign: "center", position: "relative",
        animation: "popIn 0.35s cubic-bezier(.34,1.56,.64,1) both",
      }}>
        <HudCorners color={v.border} size={12} />

        {/* portal */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <PortalSVG colors={v.portalColor} size={100} pulse />
        </div>

        {/* gate name */}
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: v.glow, marginBottom: 6 }}>
          {v.icon} {v.label} · {v.rank}
        </div>

        {/* WARNING */}
        <div style={{
          fontFamily: "'Orbitron', monospace", fontSize: 11, color: T.red,
          letterSpacing: 2, marginBottom: 14,
          animation: "pulseOpacity 1.4s ease-in-out infinite",
        }}>⚠ تحذير: مواجهة عدو</div>

        {/* monster name */}
        <div style={{
          fontFamily: "'Orbitron', monospace", fontSize: 22, fontWeight: 900,
          color: v.glow, textShadow: `0 0 20px ${v.glow}80`, marginBottom: 8,
        }}>{monster}</div>

        {/* monster stats */}
        <div style={{
          ...glass({ padding: "12px 16px" }),
          display: "flex", justifyContent: "space-around", marginBottom: 20, marginTop: 8,
        }}>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 14, color: T.red, fontWeight: 700 }}>{d.hp}</div>
            <div style={{ fontFamily: "monospace", fontSize: 8, color: T.muted, letterSpacing: 1 }}>HP</div>
          </div>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 14, color: T.gold, fontWeight: 700 }}>+{d.exp}</div>
            <div style={{ fontFamily: "monospace", fontSize: 8, color: T.muted, letterSpacing: 1 }}>EXP</div>
          </div>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 14, color: v.glow, fontWeight: 700 }}>{d.monsterDmg[0]}~{d.monsterDmg[1]}</div>
            <div style={{ fontFamily: "monospace", fontSize: 8, color: T.muted, letterSpacing: 1 }}>DMG</div>
          </div>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 14, color: T.cyan, fontWeight: 700 }}>-{d.stamina}</div>
            <div style={{ fontFamily: "monospace", fontSize: 8, color: T.muted, letterSpacing: 1 }}>STA</div>
          </div>
        </div>

        {/* buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px", borderRadius: 8,
            border: `1px solid ${T.border}`, background: "transparent",
            color: T.muted, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>تراجع</button>
          <button onClick={onConfirm} style={{
            flex: 2, padding: "10px", borderRadius: 8, border: "none",
            background: `linear-gradient(135deg, ${v.glow}, ${v.portalColor[1]})`,
            color: "#fff", cursor: "pointer", fontWeight: 900, fontSize: 13,
            fontFamily: "'Orbitron', monospace", letterSpacing: 1,
            boxShadow: `0 0 20px ${v.glow}60`,
          }}>⚔ هجوم!</button>
        </div>
      </div>
    </div>
  );
}

// ─── MONSTER SVG ─────────────────────────────────────────────────────────────
function MonsterSVG({ diffKey, hpPct, shaking, dead }) {
  const v = GATE_VISUALS[diffKey] || GATE_VISUALS.NORMAL;
  const rage = hpPct <= 30 && !dead;
  const color = rage ? "#ef4444" : v.glow;

  const SHAPES = {
    NORMAL: { body: "M30 80 Q25 50 40 30 Q50 15 60 30 Q75 50 70 80 Z", eyes: [[38, 40], [58, 40]], eye: 8 },
    ELITE: { body: "M25 85 Q20 55 35 30 Q50 10 65 30 Q80 55 75 85 Z", eyes: [[37, 38], [61, 38]], eye: 9 },
    BOSS: { body: "M20 90 Q15 55 30 28 Q50 5 70 28 Q85 55 80 90 Z", eyes: [[35, 35], [63, 35]], eye: 11 },
    DUNGEON: { body: "M18 95 Q10 58 28 25 Q50 0 72 25 Q90 58 82 95 Z", eyes: [[33, 33], [65, 33]], eye: 13 },
    DESTRUCTION_KING: { body: "M15 98 Q5 60 25 22 Q50,-4 75 22 Q95 60 85 98 Z", eyes: [[30, 30], [68, 30]], eye: 15 },
  };
  const sh = SHAPES[diffKey] || SHAPES.NORMAL;

  return (
    <svg width="100" height="110" viewBox="0 0 100 110" style={{
      overflow: "visible",
      filter: `drop-shadow(0 0 ${rage ? 18 : 10}px ${color}${rage ? "cc" : "80"})`,
      animation: dead ? "fadeOutShrink 0.5s ease-out forwards"
        : shaking ? "giftShake 0.4s ease-in-out"
          : rage ? "float 1.2s ease-in-out infinite"
            : "float 2.8s ease-in-out infinite",
      transition: "filter 0.3s",
    }}>
      <defs>
        <radialGradient id={`mg-${diffKey}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={v.portalColor[1]} stopOpacity="0.9" />
        </radialGradient>
        <filter id="mblur"><feGaussianBlur stdDeviation="2" /></filter>
      </defs>
      {/* glow shadow */}
      <ellipse cx="50" cy="104" rx="28" ry="6" fill={color} opacity="0.3" filter="url(#mblur)"
        style={{ animation: "pulseOpacity 1.8s ease-in-out infinite" }} />
      {/* body */}
      <path d={sh.body} fill={`url(#mg-${diffKey})`} stroke={color} strokeWidth="1.5" opacity="0.95" />
      {/* rage cracks */}
      {rage && <>
        <line x1="35" y1="55" x2="45" y2="70" stroke="#ef4444" strokeWidth="1.5" opacity="0.7" />
        <line x1="55" y1="50" x2="62" y2="68" stroke="#ef4444" strokeWidth="1.5" opacity="0.7" />
      </>}
      {/* eyes */}
      {sh.eyes.map(([ex, ey], i) => (
        <g key={i}>
          <ellipse cx={ex} cy={ey} rx={sh.eye} ry={sh.eye * 0.7} fill="white" opacity="0.95" />
          <ellipse cx={ex} cy={ey} rx={sh.eye * 0.55} ry={sh.eye * 0.55} fill={rage ? "#ef4444" : color}
            style={{ animation: `pulseOpacity ${rage ? "0.6" : "1.6"}s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />
          <ellipse cx={ex - 2} cy={ey - 2} rx={sh.eye * 0.18} ry={sh.eye * 0.18} fill="white" opacity="0.9" />
          {rage && <ellipse cx={ex} cy={ey} rx={sh.eye * 1.3} ry={sh.eye} fill="none"
            stroke="#ef4444" strokeWidth="1" opacity="0.5"
            style={{ animation: "pulse-ring 0.8s ease-in-out infinite" }} />}
        </g>
      ))}
      {/* particles */}
      {[0, 1, 2, 3].map(i => {
        const angle = (i / 4) * Math.PI * 2; const r = 36;
        return <circle key={i}
          cx={50 + r * Math.cos(angle)} cy={55 + r * 0.6 * Math.sin(angle)} r="2.5"
          fill={color} opacity="0.6"
          style={{ animation: `particleFloat ${1.8 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />;
      })}
    </svg>
  );
}

// ─── COMBAT LOG ───────────────────────────────────────────────────────────────
function CombatLog({ entries }) {
  return (
    <div style={{ maxHeight: 100, overflowY: "auto", display: "flex", flexDirection: "column-reverse", gap: 2 }}>
      {entries.slice(-6).reverse().map((e, i) => (
        <div key={i} style={{
          fontFamily: "monospace", fontSize: 10, opacity: 1 - (i * 0.15),
          color: e.type === "crit" ? T.gold : e.type === "dmg" ? T.red : e.type === "hit" ? "#fb7185" : e.type === "skill" ? "#fbbf24" : T.muted,
          display: "flex", gap: 6, alignItems: "center",
        }}>
          <span style={{ color: T.muted, fontSize: 9 }}>{e.time}</span>
          <span>{e.msg}</span>
        </div>
      ))}
    </div>
  );
}


// ─── QTE GRADES ───────────────────────────────────────────────────────────────
const QTE_GRADES = {
  PERFECT: { label: "PERFECT!", color: "#fbbf24", mult: 2.5 },
  GREAT: { label: "GREAT!", color: "#22d3ee", mult: 1.6 },
  GOOD: { label: "GOOD", color: "#10b981", mult: 1.0 },
  MISS: { label: "MISS", color: "#ef4444", mult: 0.0 },
};

// ─── COMBAT CONTROLS (QTE + PARRY) ───────────────────────────────────────────
function CombatControls({ gateColor, portalColors, rage, questId, onAttack }) {
  const SIZE = 110;
  const INNER_R = 14;
  const ZONES = { PERFECT: 12, GREAT: 24, GOOD: 38 };
  const SPEED = rage ? 1100 : 1700;

  const [phase, setPhase] = useState("idle");    // idle | running | result | parry | parried
  const [radius, setRadius] = useState(SIZE / 2);
  const [grade, setGrade] = useState(null);
  const [parryWindow, setParryWindow] = useState(false);
  const [parried, setParried] = useState(false);
  const [dmgFloat, setDmgFloat] = useState(null);

  const rafRef = useRef(null);
  const startRef = useRef(null);
  const doneRef = useRef(false);

  const color = rage ? "#ef4444" : gateColor;

  // ── بدء QTE ──
  const startQTE = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("running");
    setGrade(null);
    doneRef.current = false;
    startRef.current = performance.now();

    const tick = (now) => {
      if (doneRef.current) return;
      const pct = Math.min((now - startRef.current) / SPEED, 1);
      const r = (SIZE / 2 - INNER_R) * (1 - pct) + INNER_R;
      setRadius(r);
      if (pct >= 1) { finish(0); return; }

      // هجوم مضاد عشوائي عند 50-70% من الدائرة
      if (pct > 0.45 && pct < 0.55 && !doneRef.current && Math.random() < 0.004) {
        triggerParry();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [phase]);

  // ── ضغطة المستخدم ──
  const handlePress = () => {
    if (phase === "idle") { startQTE(); return; }
    if (phase === "parry") { doParry(); return; }
    if (phase !== "running") return;
    doneRef.current = false;
    cancelAnimationFrame(rafRef.current);
    const diff = Math.abs(radius - INNER_R);
    const g = diff <= ZONES.PERFECT ? QTE_GRADES.PERFECT
      : diff <= ZONES.GREAT ? QTE_GRADES.GREAT
        : diff <= ZONES.GOOD ? QTE_GRADES.GOOD
          : QTE_GRADES.MISS;
    finish(g.mult, g);
  };

  // ── تنفيذ النتيجة ──
  const finish = (mult, g = QTE_GRADES.MISS) => {
    doneRef.current = true;
    setPhase("result");
    setGrade(g);
    setRadius(SIZE / 2);
    if (mult > 0) {
      onAttack(questId, mult);
      setDmgFloat(g.label);
    }
    setTimeout(() => { setPhase("idle"); setGrade(null); setDmgFloat(null); }, 1000);
  };

  const triggerParry = () => {
    cancelAnimationFrame(rafRef.current);

    doneRef.current = false;

    setPhase("parry");
    setParried(false);

    setTimeout(() => {
      if (phase === "parry" && !doneRef.current) {
        doneRef.current = true;
        setPhase("result");
        setGrade(QTE_GRADES.MISS);
        setDmgFloat("MISS");

        setTimeout(() => {
          setPhase("idle");
          setGrade(null);
          setDmgFloat(null);
        }, 900);
      }
    }, 550);
  };

  const doParry = () => {
    if (phase !== "parry" || doneRef.current) return;
    doneRef.current = true;
    setParried(true);
    setPhase("parried");
    // parry ناجح = هجوم مضاد بدمج ×3
    onAttack(questId, 3.0);
    setDmgFloat("COUNTER!");
    setTimeout(() => { setPhase("idle"); setParried(false); setDmgFloat(null); }, 1100);
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const ringColor = radius !== SIZE / 2
    ? (Math.abs(radius - INNER_R) <= ZONES.PERFECT ? "#fbbf24"
      : Math.abs(radius - INNER_R) <= ZONES.GREAT ? "#22d3ee"
        : Math.abs(radius - INNER_R) <= ZONES.GOOD ? "#10b981"
          : color)
    : color;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 4 }}>

      {/* ── شاشة هجوم مضاد ── */}
      {phase === "parry" && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 30, borderRadius: 14,
          background: "rgba(239,68,68,0.12)",
          border: "2px solid #ef4444",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          animation: "fadeIn 0.1s ease-out",
          pointerEvents: "none",
        }}>
          <div style={{
            fontFamily: "'Orbitron',monospace", fontSize: 18, fontWeight: 900, color: "#ef4444",
            animation: "pulseOpacity 0.3s ease-in-out infinite",
            textShadow: "0 0 20px #ef4444"
          }}>⚠ هجوم مضاد!</div>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#ef4444", marginTop: 4 }}>اضغط للصد!</div>
        </div>
      )}

      {phase === "parried" && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 30, borderRadius: 14,
          background: "rgba(34,211,238,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "fadeIn 0.1s ease-out",
          pointerEvents: "none",
        }}>
          <div style={{
            fontFamily: "'Orbitron',monospace", fontSize: 20, fontWeight: 900,
            color: "#22d3ee", textShadow: "0 0 24px #22d3ee",
            animation: "levelPop 0.4s ease-out"
          }}>⚡ COUNTER!</div>
        </div>
      )}

      {/* ── دائرة QTE ── */}
      <div
        onClick={handlePress}
        style={{ position: "relative", width: SIZE, height: SIZE, cursor: "pointer", userSelect: "none" }}
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ position: "absolute", inset: 0 }}>
          {/* حلقة خارجية ثابتة */}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 3}
            fill="none" stroke={color} strokeWidth="1" strokeDasharray="6 5" opacity="0.25"
            style={{ animation: "auraSpin 7s linear infinite", transformOrigin: `${SIZE / 2}px ${SIZE / 2}px` }} />
          {/* مناطق الدقة */}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={INNER_R + ZONES.GOOD}
            fill="none" stroke="#10b981" strokeWidth="1" opacity="0.18" />
          <circle cx={SIZE / 2} cy={SIZE / 2} r={INNER_R + ZONES.GREAT}
            fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.28" />
          <circle cx={SIZE / 2} cy={SIZE / 2} r={INNER_R + ZONES.PERFECT}
            fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.45" />
          {/* الدائرة المتحركة */}
          {phase === "running" && (
            <circle cx={SIZE / 2} cy={SIZE / 2} r={radius}
              fill="none" stroke={ringColor} strokeWidth="2.5"
              style={{ filter: `drop-shadow(0 0 8px ${ringColor})` }} />
          )}
          {/* مركز */}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={INNER_R}
            fill={grade ? grade.color : phase === "parry" ? "#ef4444" : phase === "parried" ? "#22d3ee" : `${color}40`}
            stroke={grade ? grade.color : color} strokeWidth="2"
            style={{ filter: `drop-shadow(0 0 ${phase === "running" ? "10" : "5"}px ${color})` }} />
          {/* أيقونة المركز */}
          {phase === "idle" && <text x={SIZE / 2} y={SIZE / 2 + 5} textAnchor="middle" fontSize="13" fill={color}>⚔</text>}
          {phase === "parry" && <text x={SIZE / 2} y={SIZE / 2 + 5} textAnchor="middle" fontSize="13" fill="#ef4444">🛡</text>}
          {phase === "parried" && <text x={SIZE / 2} y={SIZE / 2 + 5} textAnchor="middle" fontSize="13" fill="#22d3ee">✦</text>}
        </svg>

        {/* الدرجة تطير فوق */}
        {grade && (
          <div style={{
            position: "absolute", top: -28, left: "50%", transform: "translateX(-50%)",
            fontFamily: "'Orbitron',monospace", fontSize: 15, fontWeight: 900,
            color: grade.color, whiteSpace: "nowrap",
            textShadow: `0 0 14px ${grade.color}`,
            animation: "floatUpFade 0.9s ease-out forwards",
          }}>{grade.label} {grade.mult > 1 ? `×${grade.mult}` : ""}</div>
        )}
        {dmgFloat === "COUNTER!" && (
          <div style={{
            position: "absolute", top: -28, left: "50%", transform: "translateX(-50%)",
            fontFamily: "'Orbitron',monospace", fontSize: 15, fontWeight: 900,
            color: "#22d3ee", whiteSpace: "nowrap",
            textShadow: "0 0 14px #22d3ee",
            animation: "floatUpFade 1s ease-out forwards",
          }}>⚡ COUNTER ×3!</div>
        )}
      </div>

      {/* تعليمات */}
      <div style={{
        fontFamily: "monospace", fontSize: 10, color:
          phase === "parry" ? "#ef4444" : phase === "running" ? "#e9d5ff" : "#6b7280",
        textAlign: "center", minHeight: 14, fontWeight: phase === "parry" ? 900 : 400,
        animation: phase === "parry" ? "pulseOpacity 0.4s ease-in-out infinite" : undefined
      }}>
        {phase === "idle" ? "اضغط الدائرة لتبدأ"
          : phase === "running" ? "⬤ اضغط عند الوصول للمركز!"
            : phase === "parry" ? "🛡 اضغط للصد الآن!"
              : phase === "parried" ? "⚡ صد ناجح!"
                : grade?.label || ""}
      </div>

      {/* مفاتيح الدقة */}
      {phase === "running" && (
        <div style={{ display: "flex", gap: 8, fontFamily: "monospace", fontSize: 8, color: T.muted }}>
          <span style={{ color: "#fbbf24" }}>■ PERFECT ×2.5</span>
          <span style={{ color: "#22d3ee" }}>■ GREAT ×1.6</span>
          <span style={{ color: "#10b981" }}>■ GOOD ×1.0</span>
        </div>
      )}
    </div>
  );
}

// ─── ACTIVE GATE CARD — CINEMATIC COMBAT ─────────────────────────────────────
function ActiveGateCard({ quest, onAttack, onDelete, flash }) {
  const diffKey = quest.difficulty || "NORMAL";
  const v = GATE_VISUALS[diffKey] || GATE_VISUALS.NORMAL;
  const hpPct = Math.max(0, Math.min(100, ((quest.hp ?? 0) / (quest.maxHp ?? 100)) * 100));
  const barColor = hpColor(hpPct);
  const rage = hpPct <= 30 && !quest.completed;
  const showFlash = flash && flash.questId === quest.id;
  const [shaking, setShaking] = useState(false);
  const [log, setLog] = useState([]);
  const [hitFlash, setHitFlash] = useState(false);

  // اهتزاز الوحش عند الضربة
  useState(() => {
    if (showFlash && !flash.blocked) {
      setShaking(true);
      setHitFlash(true);
      const now = new Date();
      const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
      const entry = flash.crit
        ? { type: "crit", msg: `⚡ CRITICAL! ضربت ${flash.dmg} دمج`, time }
        : flash.boosted
          ? { type: "skill", msg: `🌑 مهارة ظل! ${flash.dmg} دمج فائق`, time }
          : { type: "dmg", msg: `⚔ ضربت الوحش بـ ${flash.dmg} دمج`, time };
      setLog(p => [...p, entry]);
      if (flash.dmgTaken > 0) setLog(p => [...p, { type: "hit", msg: `🩸 الوحش ضربك ${flash.dmgTaken} دمج`, time }]);
      setTimeout(() => { setShaking(false); setHitFlash(false); }, 500);
    }
  }, [showFlash, flash?.ts]);

  if (quest.completed) return (
    <div style={{ ...glass({ padding: "16px 20px" }), background: v.gradient, border: `1px solid ${T.green}40`, opacity: 0.6, animation: "fadeUp 0.35s ease-out both" }}>
      <HudCorners color={T.green} size={9} />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <PortalSVG colors={v.portalColor} size={44} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 12, color: T.green, marginBottom: 4 }}>✓ أُنجزت البوابة</div>
          <div style={{ fontSize: 13, color: T.text }}>{quest.title}</div>
        </div>
        <button onClick={() => onDelete(quest.id)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, cursor: "pointer", borderRadius: 6, padding: "4px 10px", fontSize: 11 }}>إزالة</button>
      </div>
    </div>
  );

  return (
    <div style={{
      ...glass({ padding: 0 }),
      background: rage
        ? `linear-gradient(135deg,#2a0000,#0a0000)`
        : v.gradient,
      border: `1px solid ${rage ? "#ef4444" : v.border}80`,
      boxShadow: rage
        ? `0 0 30px #ef444430,0 0 8px #ef444420`
        : `0 0 16px ${v.glow}20`,
      overflow: "hidden", animation: "fadeUp 0.35s ease-out both",
      transition: "all 0.4s ease",
    }}>
      <HudCorners color={rage ? "#ef4444" : v.border} size={9} />

      {/* screen flash on hit */}
      {hitFlash && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.07)", pointerEvents: "none", zIndex: 10, animation: "fadeIn 0.05s ease-out" }} />}

      {/* rage banner */}
      {rage && (
        <div style={{ background: "rgba(239,68,68,0.15)", borderBottom: "1px solid #ef444430", padding: "6px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontFamily: "monospace", color: "#ef4444", fontWeight: 700, letterSpacing: 2, animation: "pulseOpacity 0.8s ease-in-out infinite" }}>
            ⚠ RAGE MODE — الوحش في حالة غضب! الدمج مضاعف
          </span>
        </div>
      )}

      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

          {/* monster visual */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <MonsterSVG diffKey={diffKey} hpPct={hpPct} shaking={shaking} />
            <div style={{ fontFamily: "monospace", fontSize: 8, color: v.glow, letterSpacing: 1, textAlign: "center", maxWidth: 90, lineHeight: 1.4 }}>
              {quest.title}
            </div>
          </div>

          {/* combat info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, fontWeight: 700, color: rage ? "#ef4444" : v.glow }}>
                {v.icon} {v.label}
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: T.gold, fontWeight: 700 }}>+{quest.expReward} EXP</div>
            </div>

            {/* monster HP bar */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: barColor, fontWeight: 700 }}>
                  {rage ? "💀" : "❤️"} HP الوحش
                </span>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: barColor, fontWeight: 700 }}>
                  {quest.hp} / {quest.maxHp}
                </span>
              </div>
              <div style={{ height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", border: `1px solid ${barColor}30` }}>
                <div style={{
                  height: "100%", width: `${hpPct}%`,
                  background: rage
                    ? `linear-gradient(90deg,#7f1d1d,#ef4444)`
                    : `linear-gradient(90deg,${barColor}80,${barColor})`,
                  borderRadius: 99, transition: "width .35s ease, background .3s",
                  boxShadow: `0 0 8px ${barColor}80`,
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)", animation: "shimmerSweep 1.8s ease-in-out infinite" }} />
                </div>
              </div>
              {/* rage threshold indicator */}
              <div style={{ position: "relative", height: 4 }}>
                <div style={{ position: "absolute", left: "30%", top: 0, width: 1, height: 4, background: "#ef444460" }} />
                <div style={{ position: "absolute", left: "30%", top: 2, fontFamily: "monospace", fontSize: 7, color: "#ef444460", transform: "translateX(-50%)" }}>RAGE</div>
              </div>
            </div>

            {/* combat log */}
            <div style={{ ...glass({ padding: "8px 10px" }), marginBottom: 10, minHeight: 52, border: `1px solid ${T.border}` }}>
              {log.length === 0
                ? <div style={{ fontFamily: "monospace", fontSize: 10, color: T.muted, textAlign: "center", padding: "6px 0" }}>سجل القتال فارغ — اضغط هجوم!</div>
                : <CombatLog entries={log} />
              }
            </div>

            {/* QTE + Parry */}
            <CombatControls
              gateColor={v.glow}
              portalColors={v.portalColor}
              rage={rage}
              questId={quest.id}
              onAttack={onAttack}
            />
          </div>

          {/* delete */}
          <button onClick={() => onDelete(quest.id)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.muted, cursor: "pointer", borderRadius: 6, padding: "4px 8px", fontSize: 11, flexShrink: 0, alignSelf: "flex-start" }}>✕</button>
        </div>
      </div>

      {/* flash overlay */}
      {showFlash && !flash.blocked && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          display: "flex", justifyContent: "flex-end", padding: "8px 16px",
          pointerEvents: "none", zIndex: 20,
          animation: "floatUpFade 1.2s ease-out forwards",
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            {flash.crit && <span style={{ fontFamily: "'Orbitron',monospace", color: T.gold, fontWeight: 900, fontSize: 16, textShadow: `0 0 16px ${T.gold}`, animation: "levelPop 0.3s ease-out" }}>⚡ CRITICAL!</span>}
            {flash.boosted && <span style={{ fontFamily: "monospace", color: "#fbbf24", fontWeight: 900, fontSize: 13 }}>🌑 مهارة ظل!</span>}
            <span style={{ fontFamily: "'Orbitron',monospace", color: "#ef4444", fontWeight: 900, fontSize: 18, textShadow: "0 0 12px #ef4444" }}>-{flash.dmg}</span>
            {flash.dmgTaken > 0 && <span style={{ fontFamily: "monospace", color: "#fb7185", fontWeight: 700, fontSize: 12 }}>أنت -{flash.dmgTaken}</span>}
          </div>
        </div>
      )}
      {showFlash && flash.blocked && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 20, animation: "floatUpFade 1s ease-out forwards" }}>
          <span style={{ fontFamily: "monospace", color: T.red, fontWeight: 800, fontSize: 13, background: "rgba(0,0,0,0.7)", padding: "6px 14px", borderRadius: 8 }}>{flash.msg || "محظور!"}</span>
        </div>
      )}
    </div>
  );
}

// ─── GATES PAGE ───────────────────────────────────────────────────────────────
export function GatesPage({ state, onComplete, onDelete, onAdd, onPotion, onRest, combatFlash, onUseSkill }) {
  const [selectedGate, setSelectedGate] = useState(null);
  const [monster, setMonster] = useState(null);
  const activeGates = state.quests.filter((q) => q.type === "GATE");

  const rank = rankFromLevel(state.level);
  const skill = RANK_SKILLS[rank.title];
  const today = todayStr();
  const skillUsedToday = state.skillUsedDate === today;
  const skillReady = !!state.skillActiveAttack;

  const handleSelectGate = (diffKey) => {
    const pool = MONSTERS[diffKey];
    const randomMonster = pool[Math.floor(Math.random() * pool.length)];
    setSelectedGate(diffKey);
    setMonster(randomMonster);
  };

  const handleConfirm = () => {
    onAdd({
      title: monster,
      type: "GATE",
      frequency: "once",
      difficulty: selectedGate,
    });
    setSelectedGate(null);
    setMonster(null);
  };

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80, padding: "80px 24px 40px", maxWidth: 740, margin: "0 auto", animation: "pageInRight 0.4s ease-out both" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: T.purple, marginBottom: 8 }}>◈ GATE SYSTEM</div>
        <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: 24, fontWeight: 700, color: T.text }}>البوابات</h2>
        <div style={{ marginTop: 6, fontFamily: "monospace", fontSize: 11, color: T.muted }}>
          اختر بوابة للدخول — كل بوابة تحتوي وحشاً عشوائياً
        </div>
      </div>

      {/* ── STATUS PANEL ── */}
      <div style={{ ...glass({ padding: "18px 20px" }), marginBottom: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: T.muted, marginBottom: 2 }}>◈ HUNTER STATUS</div>

        {/* HP */}
        {(() => {
          const maxHp = maxPlayerHp(state.stats);
          const hpPct = Math.max(0, Math.min(100, (state.playerHp / maxHp) * 100));
          const hpCol = hpPct > 50 ? "#10b981" : hpPct > 20 ? "#eab308" : "#ef4444";
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: T.muted }}>❤️ HP</span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: hpCol, fontWeight: 700 }}>{state.playerHp} / {maxHp}</span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${hpPct}%`, background: hpCol, borderRadius: 99, transition: "width .3s ease, background .3s ease" }} />
              </div>
            </div>
          );
        })()}

        {/* Stamina */}
        {(() => {
          const maxStamina = state.maxStamina || 700;
          const stPct = Math.max(0, Math.min(100, (state.stamina / maxStamina) * 100));
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: T.muted }}>⚡ STAMINA</span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: T.blue, fontWeight: 700 }}>{state.stamina} / {maxStamina}</span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${stPct}%`, background: T.blue, borderRadius: 99, transition: "width .3s ease" }} />
              </div>
            </div>
          );
        })()}

        {/* Gate Attacks */}
        {(() => {
          const today = todayStr();
          const attacks = state.lastGateAttackDate === today ? (state.gateAttacksToday || 0) : 0;
          const maxAtk = state.maxGateAttacksPerDay ?? 29;
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: T.muted }}>🗡️ هجمات اليوم</span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: attacks >= maxAtk ? T.red : T.purple, fontWeight: 700 }}>
                  {attacks} / {maxAtk} {attacks >= maxAtk ? "— انتهت" : ""}
                </span>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {Array.from({ length: maxAtk }).map((_, i) => (
                  <div key={i} style={{
                    width: 18, height: 18, borderRadius: 4,
                    background: i < attacks ? T.purple : "rgba(139,92,246,0.1)",
                    border: `1px solid ${i < attacks ? T.purple : T.border}`,
                    boxShadow: i < attacks ? `0 0 6px ${T.purple}60` : "none",
                    transition: "all 0.2s",
                  }} />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Potions + Rest */}
        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
          <button onClick={onPotion} disabled={state.potions <= 0} style={{
            flex: 1, padding: "7px 10px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700,
            background: state.potions > 0 ? "rgba(16,185,129,0.12)" : "transparent",
            color: state.potions > 0 ? "#10b981" : T.muted, cursor: state.potions > 0 ? "pointer" : "default",
          }}>🧪 جرعة شفاء (+50) · {state.potions}</button>
          <button onClick={onRest} style={{
            flex: 1, padding: "7px 10px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700,
            background: "rgba(96,165,250,0.12)", color: T.blue, cursor: "pointer",
          }}>😴 راحة (+10 HP)</button>
        </div>
      </div>

      {/* ── مهارة الرانك النشطة ── */}
      {skill && (
        <div style={{
          ...glass({ padding: "16px 18px" }), marginBottom: 24, position: "relative", overflow: "hidden",
          border: `1px solid ${skillReady ? T.gold : rank.color}50`,
        }}>
          <HudCorners color={skillReady ? T.gold : rank.color} size={10} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: rank.color, marginBottom: 4 }}>
                ⚡ مهارة {rank.title}
              </div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 15, fontWeight: 800, color: T.text }}>
                {skill.name}
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: T.muted, marginTop: 3 }}>
                {skillReady ? "✅ مفعّلة — هجومك القادم سيكون موّحشاً" : skill.desc}
              </div>
            </div>
            <button
              onClick={onUseSkill}
              disabled={skillUsedToday}
              style={{
                padding: "10px 18px", borderRadius: 8, fontWeight: 800, fontSize: 12, fontFamily: "'Orbitron', monospace",
                border: `1px solid ${skillUsedToday ? T.border : T.gold}`,
                background: skillUsedToday ? "rgba(255,255,255,0.04)" : skillReady ? "rgba(251,191,36,0.25)" : "rgba(251,191,36,0.12)",
                color: skillUsedToday ? T.muted : T.gold,
                cursor: skillUsedToday ? "default" : "pointer",
                boxShadow: skillUsedToday ? "none" : `0 0 16px ${T.gold}30`,
                whiteSpace: "nowrap",
              }}
            >
              {skillUsedToday ? "✓ استُخدمت اليوم" : skillReady ? "⚡ جاهزة!" : "تفعيل المهارة"}
            </button>
          </div>
        </div>
      )}

      {/* Gate selector grid */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: T.muted, marginBottom: 14 }}>— اختر بوابة —</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
          {Object.keys(GATE_VISUALS).map((key) => (
            <GateCard key={key} diffKey={key} onSelect={handleSelectGate} />
          ))}
        </div>
      </div>

      {/* Active gates */}
      {activeGates.length > 0 && (
        <>
          <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: T.muted, marginBottom: 14 }}>— بواباتك النشطة —</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeGates.map((q) => (
              <ActiveGateCard key={q.id} quest={q} onAttack={onComplete} onDelete={onDelete} flash={combatFlash} />
            ))}
          </div>
        </>
      )}

      {activeGates.length === 0 && (
        <div style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: 24, fontFamily: "monospace" }}>
          لا توجد بوابات نشطة — اختر بوابة أعلى للبدء
        </div>
      )}

      {/* Monster modal */}
      {selectedGate && monster && (
        <MonsterModal
          gate={selectedGate}
          monster={monster}
          onConfirm={handleConfirm}
          onCancel={() => { setSelectedGate(null); setMonster(null); }}
        />
      )}
    </div>
  );
}
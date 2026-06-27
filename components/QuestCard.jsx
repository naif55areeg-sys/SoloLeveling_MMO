import { useState } from "react";
import { T, glass } from "../constants/tokens";
import { GATE_DIFFICULTY } from "../constants/gameData";
import { hpColor } from "../constants/gameLogic";
import { HudCorners } from "./UI";

// ─── QUEST CARD ───────────────────────────────────────────────────────────────
export function QuestCard({ quest, onComplete, onDelete, flash }) {
  const gateInfo = quest.type === "GATE" ? (GATE_DIFFICULTY[quest.difficulty] || GATE_DIFFICULTY.NORMAL) : null;
  const typeColor = quest.type === "GATE" ? gateInfo.color : quest.type === "WEEKLY" ? T.blue : T.cyan;
  const hpPct = quest.type === "GATE" ? Math.max(0, Math.min(100, ((quest.hp ?? 0) / (quest.maxHp ?? 100)) * 100)) : 0;
  const barColor = hpColor(hpPct);
  const showFlash = flash && flash.questId === quest.id;

  // 👑 تفعيل الهالات الفخمة الجديدة على حسب صعوبة البوابة تلقائياً
  let auraClass = "";
  if (quest.type === "GATE" && !quest.completed) {
    if (quest.difficulty === "BOSS" || quest.difficulty === "DUNGEON") {
      auraClass = "aura-absolute"; // هالة حمراء تدميرية للبوابات الكبيرة
    } else if (quest.difficulty === "ELITE") {
      auraClass = "aura-monarch";  // هالة ذهبية ملكية بوابات النخبة
    }
  }

  return (
    <div
      className={auraClass} // ⚡ تم دمج كلاس الهالة الذكي هنا
      style={{
        ...glass({ padding: "16px 18px" }),
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: quest.completed ? 0.55 : 1,
        animation: "fadeUp 0.35s ease-out both",
        transition: "all 0.3s ease"
      }}
    >
      <HudCorners size={9} color={typeColor} />

      {showFlash && (
        <div style={{ position: "absolute", top: -8, right: 16, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, animation: "floatUpFade 1.2s ease-out forwards", pointerEvents: "none", zIndex: 5 }}>
          {flash.blocked ? (
            <span style={{ color: T.red, fontWeight: 800, fontSize: 12 }}>بحاجة للراحة!</span>
          ) : (
            <>
              {flash.crit && <span style={{ color: T.gold, fontWeight: 900, fontSize: 13, textShadow: `0 0 8px ${T.gold}` }}>CRITICAL!</span>}
              <span style={{ color: T.red, fontWeight: 800, fontSize: 13 }}>-{flash.dmg} HP</span>
              {flash.dmgTaken > 0 && <span style={{ color: "#fb7185", fontWeight: 700, fontSize: 11 }}>أنت: -{flash.dmgTaken}</span>}
            </>
          )}
        </div>
      )}

      <button
        onClick={() => !quest.completed && onComplete(quest.id)}
        disabled={quest.completed}
        style={{
          width: 26, height: 26, borderRadius: 6, flexShrink: 0,
          cursor: quest.completed ? "default" : "pointer",
          border: `2px solid ${quest.completed ? T.green : typeColor}`,
          background: quest.completed ? T.green : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#04000f", fontSize: 14, fontWeight: 900, position: "relative", transition: "transform 0.15s",
          zIndex: 6 // لضمان ظهور الزر فوق لير الهالة
        }}
      >
        {quest.completed ? "✓" : ""}
        {quest.completed && (
          <span style={{ position: "absolute", inset: 0, borderRadius: 6, border: `2px solid ${T.green}`, animation: "burstRing 0.6s ease-out forwards", pointerEvents: "none" }} />
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0, zIndex: 2 }}>
        <div style={{ fontFamily: "'Rajdhani', monospace", fontSize: 10, fontWeight: 700, letterSpacing: 2, color: typeColor, marginBottom: 2 }}>
          {quest.type}{gateInfo ? ` · ${gateInfo.label}` : ""}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, textDecoration: quest.completed ? "line-through" : "none" }}>
          {quest.title}
        </div>
        {quest.type === "GATE" && (
          <>
            <div style={{ marginTop: 8, fontSize: 11, color: barColor, fontWeight: 700 }}>HP: {quest.hp}/{quest.maxHp}</div>
            <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden", marginTop: 4 }}>
              <div style={{ width: `${hpPct}%`, height: "100%", background: barColor, transition: "width .25s ease, background .25s ease" }} />
            </div>
          </>
        )}
      </div>

      <div style={{ fontFamily: "monospace", fontSize: 12, color: T.gold, fontWeight: 700, whiteSpace: "nowrap", zIndex: 2 }}>
        +{quest.expReward} EXP
      </div>

      <button onClick={() => onDelete(quest.id)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 14, padding: 4, zIndex: 6 }} title="حذف">
        ✕
      </button>
    </div>
  );
}

// ─── PLAYER HP BAR ────────────────────────────────────────────────────────────
export function PlayerHpBar({ state, onPotion, onRest }) {
  const max = 250 + (state.stats?.VIT || 10) * 5;
  const pct = Math.max(0, Math.min(100, (state.playerHp / max) * 100));
  const color = hpColor(pct);
  return (
    <div style={{ ...glass({ padding: "16px 18px" }), marginBottom: 16, position: "relative" }}>
      <HudCorners size={9} color={color} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontFamily: "'Rajdhani', monospace", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: T.text }}>HUNTER HP</span>
        <span style={{ fontFamily: "monospace", fontSize: 12, color, fontWeight: 700 }}>{state.playerHp} / {max}</span>
      </div>
      <div style={{ height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, transition: "width .3s ease, background .3s ease" }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={onPotion} disabled={state.potions <= 0} style={{
          flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700,
          background: state.potions > 0 ? "rgba(16,185,129,0.12)" : "transparent",
          color: state.potions > 0 ? T.green : T.muted, cursor: state.potions > 0 ? "pointer" : "default",
        }}>🧪 جرعة شفاء (+50) · {state.potions}</button>
        <button onClick={onRest} style={{
          flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700,
          background: "rgba(96,165,250,0.12)", color: T.blue, cursor: "pointer",
        }}>😴 راحة (+15)</button>
      </div>
    </div>
  );
}

// ─── ADD QUEST FORM ───────────────────────────────────────────────────────────
export function AddQuestForm({ defaultType, onAdd }) {
  const [title, setTitle] = useState("");
  const [exp, setExp] = useState(15);
  const [freq, setFreq] = useState(defaultType === "GATE" ? "once" : "daily");
  const [difficulty, setDifficulty] = useState("NORMAL");

  const submit = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      expReward: Number(exp) || 10,
      frequency: freq,
      type: freq === "daily" ? "DAILY" : freq === "weekly" ? "WEEKLY" : "GATE",
      difficulty: defaultType === "GATE" ? difficulty : undefined,
    });
    setTitle(""); setExp(15);
  };

  const inputStyle = { background: "rgba(139,92,246,0.06)", border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", color: T.text, fontSize: 13 };

  return (
    <div style={{ ...glass({ padding: "14px 16px" }), display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <input
        value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="اسم المهمة الجديدة..." onKeyDown={(e) => e.key === "Enter" && submit()}
        style={{ flex: "1 1 200px", ...inputStyle }}
      />
      {defaultType !== "GATE" ? (
        <>
          <input type="number" value={exp} onChange={(e) => setExp(e.target.value)} style={{ width: 70, ...inputStyle }} />
          <select value={freq} onChange={(e) => setFreq(e.target.value)} style={inputStyle}>
            <option value="daily">يومي</option>
            <option value="weekly">أسبوعي</option>
          </select>
        </>
      ) : (
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={inputStyle}>
          <option value="NORMAL">Normal</option>
          <option value="ELITE">Elite</option>
          <option value="BOSS">Boss</option>
          <option value="DUNGEON">Dungeon</option>
        </select>
      )}
      <button onClick={submit} style={{
        padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer",
        background: `linear-gradient(135deg, ${T.glow}, ${T.glowBlue})`,
        color: "#fff", fontWeight: 700, fontSize: 12, letterSpacing: 1,
      }}>+ إضافة</button>
    </div>
  );
}
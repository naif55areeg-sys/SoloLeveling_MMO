import { useState } from "react";
import { T, glass } from "../constants/tokens";
import { HudCorners, ExpBar } from "../components/UI";
import { ShadowSoldierIcon } from "../components/ShadowIcons";
import { SHADOW_EXTRACT, SHADOW_TIER_COLOR, SHADOW_MAX_DEPLOYED, shadowStatsBuff, shadowExpToNext } from "../constants/gameData";

// ─── SHADOW CARD (نفس فكرة بطاقة اللوت — تميل مع الماوس وتعطي إحساس 3D) ───────
function ShadowCard({ soldier, idx, deployed, canDeploy, onToggleDeploy }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const color = SHADOW_TIER_COLOR[soldier.tier] || T.purple;
  const cfg = SHADOW_EXTRACT[soldier.tier] || {};
  const buff = shadowStatsBuff(soldier);
  const expToNext = shadowExpToNext(soldier.level);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTilt({ x: ((e.clientY - rect.top) / rect.height - 0.5) * -14, y: ((e.clientX - rect.left) / rect.width - 0.5) * 14 });
  };
  const onLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <div
      onMouseMove={onMove} onMouseLeave={onLeave}
      style={{
        ...glass({ padding: "20px 14px 14px" }), position: "relative",
        animation: `fadeUp 0.35s ease-out ${idx * 0.04}s both`,
        transformStyle: "preserve-3d", perspective: 600,
        transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.25s cubic-bezier(.22,1,.36,1), box-shadow 0.25s",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        border: deployed ? `1px solid ${color}` : `1px solid ${color}25`,
        boxShadow: deployed ? `0 0 0 1px ${color}80, 0 10px 30px rgba(0,0,0,.35)` : `0 0 14px ${color}10`,
      }}
    >
      <HudCorners size={9} color={color} />
      {deployed && (
        <div style={{ position: "absolute", inset: -1, borderRadius: 14, opacity: 0.14, pointerEvents: "none", background: `conic-gradient(from 0deg, ${color}, transparent, ${color})`, animation: "auraSpin 9s linear infinite" }} />
      )}

      <div style={{ position: "absolute", top: 8, right: 8, fontFamily: "monospace", fontSize: 9, color: T.muted, background: "rgba(0,0,0,0.4)", borderRadius: 6, padding: "2px 7px" }}>
        {cfg.label || soldier.tier}
      </div>

      <div style={{ position: "relative", width: 60, height: 60, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
        {deployed && <div style={{ position: "absolute", inset: -6, borderRadius: "50%", border: `2px solid ${color}`, boxShadow: `0 0 14px ${color}80`, animation: "pulse-ring 2s ease-in-out infinite" }} />}
        <div style={{ position: "absolute", bottom: -2, width: 42, height: 9, borderRadius: "50%", background: color, opacity: 0.35, filter: "blur(6px)" }} />
        <div style={{ animation: "itemFloat 3.6s ease-in-out infinite" }}>
          <ShadowSoldierIcon tier={soldier.tier} uid={soldier.id} size={52} />
        </div>
      </div>

      <span style={{ fontFamily: "'Orbitron',monospace", fontWeight: 900, fontSize: 13, color, textShadow: `0 0 10px ${color}80` }}>
        LV.{soldier.level}
      </span>

      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, textAlign: "center" }}>{soldier.name}</div>

      <div style={{ width: "100%", marginTop: 2 }}>
        <ExpBar exp={soldier.exp} expToNext={expToNext} color={color} height={6} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontFamily: "monospace", fontSize: 8, color: T.muted }}>{soldier.exp}/{expToNext} XP</span>
          <span style={{ fontFamily: "monospace", fontSize: 8, color: T.muted }}>استُخدم {soldier.uses || 0}×</span>
        </div>
      </div>

      <div style={{ fontFamily: "monospace", fontSize: 9.5, color, textAlign: "center", marginTop: 2 }}>
        +{buff.STR} لكل إحصائية (STR/AGI/VIT/INT/SENSE)
      </div>

      <button
        onClick={() => onToggleDeploy(soldier.id)}
        disabled={!deployed && !canDeploy}
        style={{
          width: "100%", marginTop: 4, padding: "6px 4px", borderRadius: 6,
          border: `1px solid ${deployed ? T.gold : !canDeploy ? T.border : color}`,
          background: deployed ? "rgba(251,191,36,0.15)" : !canDeploy ? "rgba(255,255,255,0.03)" : `${color}1a`,
          color: deployed ? T.gold : !canDeploy ? T.muted : color,
          fontSize: 10.5, fontWeight: 700, cursor: (deployed || canDeploy) ? "pointer" : "default",
        }}
      >
        {deployed ? "✓ منشور — اسحبه" : !canDeploy ? "الخانات ممتلئة" : "نشر بالمعركة"}
      </button>
    </div>
  );
}

// ─── DEPLOY SLOTS (مثل EquipSlots بصفحة المخزون) ─────────────────────────────
function DeploySlots({ state, onToggleDeploy }) {
  const soldiers = state.shadowSoldiers || [];
  const deployed = state.equippedShadows || [];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: 8, marginBottom: 20 }}>
      {Array.from({ length: SHADOW_MAX_DEPLOYED }).map((_, i) => {
        const id = deployed[i];
        const soldier = id ? soldiers.find((s) => s.id === id) : null;
        const color = soldier ? (SHADOW_TIER_COLOR[soldier.tier] || T.purple) : T.muted;
        return (
          <div key={i} style={{ ...glass({ padding: "10px 10px" }), textAlign: "center", position: "relative", border: soldier ? `1px solid ${color}40` : `1px solid ${T.border}`, boxShadow: soldier ? `0 0 12px ${color}20` : "none" }}>
            <HudCorners size={7} color={color} />
            <div style={{ fontFamily: "monospace", fontSize: 9, color: T.muted, letterSpacing: 1, marginBottom: 6 }}>خانة نشر {i + 1}</div>
            {soldier ? (
              <>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                  <ShadowSoldierIcon tier={soldier.tier} uid={`slot-${i}`} size={32} />
                </div>
                <div style={{ fontSize: 10.5, color: T.text, fontWeight: 600, marginBottom: 2 }}>{soldier.name}</div>
                <button onClick={() => onToggleDeploy(soldier.id)} style={{ fontSize: 9, color: T.red, background: "none", border: "none", cursor: "pointer", fontFamily: "monospace" }}>✕ إلغاء</button>
              </>
            ) : (
              <div style={{ fontSize: 11, color: T.muted, padding: "12px 0", opacity: 0.5 }}>— فاضية —</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── SHADOW ARMY PAGE ─────────────────────────────────────────────────────────
export function ShadowArmyPage({ state, onToggleDeploy }) {
  const soldiers = state.shadowSoldiers || [];
  const deployed = state.equippedShadows || [];
  const canDeploy = deployed.length < SHADOW_MAX_DEPLOYED;
  const sorted = soldiers.slice().sort((a, b) => b.level - a.level);

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80, padding: "80px 24px 100px", maxWidth: 760, margin: "0 auto", animation: "pageInRight 0.4s ease-out both" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: T.purple, marginBottom: 8 }}>◈ SHADOW ARMY</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: 24, fontWeight: 700, color: T.text }}>جنود الظل</h2>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: T.muted }}>{soldiers.length} جندي · {deployed.length}/{SHADOW_MAX_DEPLOYED} منشور</span>
        </div>
        <div style={{ marginTop: 6, fontFamily: "monospace", fontSize: 11, color: T.muted }}>
          فرصة استخراج جندي ظل تظهر عند هزيمة بوسات BOSS / DUNGEON / DESTRUCTION KING — وكل جندي منشور يقوى كل ما خضت معارك
        </div>
      </div>

      <DeploySlots state={state} onToggleDeploy={onToggleDeploy} />

      {sorted.length === 0 ? (
        <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: 40 }}>
          لسا ما عندك جنود ظل — اهزم بوسات قوية بالبوابات وحاول تستخرجهم!
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: 12 }}>
          {sorted.map((s, i) => (
            <ShadowCard
              key={s.id}
              soldier={s}
              idx={i}
              deployed={deployed.includes(s.id)}
              canDeploy={canDeploy}
              onToggleDeploy={onToggleDeploy}
            />
          ))}
        </div>
      )}
    </div>
  );
}

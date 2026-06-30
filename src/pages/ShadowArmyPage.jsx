import { useState } from "react";
import { T, glass } from "../constants/tokens";
import { HudCorners, ExpBar } from "../components/UI";
import { ShadowSoldierIcon } from "../components/ShadowIcons";
import { SHADOW_EXTRACT, SHADOW_TIER_COLOR, SHADOW_MAX_DEPLOYED, SHADOW_MAX_LEVEL, SHADOW_SPECIAL_NAMES, SHADOW_SPECIAL_MAX_LEVEL, shadowStatsBuff, shadowExpToNext } from "../constants/gameData";

// ─── per-soldier style override ───────────────────────────────────────────────
function soldierStyle(name) {
  if (!name) return null;
  if (name.includes("بيليون")) return { color: "#ff003c", label: "أسطوري·SSS", rank: "SSS" };
  if (name.includes("إيغريس")) return { color: T.gold,    label: "نادر·S",     rank: "S"   };
  if (name.includes("بيرو"))   return { color: T.gold,    label: "نادر·S",     rank: "S"   };
  return null;
}

// ─── SHADOW CARD (نفس فكرة بطاقة اللوت — تميل مع الماوس وتعطي إحساس 3D) ───────
function ShadowCard({ soldier, idx, deployed, canDeploy, onToggleDeploy, onCrystallize, crystals }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const override = soldierStyle(soldier.name || "");
  const color = override ? override.color : (SHADOW_TIER_COLOR[soldier.tier] || T.purple);
  const cfg = SHADOW_EXTRACT[soldier.tier] || {};
  const cardLabel = override ? override.label : (cfg.label || soldier.tier);
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

      <div style={{ position: "absolute", top: 8, right: 8, fontFamily: "monospace", fontSize: 9, color: override ? override.color : T.muted, background: "rgba(0,0,0,0.4)", borderRadius: 6, padding: "2px 7px", border: override ? `1px solid ${override.color}40` : "none", textShadow: override ? `0 0 8px ${override.color}80` : "none" }}>
        {cardLabel}
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

      <div style={{ fontFamily: "monospace", fontSize: 9, color: T.muted, textAlign: "center", marginTop: 2 }}>
        {Object.entries(buff).filter(([, v]) => v > 0).map(([k, v]) => `+${v} ${k}`).join(" · ")}
      </div>
      {/* مؤشر الحد الأقصى للمستوى + زر التطوير */}
      {(() => {
        const isSpecialCheck = SHADOW_SPECIAL_NAMES.includes(soldier.name || "") || !!override;
        const maxLv = isSpecialCheck && soldier.crystallized ? SHADOW_SPECIAL_MAX_LEVEL : SHADOW_MAX_LEVEL;
        const hasCrystal = (crystals || 0) > 0;
        if (soldier.level >= maxLv && isSpecialCheck && !soldier.crystallized) return (
          <button
            onClick={() => hasCrystal && onCrystallize && onCrystallize(soldier.id)}
            style={{
              width: "100%", marginTop: 4, padding: "7px 4px", borderRadius: 6,
              border: hasCrystal ? "1px solid rgba(251,191,36,0.7)" : "1px solid rgba(251,191,36,0.25)",
              background: hasCrystal
                ? "linear-gradient(135deg,rgba(251,191,36,0.18),rgba(180,130,0,0.22))"
                : "rgba(255,255,255,0.04)",
              color: hasCrystal ? "#fbbf24" : "#6b7280",
              fontSize: 10.5, fontWeight: 900,
              cursor: hasCrystal ? "pointer" : "default",
              fontFamily: "'Orbitron',monospace", letterSpacing: 1,
              boxShadow: hasCrystal ? "0 0 14px rgba(251,191,36,0.35)" : "none",
              animation: hasCrystal ? "pulseOpacity 2s ease-in-out infinite" : "none",
            }}
          >
            {hasCrystal ? "🔮 تطوير — كرستال التطوير" : "💎 تحتاج كرستال التطوير"}
          </button>
        );
        if (soldier.level >= maxLv && soldier.crystallized) return (
          <div style={{ fontFamily: "monospace", fontSize: 8, color: "#ef4444", textAlign: "center", marginTop: 2 }}>
            ★ MAX LEVEL
          </div>
        );
        // مبلور وبين LV.11–19 — يظهر مؤشر التقدم نحو LV.20
        if (soldier.crystallized && soldier.level < SHADOW_SPECIAL_MAX_LEVEL) return (
          <div style={{ fontFamily: "monospace", fontSize: 8, color: "#60a5fa", textAlign: "center", marginTop: 2, letterSpacing: 1 }}>
            💎 مبلور · يصل حتى LV.{SHADOW_SPECIAL_MAX_LEVEL}
          </div>
        );
        return null;
      })()}

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
        const _ov = soldier ? soldierStyle(soldier.name || "") : null;
        const color = soldier
          ? (_ov ? _ov.color : (SHADOW_TIER_COLOR[soldier.tier] || T.purple))
          : T.muted;
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
export function ShadowArmyPage({ state, onToggleDeploy, onCrystallize }) {
  const soldiers = state.shadowSoldiers || [];
  const deployed = state.equippedShadows || [];
  const canDeploy = deployed.length < SHADOW_MAX_DEPLOYED;
  const sorted = soldiers.slice().sort((a, b) => b.level - a.level);
  const crystals = state.crystals || 0;

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80, padding: "80px 24px 100px", maxWidth: 760, margin: "0 auto", animation: "pageInRight 0.4s ease-out both" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: T.purple, marginBottom: 8 }}>◈ SHADOW ARMY</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 6 }}>
          <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: 24, fontWeight: 700, color: T.text }}>جنود الظل</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {crystals > 0 && (
              <span style={{ fontFamily: "monospace", fontSize: 11, color: T.gold, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.35)", borderRadius: 8, padding: "4px 10px", fontWeight: 700 }}>
                💎 ×{crystals} كرستال
              </span>
            )}
            <span style={{ fontFamily: "monospace", fontSize: 11, color: T.muted }}>{soldiers.length} جندي · {deployed.length}/{SHADOW_MAX_DEPLOYED} منشور</span>
          </div>
        </div>
        <div style={{ marginTop: 6, fontFamily: "monospace", fontSize: 11, color: T.muted }}>
          فرصة استخراج جندي ظل تظهر عند هزيمة بوابات S_RANK و RED_GATE — وكل جندي منشور يقوى كل ما خضت معارك
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
              onCrystallize={onCrystallize}
              crystals={crystals}
            />
          ))}
        </div>
      )}
    </div>
  );
}

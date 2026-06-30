import { useState, useEffect } from "react";
import { T, glass } from "../constants/tokens";
import {
  STAT_KEYS, RANK_TIERS, TIERS, TIER_COLOR, TIER_TOP, rankFromLevel,
  SLOT_STAT, SLOT_LABEL, SLOT_ORDER, itemShapeType, UPGRADE_MAX_LEVEL, upgradeCost,
  ACHIEVEMENTS, ACHIEVEMENT_TIERS,
} from "../constants/gameData";
import { HudCorners, RankBadge, ExpBar } from "../components/UI";
import { ItemIcon } from "../components/LootIcons";
import { maxPlayerHp, effectiveStats, getEquipmentBonuses, getShadowSoldierBonuses, itemBonusValue, todayStr, getAchievementProgress } from "../constants/gameLogic";

const STAT_COLORS = { STR: "#ef4444", AGI: "#22d3ee", VIT: "#10b981", INT: "#a855f7", SENSE: "#fbbf24" };

// ─── STATUS BAR ───────────────────────────────────────────────────────────────
export function StatusBar({ state }) {
  const maxHp = maxPlayerHp(effectiveStats(state));
  const hpPct = Math.max(0, Math.min(100, (state.playerHp / maxHp) * 100));
  const maxStamina = state.maxStamina || 700;
  const stPct = Math.max(0, Math.min(100, (state.stamina / maxStamina) * 100));
  const hpCol = hpPct > 50 ? "#10b981" : hpPct > 20 ? "#eab308" : "#ef4444";
  const today = todayStr();
  const attacks = state.lastGateAttackDate === today ? (state.gateAttacksToday || 0) : 0;
  const maxAtk = state.maxGateAttacksPerDay ?? 10;

  return (
    <div style={{ ...glass({ padding: "14px 18px" }), marginBottom: 16, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
      {[
        { label: "HP", val: state.playerHp, max: maxHp, pct: hpPct, color: hpCol, icon: "❤️" },
        { label: "STAMINA", val: state.stamina, max: maxStamina, pct: stPct, color: T.blue, icon: "⚡" },
      ].map(({ label, val, max, pct, color, icon }) => (
        <div key={label} style={{ flex: "1 1 160px", minWidth: 140 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, color: T.muted }}>{icon} {label}</span>
            <span style={{ fontFamily: "monospace", fontSize: 11, color, fontWeight: 700 }}>{val} / {max}</span>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width .3s ease, background .3s ease", boxShadow: `0 0 6px ${color}80` }} />
          </div>
        </div>
      ))}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, paddingLeft: 12, borderLeft: `1px solid ${T.border}` }}>
        <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, color: T.muted }}>🗡️ هجمات البوابة</span>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 200 }}>
          {Array.from({ length: maxAtk }).map((_, i) => (
            <div key={i} style={{ width: 16, height: 16, borderRadius: 3, background: i < attacks ? T.purple : "rgba(139,92,246,0.1)", border: `1px solid ${i < attacks ? T.purple : T.border}`, boxShadow: i < attacks ? `0 0 6px ${T.purple}60` : "none", transition: "all 0.2s" }} />
          ))}
        </div>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: attacks >= maxAtk ? T.red : T.muted }}>
          {attacks}/{maxAtk}{attacks >= maxAtk ? " — انتهت" : ""}
        </span>
      </div>
    </div>
  );
}

// ─── STATS PAGE ───────────────────────────────────────────────────────────────
export function StatsPage({ state, onAllocate }) {
  const bonuses = getEquipmentBonuses(state);
  const shadowBonuses = getShadowSoldierBonuses(state);
  const [animVals, setAnimVals] = useState({});

  useEffect(() => {
    const vals = {};
    STAT_KEYS.forEach((k, i) => {
      setTimeout(() => {
        let cur = 0;
        const target = state.stats[k];
        const iv = setInterval(() => {
          cur = Math.min(cur + Math.ceil(target / 25), target);
          setAnimVals((prev) => ({ ...prev, [k]: cur }));
          if (cur >= target) clearInterval(iv);
        }, 20);
      }, i * 100);
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80, padding: "80px 24px 40px", maxWidth: 600, margin: "0 auto", animation: "pageInRight 0.4s ease-out both" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: T.purple, marginBottom: 8 }}>◈ HUNTER STATS</div>
        <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: 24, fontWeight: 700, color: T.text }}>الإحصائيات</h2>
        {state.statPoints > 0 && (
          <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(251,191,36,0.1)", border: `1px solid ${T.gold}40`, borderRadius: 8, padding: "6px 14px", animation: "pulseOpacity 1.6s infinite" }}>
            <span style={{ color: T.gold, fontSize: 16 }}>✦</span>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: T.gold, fontWeight: 700 }}>{state.statPoints} نقطة متاحة</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {STAT_KEYS.map((k, i) => {
          const base = state.stats[k];
          const bonus = bonuses[k] || 0;
          const color = STAT_COLORS[k] || T.purple;
          const dispVal = animVals[k] ?? 0;
          const barPct = Math.min(100, (base / 200) * 100);

          return (
            <div key={k} style={{ ...glass({ padding: "16px 20px" }), display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "hidden", animation: `fadeUp 0.4s ease-out ${i * 60}ms both`, border: `1px solid ${color}20` }}>
              {/* background fill */}
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${barPct}%`, background: `${color}08`, transition: "width 1s ease", pointerEvents: "none" }} />

              <div style={{ width: 72, fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 700, color, textShadow: `0 0 10px ${color}60`, position: "relative" }}>{k}</div>

              <div style={{ flex: 1, position: "relative" }}>
                <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${barPct}%`, background: `linear-gradient(90deg, ${color}80, ${color})`, borderRadius: 99, transition: "width 1s ease", boxShadow: `0 0 8px ${color}60` }} />
                </div>
              </div>

              <div style={{ width: 64, textAlign: "center", fontFamily: "'Orbitron',monospace", fontSize: 18, fontWeight: 900, color, position: "relative" }}>
                {dispVal}{bonus > 0 && <span style={{ color: T.gold, fontSize: 11, fontWeight: 700 }}> +{bonus}</span>}{(shadowBonuses[k] || 0) > 0 && <span style={{ color: "#a855f7", fontSize: 11, fontWeight: 700 }}> +{shadowBonuses[k]}</span>}
              </div>

              <button onClick={() => onAllocate(k)} disabled={state.statPoints <= 0} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${state.statPoints > 0 ? color : T.border}`, background: state.statPoints > 0 ? `${color}20` : "transparent", color: state.statPoints > 0 ? color : T.muted, cursor: state.statPoints > 0 ? "pointer" : "default", fontWeight: 900, fontSize: 16, transition: "all 0.2s", position: "relative" }}>
                +
                {state.statPoints > 0 && <div style={{ position: "absolute", inset: 0, borderRadius: 8, border: `1px solid ${color}`, animation: "pulse-ring 2s ease-in-out infinite" }} />}
              </button>
            </div>
          );
        })}
      </div>

      {(Object.values(bonuses).some((v) => v > 0) || Object.values(shadowBonuses).some((v) => v > 0)) && (
        <div style={{ marginTop: 16, fontFamily: "monospace", fontSize: 11, color: T.muted, textAlign: "center", display: "flex", flexDirection: "column", gap: 4 }}>
          {Object.values(bonuses).some((v) => v > 0) && <span><span style={{ color: T.gold }}>+الصفراء</span> بونص من العناصر المجهّزة 🎽</span>}
          {Object.values(shadowBonuses).some((v) => v > 0) && <span><span style={{ color: "#a855f7" }}>+البنفسجية</span> بونص من جنود الظل المنشورين 👤</span>}
        </div>
      )}
    </div>
  );
}

// ─── RANK PAGE ────────────────────────────────────────────────────────────────
export function RankPage({ state }) {
  const rank = rankFromLevel(state.level);

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80, padding: "80px 24px 40px", maxWidth: 600, margin: "0 auto", animation: "pageInRight 0.4s ease-out both" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: T.purple, marginBottom: 8 }}>◈ HUNTER RANK</div>
        <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: 24, fontWeight: 700, color: T.text }}>التصنيف</h2>
      </div>

      {/* current rank card */}
      <div style={{ ...glass({ padding: 36 }), textAlign: "center", marginBottom: 24, position: "relative", overflow: "hidden", border: `1px solid ${rank.color}50`, boxShadow: `0 0 40px ${rank.color}20, 0 10px 30px rgba(0,0,0,0.4)` }}>
        <HudCorners color={rank.color} size={14} />
        {rank.top && (
          <>
            <div style={{ position: "absolute", inset: -60, opacity: 0.12, pointerEvents: "none", background: `conic-gradient(from 0deg, ${rank.color}, transparent, ${rank.color})`, animation: "auraSpin 8s linear infinite" }} />
            {/* floating particles */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ position: "absolute", left: `${15 + i * 10}%`, bottom: `${10 + (i % 3) * 20}%`, width: 4, height: 4, borderRadius: "50%", background: rank.color, opacity: 0.6, boxShadow: `0 0 8px ${rank.color}`, animation: `particleFloat ${2 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
            ))}
          </>
        )}
        <div style={{ position: "relative", marginBottom: 12 }}><RankBadge rank={rank} size={40} /></div>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: T.muted, position: "relative" }}>المستوى الحالي: <span style={{ color: rank.color, fontWeight: 700 }}>{state.level}</span></div>
      </div>

      {/* rank list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {RANK_TIERS.slice().reverse().map((r, i) => {
          const isCurrent = rank.title === r.title;
          const isUnlocked = state.level >= r.min;
          return (
            <div key={r.title} style={{ ...glass({ padding: "12px 16px" }), display: "flex", justifyContent: "space-between", alignItems: "center", opacity: isUnlocked ? 1 : 0.35, border: isCurrent ? `1px solid ${r.color}` : `1px solid ${T.border}`, boxShadow: isCurrent ? `0 0 20px ${r.color}30` : "none", animation: `fadeUp 0.3s ease-out ${i * 30}ms both`, transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {isCurrent && <div style={{ width: 6, height: 6, borderRadius: "50%", background: r.color, boxShadow: `0 0 8px ${r.color}`, animation: "pulseOpacity 1.5s infinite" }} />}
                <RankBadge rank={r} size={13} />
              </div>
              <div style={{ display: "flex", align: "center", gap: 10 }}>
                {isUnlocked && <span style={{ fontFamily: "monospace", fontSize: 9, color: T.green }}>✓ مفتوح</span>}
                <span style={{ fontFamily: "monospace", fontSize: 10, color: T.muted }}>LV {r.min}+</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ACHIEVEMENTS PAGE ────────────────────────────────────────────────────────
const ACHIEVEMENT_CATEGORY_LABEL = {
  weak: "🗡️ بوابات ضعيفة",
  strong: "💀 بوابات قوية",
  level: "⭐ التقدّم",
  lootSSS: "💎 الغنائم",
  potionsUsed: "🧪 النجاة",
};

function AchievementCard({ achievement, unlocked, progress, idx, justUnlocked }) {
  const tier = ACHIEVEMENT_TIERS[achievement.tier] || ACHIEVEMENT_TIERS.bronze;
  const color = tier.color;
  const pct = Math.max(0, Math.min(100, (progress / achievement.target) * 100));
  const isLegendary = achievement.tier === "legendary";
  const isGold = achievement.tier === "gold";

  return (
    <div style={{
      ...glass({ padding: "16px 18px" }),
      position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center", gap: 14,
      opacity: unlocked ? 1 : 0.5,
      border: unlocked
        ? `1px solid ${color}${justUnlocked ? "ff" : "60"}`
        : `1px solid ${T.border}`,
      boxShadow: unlocked
        ? justUnlocked
          ? `0 0 40px ${color}70, 0 0 80px ${color}20, 0 8px 30px rgba(0,0,0,0.5)`
          : `0 0 18px ${color}22`
        : "none",
      animation: justUnlocked
        ? `popIn 0.5s cubic-bezier(.34,1.56,.64,1) both`
        : `fadeUp 0.3s ease-out ${idx * 0.03}s both`,
      transition: "all 0.3s ease",
    }}>
      {/* خلفية توهج للمكتمل */}
      {unlocked && (
        <div style={{
          position: "absolute", inset: 0, opacity: justUnlocked ? 0.12 : 0.06,
          background: `radial-gradient(ellipse at 30% 50%, ${color}, transparent 70%)`,
          pointerEvents: "none",
        }} />
      )}

      {unlocked && <HudCorners color={color} size={9} />}

      {/* هالة دوّارة للأسطوري أو المفتوح حديثاً */}
      {unlocked && (isLegendary || isGold || justUnlocked) && (
        <div style={{
          position: "absolute", inset: -20, opacity: justUnlocked ? 0.18 : 0.08,
          pointerEvents: "none",
          background: `conic-gradient(from 0deg, ${color}, transparent, ${color})`,
          animation: "auraSpin 6s linear infinite",
        }} />
      )}

      {/* نبضات حلقية للمفتوح حديثاً */}
      {justUnlocked && ["-4px", "-14px"].map((inset, i) => (
        <div key={i} style={{
          position: "absolute", inset,
          borderRadius: 16,
          border: `1px solid ${color}50`,
          animation: `pulse-ring ${1.8 + i * 0.5}s ease-in-out infinite`,
          pointerEvents: "none",
        }} />
      ))}

      {/* الأيقونة */}
      <div style={{
        flexShrink: 0, width: 52, height: 52, borderRadius: 13,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28,
        background: unlocked ? `${color}1a` : "rgba(255,255,255,0.04)",
        border: `1px solid ${unlocked ? color + "50" : T.border}`,
        filter: unlocked ? `drop-shadow(0 0 ${justUnlocked ? 16 : 8}px ${color}${justUnlocked ? "cc" : "70"})` : "grayscale(1) opacity(0.4)",
        animation: unlocked && justUnlocked ? "itemFloat 3s ease-in-out infinite" : "none",
        position: "relative", zIndex: 2,
      }}>
        {unlocked ? achievement.icon : "🔒"}
      </div>

      <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{
            fontFamily: "'Orbitron', monospace", fontWeight: 800, fontSize: 14,
            color: unlocked ? (justUnlocked ? color : T.text) : T.muted,
            textShadow: unlocked && justUnlocked ? `0 0 12px ${color}80` : "none",
          }}>
            {achievement.title}
          </span>
          <span style={{
            fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: 1,
            color, background: `${color}1a`, border: `1px solid ${color}50`,
            borderRadius: 5, padding: "1px 7px",
          }}>
            {tier.label}
          </span>
          {justUnlocked && (
            <span style={{
              fontFamily: "monospace", fontSize: 9, color: T.gold,
              background: "rgba(251,191,36,0.15)", border: `1px solid ${T.gold}50`,
              borderRadius: 5, padding: "1px 7px",
              animation: "pulseOpacity 1.4s ease-in-out infinite",
            }}>✨ جديد!</span>
          )}
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: T.muted, marginBottom: 8 }}>{achievement.desc}</div>

        {/* شريط التقدّم */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: unlocked ? 7 : 5, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden", transition: "height 0.3s" }}>
            <div style={{
              height: "100%", width: `${pct}%`,
              background: unlocked
                ? `linear-gradient(90deg, ${color}80, ${color})`
                : T.muted,
              borderRadius: 99, transition: "width 0.6s ease",
              boxShadow: unlocked ? `0 0 6px ${color}80` : "none",
            }} />
          </div>
          <span style={{ fontFamily: "monospace", fontSize: 10, color: unlocked ? color : T.muted, fontWeight: 700, whiteSpace: "nowrap" }}>
            {Math.min(progress, achievement.target)}/{achievement.target}
          </span>
        </div>
      </div>

      {/* ✅ أو تاج للأسطوري */}
      {unlocked && (
        <div style={{
          fontSize: isLegendary ? 24 : 18, flexShrink: 0,
          filter: justUnlocked ? `drop-shadow(0 0 10px ${color})` : "none",
          animation: justUnlocked ? "itemFloat 2.5s ease-in-out infinite" : "none",
        }}>
          {isLegendary ? "👑" : "✅"}
        </div>
      )}
    </div>
  );
}

export function AchievementsPage({ state, onUnlock }) {
  const unlockedIds = state.unlockedAchievements || [];
  const [newlyUnlocked, setNewlyUnlocked] = useState([]);
  const total = ACHIEVEMENTS.length;
  const unlockedCount = unlockedIds.length;
  const pct = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;
  const categories = ["weak", "strong", "level", "lootSSS", "potionsUsed"];

  // عند فتح الصفحة — افحص إنجازات مكتملة بالبروجرس بس غير مفتوحة → افتحها وأظهر toast
  useEffect(() => {
    const gs = state.gateStats || {};
    const progressMap = {
      weak: (gs.NORMAL || 0) + (gs.ELITE || 0),
      strong: (gs.BOSS || 0) + (gs.DUNGEON || 0) + (gs.DESTRUCTION_KING || 0),
      level: state.level || 1,
      lootSSS: state.sssLootCount || 0,
      potionsUsed: state.potionsUsedCount || 0,
    };
    const missed = ACHIEVEMENTS.filter((a) => {
      if (unlockedIds.includes(a.id)) return false;
      const prog = progressMap[a.category] ?? 0;
      return prog >= a.target;
    });
    if (missed.length > 0) {
      setNewlyUnlocked(missed.map((a) => a.id));
      if (onUnlock) onUnlock(missed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // الإنجازات المفتوحة الكاملة = المحفوظة + الجديدة من هذي الجلسة
  const allUnlocked = [...new Set([...unlockedIds, ...newlyUnlocked])];
  const displayCount = allUnlocked.length;
  const displayPct = total > 0 ? Math.round((displayCount / total) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80, padding: "80px 24px 40px", maxWidth: 680, margin: "0 auto", animation: "pageInRight 0.4s ease-out both" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: T.gold, marginBottom: 8 }}>◈ HUNTER ACHIEVEMENTS</div>
        <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: 24, fontWeight: 700, color: T.text }}>الإنجازات</h2>
      </div>

      {/* بطاقة الملخّص */}
      <div style={{
        ...glass({ padding: 28 }), textAlign: "center", marginBottom: 26,
        position: "relative", overflow: "hidden",
        border: `1px solid ${T.gold}50`,
        boxShadow: `0 0 40px ${T.gold}20, 0 10px 30px rgba(0,0,0,0.4)`,
      }}>
        <HudCorners color={T.gold} size={14} />
        <div style={{
          position: "absolute", inset: -40, opacity: 0.07, pointerEvents: "none",
          background: `conic-gradient(from 0deg, ${T.gold}, transparent, ${T.gold})`,
          animation: "auraSpin 12s linear infinite",
        }} />
        <div style={{ fontSize: 44, marginBottom: 8, filter: `drop-shadow(0 0 16px ${T.gold}80)`, animation: "itemFloat 3s ease-in-out infinite" }}>🏆</div>
        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 28, fontWeight: 900, color: T.gold }}>{displayCount} / {total}</div>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: T.muted, marginTop: 4 }}>إنجاز مفتوح ({displayPct}%)</div>
        <div style={{ height: 8, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden", marginTop: 14 }}>
          <div style={{
            height: "100%", width: `${displayPct}%`,
            background: `linear-gradient(90deg, ${T.gold}, #fde68a, ${T.gold})`,
            backgroundSize: "200% auto",
            borderRadius: 99, transition: "width 0.6s ease",
            boxShadow: `0 0 12px ${T.gold}80`,
            animation: "shimmerText 2.5s linear infinite",
          }} />
        </div>
        {newlyUnlocked.length > 0 && (
          <div style={{
            marginTop: 14, fontFamily: "monospace", fontSize: 11,
            color: T.gold, animation: "pulseOpacity 1.5s ease-in-out infinite",
          }}>✨ فُتح {newlyUnlocked.length} إنجاز جديد!</div>
        )}
      </div>

      {/* الإنجازات مجمّعة حسب الفئة */}
      {categories.map((cat) => {
        const items = ACHIEVEMENTS.filter((a) => a.category === cat).sort((a, b) => a.target - b.target);
        if (items.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 26 }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: T.muted, marginBottom: 12 }}>
              — {ACHIEVEMENT_CATEGORY_LABEL[cat] || cat} —
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((ach, i) => {
                const isUnlocked = allUnlocked.includes(ach.id);
                const isJustUnlocked = newlyUnlocked.includes(ach.id);
                return (
                  <AchievementCard
                    key={ach.id}
                    achievement={ach}
                    unlocked={isUnlocked}
                    progress={getAchievementProgress(state, ach)}
                    idx={i}
                    justUnlocked={isJustUnlocked}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── LOOT CARD ────────────────────────────────────────────────────────────────
function LootCard({ tier, name, qty, level, idx, keyId, isEquipped, onEquip, onUpgrade, selected, onToggleSelect }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const color = TIER_COLOR[tier];
  const isTop = !!TIER_TOP[tier];
  const slot = itemShapeType(name);
  const statKey = SLOT_STAT[slot];
  const cost = upgradeCost(level || 0);
  const canUpgrade = (level || 0) < UPGRADE_MAX_LEVEL && qty >= cost + 1;

  const onMove = (e) => { const rect = e.currentTarget.getBoundingClientRect(); setTilt({ x: ((e.clientY - rect.top) / rect.height - 0.5) * -14, y: ((e.clientX - rect.left) / rect.width - 0.5) * 14 }); };
  const onLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <div onMouseMove={onMove} onMouseLeave={onLeave} style={{ ...glass({ padding: "20px 14px 14px" }), position: "relative", animation: `fadeUp 0.35s ease-out ${idx * 0.04}s both`, transformStyle: "preserve-3d", perspective: 600, transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition: "transform 0.25s cubic-bezier(.22,1,.36,1), box-shadow 0.25s", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, border: selected ? `1px solid ${T.purple}` : `1px solid ${color}20`, boxShadow: selected ? `0 0 0 1px ${T.purple}80, 0 10px 30px rgba(0,0,0,.35)` : `0 0 14px ${color}10` }}>
      <HudCorners size={9} color={color} />
      {isTop && <div style={{ position: "absolute", inset: -1, borderRadius: 14, opacity: 0.12, pointerEvents: "none", background: `conic-gradient(from 0deg, ${color}, transparent, ${color})`, animation: "auraSpin 9s linear infinite" }} />}

      <button onClick={() => onToggleSelect(keyId)} style={{ position: "absolute", top: 8, left: 8, width: 18, height: 18, borderRadius: 4, border: `1px solid ${selected ? T.purple : T.border}`, background: selected ? T.purple : "rgba(0,0,0,0.25)", color: "#04000f", fontSize: 11, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>{selected ? "✓" : ""}</button>

      <div style={{ position: "absolute", top: 8, right: 8, fontFamily: "monospace", fontSize: 11, color: T.gold, fontWeight: 700, background: "rgba(0,0,0,0.4)", borderRadius: 6, padding: "2px 7px" }}>×{qty}</div>

      <div style={{ position: "relative", width: 60, height: 60, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
        {isEquipped && <div style={{ position: "absolute", inset: -6, borderRadius: "50%", border: `2px solid ${T.gold}`, boxShadow: `0 0 14px ${T.gold}80`, animation: "pulse-ring 2s ease-in-out infinite" }} />}
        <div style={{ position: "absolute", bottom: -2, width: 42, height: 9, borderRadius: "50%", background: color, opacity: 0.35, filter: "blur(6px)" }} />
        <div style={{ animation: "itemFloat 3.6s ease-in-out infinite" }}>
          <ItemIcon name={name} tier={tier} uid={`${tier}-${idx}`} size={52} />
        </div>
      </div>

      <span style={{ fontFamily: "'Orbitron',monospace", fontWeight: 900, fontSize: 13, ...(tier === "SSS" ? { backgroundImage: `linear-gradient(90deg, ${T.gold}, ${T.purple}, ${T.cyan}, ${T.gold})`, backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "shimmerText 2.6s linear infinite" } : { color, textShadow: isTop ? `0 0 10px ${color}80` : "none" }) }}>[{tier}]{level > 0 ? ` +${level}` : ""}</span>

      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, textAlign: "center" }}>{name}</div>
      <div style={{ fontFamily: "monospace", fontSize: 10, color: T.muted }}>{SLOT_LABEL[slot]} · {statKey}+{itemBonusValue({ tier, level })}</div>

      <div style={{ display: "flex", gap: 6, width: "100%", marginTop: 4 }}>
        <button onClick={() => onEquip(keyId)} style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${isEquipped ? T.gold : T.border}`, background: isEquipped ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)", color: isEquipped ? T.gold : T.text, fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}>{isEquipped ? "✓ مجهّز" : "تجهيز"}</button>
        <button onClick={() => canUpgrade && onUpgrade(keyId)} disabled={!canUpgrade} style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${T.border}`, background: canUpgrade ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.03)", color: canUpgrade ? T.cyan : T.muted, fontSize: 10.5, fontWeight: 700, cursor: canUpgrade ? "pointer" : "default" }}>⤴ ترقية (-{cost})</button>
      </div>
    </div>
  );
}

// ─── CRYSTAL CARD (consumable) ─────────────────────────────────
function CrystalCard({ count }) {
  return (
    <div style={{
      ...glass({ padding: "20px 18px" }),
      position: "relative", overflow: "hidden",
      border: "1px solid rgba(251,191,36,0.4)",
      boxShadow: "0 0 30px rgba(251,191,36,0.12), 0 8px 24px rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", gap: 18,
      animation: "fadeUp 0.35s ease-out both",
      marginBottom: 22,
    }}>
      <div style={{ position: "absolute", inset: -30, opacity: 0.07, pointerEvents: "none", background: "conic-gradient(from 0deg,#fbbf24,transparent,#fbbf24)", animation: "auraSpin 10s linear infinite" }} />
      <HudCorners size={10} color={T.gold} />
      <div style={{
        flexShrink: 0, width: 64, height: 64, borderRadius: 14,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 36, background: "rgba(251,191,36,0.12)",
        border: "1px solid rgba(251,191,36,0.4)",
        filter: "drop-shadow(0 0 12px rgba(251,191,36,0.7))",
        animation: "itemFloat 3s ease-in-out infinite",
        position: "relative", zIndex: 1,
      }}>💎</div>
      <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Orbitron',monospace", fontWeight: 900, fontSize: 15, color: T.gold, textShadow: "0 0 12px rgba(251,191,36,0.6)" }}>كرستال التطوير</span>
          <span style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: 1, color: T.gold, background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: 5, padding: "2px 8px" }}>CONSUMABLE</span>
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#9ca3af", lineHeight: 1.7, marginBottom: 10 }}>
          تُستخدم لكسر حاجز <span style={{ color: T.gold }}>LV.10</span> للجنود الخاصين — إيغريس و بيرو و بيليون.
          بعد التطوير يصل الجندي حتى <span style={{ color: T.gold, fontWeight: 700 }}>LV.20</span>.
          اضغط الزر الذهبي على بطاقة الجندي في صفحة جيش الظل.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "monospace", fontSize: 10, color: "#6b7280" }}>الكمية:</span>
          <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 22, fontWeight: 900, color: T.gold, textShadow: "0 0 12px rgba(251,191,36,0.7)" }}>×{count}</span>
          <span style={{ fontFamily: "monospace", fontSize: 9, color: "#6b7280", background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: "3px 9px", border: "1px solid #ffffff10", marginRight: "auto" }}>
            ★ جند خاص LV.10 → اضغط الزر الذهبي ببطاقته
          </span>
        </div>
      </div>
    </div>
  );
}

function EquipSlots({ state }) {
  const equipped = state.equipped || {};
  const inv = state.inventory || [];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(105px,1fr))", gap: 8, marginBottom: 20 }}>
      {SLOT_ORDER.map((slot) => {
        const key = equipped[slot];
        const item = key ? inv.find((it) => `${it.tier}-${it.name}` === key) : null;
        const color = item ? TIER_COLOR[item.tier] : T.muted;
        return (
          <div key={slot} style={{ ...glass({ padding: "10px 10px" }), textAlign: "center", position: "relative", border: item ? `1px solid ${color}40` : `1px solid ${T.border}`, boxShadow: item ? `0 0 12px ${color}20` : "none" }}>
            <HudCorners size={7} color={color} />
            <div style={{ fontFamily: "monospace", fontSize: 9, color: T.muted, letterSpacing: 1, marginBottom: 6 }}>{SLOT_LABEL[slot]} · {SLOT_STAT[slot]}</div>
            {item ? (
              <>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                  <ItemIcon name={item.name} tier={item.tier} uid={`slot-${slot}`} size={32} />
                </div>
                <div style={{ fontSize: 11, color: T.gold, fontWeight: 700 }}>+{itemBonusValue(item)}</div>
              </>
            ) : (
              <div style={{ fontSize: 11, color: T.muted, padding: "12px 0", opacity: 0.5 }}>—</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── LOOT PAGE ────────────────────────────────────────────────────────────────
export function LootPage({ state, onEquip, onUpgrade, onCombine }) {
  const [selected, setSelected] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const inv = state.inventory || [];
  const equipped = state.equipped || {};
  const equippedKeys = new Set(Object.values(equipped).filter(Boolean));

  const toggleSelect = (key) => setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : prev.length >= 3 ? prev : [...prev, key]);

  const allSorted = TIERS.slice().reverse().flatMap((tier) => inv.filter((it) => it.tier === tier));
  const filtered = filter === "ALL" ? allSorted : allSorted.filter((it) => it.tier === filter);

  const selectedItems = selected.map((k) => inv.find((it) => `${it.tier}-${it.name}` === k)).filter(Boolean);
  const sameTier = selectedItems.length === 3 && selectedItems.every((it) => it.tier === selectedItems[0].tier);
  const tierIdx = selectedItems[0] ? TIERS.indexOf(selectedItems[0].tier) : -1;
  const canCombine = sameTier && tierIdx >= 0 && tierIdx < TIERS.length - 1;
  const hint = selected.length === 3 && !sameTier ? "اختر 3 من نفس الرتبة" : selected.length === 3 && !canCombine ? "SSS أعلى رتبة — لا تُدمج" : null;

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80, padding: "80px 24px 100px", maxWidth: 760, margin: "0 auto", animation: "pageInRight 0.4s ease-out both" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: T.purple, marginBottom: 8 }}>◈ INVENTORY</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: 24, fontWeight: 700, color: T.text }}>المخزون</h2>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: T.muted }}>{inv.length} عنصر</span>
        </div>
      </div>

      <EquipSlots state={state} />

      {/* كرستال التطوير */}
      {(state.crystals || 0) > 0 && <CrystalCard count={state.crystals} />}

      {/* tier filter */}
      {inv.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {["ALL", ...TIERS.slice().reverse()].map((t) => (
            <button key={t} onClick={() => setFilter(t)} style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${filter === t ? (TIER_COLOR[t] || T.purple) : T.border}`, background: filter === t ? `${TIER_COLOR[t] || T.purple}20` : "transparent", color: filter === t ? (TIER_COLOR[t] || T.purple) : T.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "monospace", letterSpacing: 1 }}>{t}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: 40 }}>
          {inv.length === 0 ? "لسا ما نزل لك أي عنصر — أكمل مهام أو بوابات" : "لا يوجد عناصر بهذه الرتبة"}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: 12 }}>
          {filtered.map((it, i) => {
            const key = `${it.tier}-${it.name}`;
            return <LootCard key={key} keyId={key} tier={it.tier} name={it.name} qty={it.qty} level={it.level || 0} idx={i} isEquipped={equippedKeys.has(key)} onEquip={onEquip} onUpgrade={onUpgrade} selected={selected.includes(key)} onToggleSelect={toggleSelect} />;
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 150, animation: "popIn 0.3s ease-out both" }}>
          <div style={{ ...glass({ padding: "14px 22px" }), display: "flex", alignItems: "center", gap: 14, border: `1px solid ${canCombine ? T.purple : T.border}`, boxShadow: canCombine ? `0 0 30px ${T.purple}50` : "none" }}>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: T.text }}>محدد: {selected.length}/3</span>
            {hint && <span style={{ fontFamily: "monospace", fontSize: 11, color: T.red }}>{hint}</span>}
            <button onClick={() => { if (canCombine) { onCombine(selected); setSelected([]); } }} disabled={!canCombine} style={{ padding: "8px 18px", borderRadius: 6, border: "none", cursor: canCombine ? "pointer" : "default", background: canCombine ? `linear-gradient(135deg, ${T.glow}, ${T.glowBlue})` : "rgba(255,255,255,0.06)", color: canCombine ? "#fff" : T.muted, fontWeight: 700, fontSize: 12 }}>🔥 دمج لرتبة أعلى</button>
            <button onClick={() => setSelected([])} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 12 }}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}

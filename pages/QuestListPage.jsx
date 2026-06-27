import { useState } from "react";
import { T, glass } from "../constants/tokens";
import { QuestCard, PlayerHpBar, AddQuestForm } from "../components/QuestCard";

const TYPE_COLORS = { DAILY: "#22d3ee", WEEKLY: "#60a5fa" };

function QuestSection({ title, color, items, onComplete, onDelete, combatFlash }) {
  const done = items.filter((q) => q.completed).length;
  const pct = items.length ? (done / items.length) * 100 : 0;
  const [open, setOpen] = useState(true);

  return (
    <div style={{ marginBottom: 20 }}>
      {/* section header */}
      <div onClick={() => setOpen((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer", userSelect: "none" }}>
        <div style={{ width: 3, height: 20, borderRadius: 2, background: color }} />
        <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, fontWeight: 700, color, letterSpacing: 2 }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${color}40, transparent)` }} />
        {/* mini ring progress */}
        <svg width="28" height="28" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
          <circle cx="14" cy="14" r="11" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${(pct / 100) * 69.1} 69.1`} strokeLinecap="round"
            transform="rotate(-90 14 14)" style={{ transition: "stroke-dasharray 0.4s ease" }} />
        </svg>
        <span style={{ fontFamily: "monospace", fontSize: 10, color, fontWeight: 700 }}>{done}/{items.length}</span>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: T.muted }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "fadeUp 0.25s ease-out both" }}>
          {items.length === 0 && (
            <div style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: "16px 0", fontFamily: "monospace" }}>
              لا توجد مهام — أضف من الأعلى
            </div>
          )}
          {items.map((q) => (
            <QuestCard key={q.id} quest={q} onComplete={onComplete} onDelete={onDelete} flash={combatFlash} />
          ))}
        </div>
      )}
    </div>
  );
}

export function QuestListPage({ title, subtitle, types, addType, state, onComplete, onDelete, onAdd, onPotion, onRest, combatFlash }) {
  const daily  = state.quests.filter((q) => q.type === "DAILY");
  const weekly = state.quests.filter((q) => q.type === "WEEKLY");
  const allItems = state.quests.filter((q) => types.includes(q.type));
  const isGatePage = types.includes("GATE");

  const totalDone = allItems.filter((q) => q.completed).length;
  const totalPct = allItems.length ? (totalDone / allItems.length) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh", padding: "80px 24px 40px", maxWidth: 700, margin: "0 auto", animation: "pageInRight 0.4s ease-out both" }}>

      {/* header */}
      <div style={{ marginBottom: 28, position: "relative" }}>
        <div style={{ position: "absolute", left: -24, top: 0, bottom: 0, width: 3, background: `linear-gradient(to bottom, ${T.purple}, transparent)` }} />
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: T.purple, marginBottom: 8 }}>◈ {subtitle}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: 24, fontWeight: 700, color: T.text }}>{title}</h2>
          {!isGatePage && allItems.length > 0 && (
            <div style={{ fontFamily: "monospace", fontSize: 11, color: totalPct === 100 ? T.green : T.muted }}>
              {totalDone}/{allItems.length} {totalPct === 100 ? "✓ مكتمل" : `(${Math.round(totalPct)}%)`}
            </div>
          )}
        </div>
        {/* overall progress bar */}
        {!isGatePage && allItems.length > 0 && (
          <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, marginTop: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${totalPct}%`, background: `linear-gradient(90deg, ${T.purple}, ${T.cyan})`, transition: "width 0.5s ease", boxShadow: `0 0 8px ${T.purple}` }} />
          </div>
        )}
      </div>

      {isGatePage && <PlayerHpBar state={state} onPotion={onPotion} onRest={onRest} />}

      {/* add form */}
      <div style={{ marginBottom: 20 }}>
        <AddQuestForm defaultType={addType} onAdd={onAdd} />
      </div>

      {/* quest sections */}
      {isGatePage ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {allItems.map((q) => <QuestCard key={q.id} quest={q} onComplete={onComplete} onDelete={onDelete} flash={combatFlash} />)}
          {allItems.length === 0 && <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: 30 }}>لا توجد مهام حالياً — أضف واحدة بالأعلى</div>}
        </div>
      ) : (
        <>
          <QuestSection title="DAILY" color={TYPE_COLORS.DAILY} items={daily} onComplete={onComplete} onDelete={onDelete} combatFlash={combatFlash} />
          <QuestSection title="WEEKLY" color={TYPE_COLORS.WEEKLY} items={weekly} onComplete={onComplete} onDelete={onDelete} combatFlash={combatFlash} />
        </>
      )}
    </div>
  );
}

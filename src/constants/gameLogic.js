import { TIERS, ITEM_POOL, GATE_DIFFICULTY, SLOT_STAT, tierBonusValue, ACHIEVEMENTS } from "./gameData";

// ─── SYNC TO SERVER (Backend Connection) ──────────────────────────────────────
export async function syncToServer(state, user) {
  if (!user || !user.id) {
    console.warn("المستخدم غير مسجل دخول، المزامنة متوقفة.");
    return;
  }

  try {
    const stats = state.stats;
    const dataToSend = {
      discord_id: user.id,
      username: user.username,
      avatar: user.avatar || null,
      level: state.level,
      exp: state.exp,
      str: stats.STR,
      agi: stats.AGI,
      vit: stats.VIT,
      intl: stats.INT,
      sense: stats.SENSE,
    };

    const response = await fetch('https://sololeveling-mmo-server.onrender.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend),
    });

    if (!response.ok) throw new Error("فشل في مزامنة البيانات");
    return await response.json();
  } catch (err) {
    console.error("خطأ في الاتصال بالسيرفر:", err);
  }
}

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function weekKey() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

// ─── COMBAT ───────────────────────────────────────────────────────────────────
export function rollDamage(str) {
  const min = Math.max(1, str - 2);
  const max = str + 4;
  let dmg = min + Math.floor(Math.random() * (max - min + 1));
  let crit = false;
  if (Math.random() < 0.10) { dmg *= 2; crit = true; }
  return { dmg, crit };
}

export function rollMonsterDamage([min, max]) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function maxPlayerHp(stats) {
  return 250 + (stats?.VIT || 10) * 5;
}

export function hpColor(pct) {
  if (pct > 50) return "#10b981";
  if (pct > 20) return "#eab308";
  return "#ef4444";
}

// ─── LOOT ─────────────────────────────────────────────────────────────────────
export function rollLoot(dropChance, weights) {
  if (Math.random() > dropChance) return null;
  const total = TIERS.reduce((sum, t) => sum + weights[t], 0);
  let r = Math.random() * total;
  let chosen = TIERS[0];
  for (const t of TIERS) {
    r -= weights[t];
    if (r <= 0) { chosen = t; break; }
  }
  const pool = ITEM_POOL[chosen];
  const name = pool[Math.floor(Math.random() * pool.length)];
  return { tier: chosen, name };
}

export function itemBonusValue(item) {
  const base = tierBonusValue(item.tier); // أساس الندرة (مثلاً 16)
  const level = item.level || 0;          // اللفل (مثلاً 10)

  // طريقة الزيادة = (الأساس) + (اللفل مضروب في رقم) + (مكافأة الماكس)
  return base + (level * 5) + (level >= 10 ? 1154 : 0);
}

export function getEquipmentBonuses(state) {
  const bonuses = { STR: 0, AGI: 0, VIT: 0, INT: 0, SENSE: 0 };
  const equipped = state.equipped || {};
  const inv = state.inventory || [];
  for (const slot of Object.keys(SLOT_STAT)) {
    const key = equipped[slot];
    if (!key) continue;
    const item = inv.find((it) => `${it.tier}-${it.name}` === key);
    if (!item) continue;
    bonuses[SLOT_STAT[slot]] += itemBonusValue(item);
  }
  return bonuses;
}

export function effectiveStats(state) {
  const bonus = getEquipmentBonuses(state);
  const s = state.stats;
  return {
    STR: s.STR + bonus.STR,
    AGI: s.AGI + bonus.AGI,
    VIT: s.VIT + bonus.VIT,
    INT: s.INT + bonus.INT,
    SENSE: s.SENSE + bonus.SENSE,
  };
}

// ─── STAMINA / LEVEL SCALING ──────────────────────────────────────────────────
// بداية اللعبة: 700 | كل لفل يرفع الحد الأقصى +5
export function maxStaminaForLevel(level) {
  return 700 + (level - 1) * 5;
}

// ─── EXP / LEVELING ───────────────────────────────────────────────────────────
export function gainExp(state, amount) {
  let { level, exp, expToNext, statPoints, stamina } = state;
  exp += amount;
  let leveledUp = 0;
  while (exp >= expToNext) {
    exp -= expToNext;
    level += 1;
    expToNext = expToNext + 50;
    statPoints += 3;
    leveledUp += 1;
  }
  // تحديث الحد الأقصى للستمنا بعد اللفل أب
  const newMaxStamina = maxStaminaForLevel(level);
  return { ...state, level, exp, expToNext, statPoints, maxStamina: newMaxStamina, _leveledUp: leveledUp };
}

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────
// يرجع قائمة IDs لإنجازات جديدة تحققت ولسا غير مفتوحة بحالة اللاعب
export function checkNewAchievements(state) {
  const unlocked = state.unlockedAchievements || [];
  const gs = state.gateStats || {};
  const weakCount = (gs.NORMAL || 0) + (gs.ELITE || 0);
  const strongCount = (gs.BOSS || 0) + (gs.DUNGEON || 0) + (gs.DESTRUCTION_KING || 0);

  const progressByCategory = {
    weak: weakCount,
    strong: strongCount,
    level: state.level || 1,
    lootSSS: state.sssLootCount || 0,
    potionsUsed: state.potionsUsedCount || 0,
  };

  const newly = [];
  for (const ach of ACHIEVEMENTS) {
    if (unlocked.includes(ach.id)) continue;
    const progress = progressByCategory[ach.category] ?? 0;
    if (progress >= ach.target) newly.push(ach.id);
  }
  return newly;
}

// يرجع رقم التقدّم الحالي لفئة إنجاز معيّن (يُستخدم بصفحة الإنجازات لعرض شريط التقدّم)
export function getAchievementProgress(state, achievement) {
  const gs = state.gateStats || {};
  const map = {
    weak: (gs.NORMAL || 0) + (gs.ELITE || 0),
    strong: (gs.BOSS || 0) + (gs.DUNGEON || 0) + (gs.DESTRUCTION_KING || 0),
    level: state.level || 1,
    lootSSS: state.sssLootCount || 0,
    potionsUsed: state.potionsUsedCount || 0,
  };
  return map[achievement.category] ?? 0;
}

// ─── STATE HELPERS ────────────────────────────────────────────────────────────
export function applyResets(state) {
  const t = todayStr(), w = weekKey();
  let changed = false;
  const quests = state.quests.map((q) => {
    if (q.frequency === "daily" && q.completed && q.lastDate !== t) { changed = true; return { ...q, completed: false }; }
    if (q.frequency === "weekly" && q.completed && q.lastDate !== w) { changed = true; return { ...q, completed: false }; }
    return q;
  });
  return changed ? { ...state, quests } : state;
}

export function defaultState() {
  return {
    level: 1,
    exp: 0,
    expToNext: 100,
    statPoints: 0,
    stats: { STR: 10000, AGI: 10, VIT: 10, INT: 10, SENSE: 10 },
    inventory: [],
    equipped: {},
    stamina: 700,
    maxStamina: maxStaminaForLevel(1), // يبدأ بـ 700 ويرتفع مع كل لفل
    lastRest: Date.now(),
    dailyQuestAdds: 0,
    lastAddDate: null,
    playerHp: maxPlayerHp({ VIT: 10 }),
    potions: 9,
    // ── عدادات الإنجازات ──
    gateStats: { NORMAL: 0, ELITE: 0, BOSS: 0, DUNGEON: 0, DESTRUCTION_KING: 0 },
    sssLootCount: 0,
    potionsUsedCount: 0,
    unlockedAchievements: [],
    quests: [
      { id: "q1", title: "100 Pushups", type: "DAILY", expReward: 15, frequency: "daily", completed: false, lastDate: null },
      { id: "q2", title: "100 Situps", type: "DAILY", expReward: 15, frequency: "daily", completed: false, lastDate: null },
      { id: "q3", title: "Read 30 minutes", type: "DAILY", expReward: 10, frequency: "daily", completed: false, lastDate: null },
      { id: "q4", title: "Plan the week", type: "WEEKLY", expReward: 40, frequency: "weekly", completed: false, lastDate: null },
      { id: "q5", title: "Finish a side-project milestone", type: "GATE", expReward: GATE_DIFFICULTY.NORMAL.exp, frequency: "once", hp: GATE_DIFFICULTY.NORMAL.hp, maxHp: GATE_DIFFICULTY.NORMAL.hp, difficulty: "NORMAL", completed: false, lastDate: null },
    ],
  };
}
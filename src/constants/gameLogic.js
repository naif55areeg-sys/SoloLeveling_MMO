import { TIERS, ITEM_POOL, GATE_DIFFICULTY, SLOT_STAT, tierBonusValue, ACHIEVEMENTS, SHADOW_MAX_DEPLOYED, SHADOW_EXP_PER_BATTLE, SHADOW_DUPLICATE_EXP, SHADOW_MAX_LEVEL, SHADOW_SPECIAL_MAX_LEVEL, SHADOW_SPECIAL_NAMES, SHADOW_POOLS, SHADOW_CRYSTAL_CHANCE, shadowExpToNext, shadowStatsBuff } from "./gameData";

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
  return 300 + (stats?.VIT || 10) * 5;
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

export function getShadowSoldierBonuses(state) {
  const bonuses = { STR: 0, AGI: 0, VIT: 0, INT: 0, SENSE: 0 };
  const soldiers = state.shadowSoldiers || [];
  const deployed = state.equippedShadows || [];
  for (const id of deployed) {
    const soldier = soldiers.find((s) => s.id === id);
    if (!soldier) continue;
    const buff = shadowStatsBuff(soldier);
    bonuses.STR += buff.STR;
    bonuses.AGI += buff.AGI;
    bonuses.VIT += buff.VIT;
    bonuses.INT += buff.INT;
    bonuses.SENSE += buff.SENSE;
  }
  return bonuses;
}

export function effectiveStats(state) {
  const bonus = getEquipmentBonuses(state);
  const shadowBonus = getShadowSoldierBonuses(state);
  const s = state.stats;
  return {
    STR: s.STR + bonus.STR + shadowBonus.STR,
    AGI: s.AGI + bonus.AGI + shadowBonus.AGI,
    VIT: s.VIT + bonus.VIT + shadowBonus.VIT,
    INT: s.INT + bonus.INT + shadowBonus.INT,
    SENSE: s.SENSE + bonus.SENSE + shadowBonus.SENSE,
  };
}

// ─── SHADOW SOLDIER HELPERS ───────────────────────────────────────────────────
// يختار إحصائيتين عشوائيتين من الخمسة لجندي ظل عادي (يُحدد مرة واحدة عند الاستخراج)
function randomTwoStats() {
  const ALL = ["STR", "AGI", "VIT", "INT", "SENSE"];
  const shuffled = ALL.slice().sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

// يرفع خبرة جندي ظل واحد ويتعامل مع اللفل أب — مع الحد الأقصى للمستوى
export function gainShadowExp(soldier, amount) {
  // مطابقة جزئية عشان تشمل كل صيغ الاسم (من الأدمن أو من البول)
  const n = soldier.name || "";
  const isSpecial = SHADOW_SPECIAL_NAMES.includes(n) ||
    n.includes("إيغريس") || n.includes("بيرو") || n.includes("بيليون");
  const maxLevel = (isSpecial && soldier.crystallized) ? SHADOW_SPECIAL_MAX_LEVEL : SHADOW_MAX_LEVEL;
  let { level = 1, exp = 0 } = soldier;
  if (level >= maxLevel) return { ...soldier, _leveledUp: 0 };
  exp += amount;
  let expToNext = shadowExpToNext(level);
  let leveledUp = 0;
  while (exp >= expToNext && level < maxLevel) {
    exp -= expToNext;
    level += 1;
    expToNext = shadowExpToNext(level);
    leveledUp += 1;
  }
  if (level >= maxLevel) exp = 0;
  return { ...soldier, level, exp, _leveledUp: leveledUp };
}

// يستقبل state كامل ويرفع خبرة كل الجنود المنشورين (يُستخدم بعد كل معركة بوابة منتصرة)
export function trainDeployedShadows(state) {
  const soldiers = state.shadowSoldiers || [];
  const deployed = new Set(state.equippedShadows || []);
  if (deployed.size === 0) return state;
  const updated = soldiers.map((s) => deployed.has(s.id)
    ? { ...gainShadowExp(s, SHADOW_EXP_PER_BATTLE), uses: (s.uses || 0) + 1 }
    : s
  );
  return { ...state, shadowSoldiers: updated };
}

// ─── SHADOW POOL EXTRACTION ───────────────────────────────────────────────────
// يرمي roll واحد (0→1) ويتراكم على الـ cumulative chance لكل جندي في البول
// أول جندي تتجاوز cumulative فيه رقم الـ roll ينزل — إذا ما تجاوز أحد، لا ينزل شيء
export function rollShadowFromPool(gateKey) {
  const pool = SHADOW_POOLS[gateKey];
  if (!pool || !pool.length) return null;
  const roll = Math.random();
  let cumulative = 0;
  for (const entry of pool) {
    cumulative += entry.chance;
    if (roll < cumulative) {
      return { name: entry.name, tier: gateKey };
    }
  }
  return null;
}

// كرستال التطوير — ينزل من S Rank فقط بنسبة 5% (roll منفصل تماماً عن roll الجندي)
export function rollCrystalDrop(gateKey) {
  if (gateKey !== "S_RANK") return false;
  return Math.random() < SHADOW_CRYSTAL_CHANCE;
}

// يستقبل state ومعلومات استخراج تم تقرير نجاحها مسبقاً (الاحتمال يُحسب مرة واحدة
// بصفحة البوابات) — يدمجها بالـ state: جندي جديد أو تعويض ذهب لجندي موجود بنفس الاسم
export function commitShadowExtraction(state, extracted) {
  if (!extracted) return state;
  const soldiers = state.shadowSoldiers || [];
  const existing = soldiers.find((s) => s.name === extracted.name);

  if (existing) {
    // مكرر — تعويض ذهب بدلاً من XP: 300 للجنود الخاصة، 150 للعاديين
    const compGold = SHADOW_SPECIAL_NAMES.includes(extracted.name || "") ? 300 : 150;
    return { ...state, gold: (state.gold || 0) + compGold };
  }

  const isNewSpecial = SHADOW_SPECIAL_NAMES.includes(extracted.name || "");
  const buffStats = isNewSpecial ? null : randomTwoStats();
  const soldier = {
    id: `shadow_${Date.now()}`,
    name: extracted.name,
    tier: extracted.tier,
    level: 1,
    exp: 0,
    uses: 0,
    extractedAt: Date.now(),
    ...(buffStats ? { buffStats } : {}),
  };
  return { ...state, shadowSoldiers: [...soldiers, soldier] };
}

export function toggleShadowDeploy(state, id) {
  const deployed = state.equippedShadows || [];
  if (deployed.includes(id)) {
    return { ...state, equippedShadows: deployed.filter((d) => d !== id) };
  }
  if (deployed.length >= SHADOW_MAX_DEPLOYED) return state;
  return { ...state, equippedShadows: [...deployed, id] };
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
  const weakCount = (gs.NORMAL || 0) + (gs.ELITE || 0) + (gs.E_RANK || 0) + (gs.D_RANK || 0) + (gs.C_RANK || 0);
  const strongCount = (gs.BOSS || 0) + (gs.DUNGEON || 0) + (gs.DESTRUCTION_KING || 0) + (gs.B_RANK || 0) + (gs.A_RANK || 0) + (gs.S_RANK || 0) + (gs.RED_GATE || 0);

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
    weak: (gs.NORMAL || 0) + (gs.ELITE || 0) + (gs.E_RANK || 0) + (gs.D_RANK || 0) + (gs.C_RANK || 0),
    strong: (gs.BOSS || 0) + (gs.DUNGEON || 0) + (gs.DESTRUCTION_KING || 0) + (gs.B_RANK || 0) + (gs.A_RANK || 0) + (gs.S_RANK || 0) + (gs.RED_GATE || 0),
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
    stats: { STR: 10, AGI: 10, VIT: 10, INT: 10, SENSE: 10 },
    inventory: [],
    equipped: {},
    shadowSoldiers: [],     // جنود الظل المُستخرجين من البوسات
    equippedShadows: [],    // الجنود المنشورين حالياً (يعطون ستات بفس)
    stamina: 700,
    maxStamina: maxStaminaForLevel(1), // يبدأ بـ 700 ويرتفع مع كل لفل
    lastRest: Date.now(),
    dailyQuestAdds: 0,
    lastAddDate: null,
    playerHp: maxPlayerHp({ VIT: 10 }), // 350 = 300 + 10*5
    potions: 9,
    // ── عدادات الإنجازات ──
    gateStats: { NORMAL: 0, ELITE: 0, BOSS: 0, DUNGEON: 0, DESTRUCTION_KING: 0, E_RANK: 0, D_RANK: 0, C_RANK: 0, B_RANK: 0, A_RANK: 0, S_RANK: 0, RED_GATE: 0 },
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

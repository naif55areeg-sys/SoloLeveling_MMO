import { T } from "./tokens";

export const PAGES = ["HOME", "QUESTS", "STATS", "GATES", "RANK", "LOOT", "SHADOW"];
export const STAT_KEYS = ["STR", "AGI", "VIT", "INT", "SENSE"];

export const LIMITS = {
  MAX_CUSTOM_QUESTS: 20000,
  MAX_EXP_DAILY: 60,
  MAX_EXP_WEEKLY: 1000,
  MAX_EXP_GATE: 3000,
};

// ─── RANKS ────────────────────────────────────────────────────────────────────
export const RANK_TIERS = [
  { title: "E-RANK", min: 1, color: "#9ca3af" },
  { title: "D-RANK", min: 10, color: "#38bdf8" },
  { title: "C-RANK", min: 20, color: T.cyan },
  { title: "B-RANK", min: 30, color: T.blue },
  { title: "A-RANK", min: 40, color: "#a855f7" },
  { title: "S-RANK", min: 50, color: "#7c3aed" },
  { title: "S+-RANK", min: 65, color: "#6d28d9", top: true },
  { title: "[ ★ ]-RULER", min: 80, color: "#fbbf24", top: true },
  { title: "[ ★ ]-RULER-ELITE", min: 500, color: "#f59e0b", top: true },
  { title: "[ ♛ ]-MONARCH-GENERAL", min: 1000, color: "#d97706", top: true },
  { title: "[ ♛ ]-MONARCH-SUPREME", min: 1500, color: "#b45309", top: true },
  { title: "[ ❂ ]-SHADOW-MONARCH", min: 2000, color: "#ef4444", top: true },
  { title: "[ ❂ ]-SHADOW-OVERLORD", min: 3000, color: "#dc2626", top: true },
  { title: "[ ♾ ]-ABSOLUTE", min: 5000, color: "#ff0055", top: true },
];

// ─── RANK SKILLS ──────────────────────────────────────────────────────────────
export const RANK_SKILLS = {
  "E-RANK": { name: "ضربة بدائية", multiplier: 1.3, desc: "تزيد ضرر ضربتك القادمة 30%" },
  "D-RANK": { name: "خطوة الصياد", multiplier: 1.4, desc: "تزيد ضرر ضربتك القادمة 40%" },
  "C-RANK": { name: "تركيز الحواس", multiplier: 1.5, desc: "تزيد ضرر ضربتك القادمة 50%" },
  "B-RANK": { name: "ثوران القوة", multiplier: 1.7, desc: "تزيد ضرر ضربتك القادمة 70%" },
  "A-RANK": { name: "نبضة السحر الأرجواني", multiplier: 1.9, desc: "تزيد ضرر ضربتك القادمة 90%" },
  "S-RANK": { name: "ضربة الظل", multiplier: 2.0, desc: "تضاعف ضرر ضربتك القادمة بالكامل" },
  "S+-RANK": { name: "سلطة ملك الظلال", multiplier: 2.5, desc: "ضرر ضربتك القادمة × 2.5" },
};

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────
export const ACHIEVEMENT_TIERS = {
  bronze: { color: "#cd7f32", label: "برونزي" },
  silver: { color: "#c0c0c0", label: "فضي" },
  gold: { color: "#fbbf24", label: "ذهبي" },
  legendary: { color: "#ff0055", label: "أسطوري" },
};

export const ACHIEVEMENTS = [
  // ── بوابات ضعيفة ──
  { id: "weak_10", title: "أول دماء", desc: "أكمل 10 بوابات عادية/نخبة", icon: "🗡️", category: "weak", target: 10, tier: "bronze" },
  { id: "weak_50", title: "صياد محترف", desc: "أكمل 50 بوابة عادية/نخبة", icon: "⚔️", category: "weak", target: 50, tier: "silver" },
  { id: "weak_150", title: "سيد البوابات الصغرى", desc: "أكمل 150 بوابة عادية/نخبة", icon: "🛡️", category: "weak", target: 150, tier: "gold" },
  { id: "weak_500", title: "كابح العاديين", desc: "أكمل 500 بوابة عادية/نخبة", icon: "🏅", category: "weak", target: 500, tier: "legendary" },
  // ── بوابات قوية ──
  { id: "strong_5", title: "قاتل النخبة", desc: "أكمل 5 بوابات بوس/زنزانة", icon: "💀", category: "strong", target: 5, tier: "bronze" },
  { id: "strong_20", title: "مدمّر الزعماء", desc: "أكمل 20 بوابة بوس/زنزانة", icon: "🔥", category: "strong", target: 20, tier: "silver" },
  { id: "strong_75", title: "سيد الزنازين", desc: "أكمل 75 بوابة بوس/زنزانة", icon: "👑", category: "strong", target: 75, tier: "gold" },
  { id: "strong_200", title: "الند الوحيد لملك الدمار", desc: "أكمل 200 بوابة بوس/زنزانة", icon: "☠️", category: "strong", target: 200, tier: "legendary" },
  // ── مهام ──
  { id: "quests_100", title: "منجز المهام", desc: "أكمل 100 مهمة", icon: "📜", category: "quests", target: 100, tier: "silver" },
  { id: "quests_500", title: "أسطورة المهام", desc: "أكمل 500 مهمة", icon: "🏆", category: "quests", target: 500, tier: "legendary" },
  // ── لفل ──
  { id: "level_10", title: "أول خطوة في الظلام", desc: "وصلت للفل 10", icon: "⭐", category: "level", target: 10, tier: "bronze" },
  { id: "level_50", title: "ولادة S-RANK", desc: "وصلت للفل 50", icon: "🌟", category: "level", target: 50, tier: "gold" },
  { id: "level_100", title: "حاكم الظل", desc: "وصلت للفل 100", icon: "👑", category: "level", target: 100, tier: "legendary" },
  { id: "loot_sss_1", title: "اللمسة الذهبية", desc: "احصل على عنصر SSS لأول مرة", icon: "💎", category: "lootSSS", target: 1, tier: "legendary" },
  { id: "potions_50", title: "الصيدلاني الماهر", desc: "استخدم 50 جرعة شفاء", icon: "🧪", category: "potionsUsed", target: 50, tier: "silver" },
  // ── بوس العالم ──
  { id: "boss_1m_daily", title: "جلاد الزنزانة المزدوجة", desc: "أوصل إجمالي ضررك على بوس العالم لمليون نقطة في يوم واحد — يُعاد كل دورة بوس", icon: "⚔️", category: "bossDaily", target: 1000000, tier: "legendary" },
];

export function rankFromLevel(level) {
  if (level >= 5000) return { title: "[ ♾ ]-ABSOLUTE", color: "#ff0055", top: true };
  if (level >= 3000) return { title: "[ ❂ ]-SHADOW-OVERLORD", color: "#dc2626", top: true };
  if (level >= 2000) return { title: "[ ❂ ]-SHADOW-MONARCH", color: "#ef4444", top: true };
  if (level >= 1500) return { title: "[ ♛ ]-MONARCH-SUPREME", color: "#b45309", top: true };
  if (level >= 1000) return { title: "[ ♛ ]-MONARCH-GENERAL", color: "#d97706", top: true };
  if (level >= 500) return { title: "[ ★ ]-RULER-ELITE", color: "#f59e0b", top: true };
  if (level >= 80) return { title: "[ ★ ]-RULER", color: "#fbbf24", top: true };
  if (level >= 65) return { title: "S+-RANK", color: "#6d28d9", top: true };
  if (level >= 50) return { title: "S-RANK", color: "#7c3aed" };
  if (level >= 40) return { title: "A-RANK", color: "#a855f7" };
  if (level >= 30) return { title: "B-RANK", color: T.blue };
  if (level >= 20) return { title: "C-RANK", color: T.cyan };
  if (level >= 10) return { title: "D-RANK", color: "#38bdf8" };
  return { title: "E-RANK", color: "#9ca3af" };
}

// ─── LOOT ─────────────────────────────────────────────────────────────────────
export const TIERS = ["E", "D", "C", "B", "A", "S", "SS", "SSS"];

export const TIER_COLOR = {
  E: "#9ca3af",
  D: "#38bdf8",
  C: T.cyan,
  B: T.blue,
  A: "#a855f7",
  S: T.gold,
  SS: "#f59e0b",
  SSS: "#ff0055"
};

export const TIER_TOP = {
  S: true,
  SS: true,
  SSS: true
};

export const ITEM_POOL = {
  E: ["خنجر صدئ", "ناب غوبلن", "نواة حجرية", "حجر مكسور", "كيس جلد بالي"],
  D: ["سيف حديدي", "ناب ذئب", "نواة وحش صغير", "كوارتز شفاف", "حقيبة جلدية"],
  C: ["نصل فولاذي", "ناب أورك", "نواة الغابة", "شظية ياقوت", "كيس مدبوغ"],
  B: ["سيف الفارس", "مخلب وحش البرية", "نواة وحش", "جوهرة روبي", "حقيبة الصياد"],
  A: ["النصل الشيطاني", "مخلب ملكة النمل", "نواة القوة", "كريستالة زمردية", "كيس الحارس"],
  S: ["خنجر باروكا", "ناب كاساكا السام", "نواة روح الظلام", "جوهرة قلب التنين", "كيس الصياد الملكي"],
  SS: ["خنجر ملك الشياطين", "قاتل الفرسان", "نواة الهاوية", "كريستالة الظل", "حقيبة الظل"],
  SSS: ["نصل الحاكم الواحد", "مخلب الملك الظلي", "نواة سلطة الحاكم", "جوهرة السيادة", "كيس الملك المطلق"],
};

export const DAILY_WEIGHTS = { E: 45, D: 28, C: 15, B: 7, A: 3.2, S: 1.2, SS: 0.25, SSS: 0.05 };
export const GATE_WEIGHTS = { E: 8, D: 14, C: 18, B: 20, A: 18, S: 13, SS: 6, SSS: 3 };

// ─── GATE DIFFICULTY ──────────────────────────────────────────────────────────
export const GATE_DIFFICULTY = {
  // ── النظام القديم (مهام البوابات) ──
  NORMAL: { label: "NORMAL", color: T.cyan, hp: 100, exp: 120, stamina: 30, monsterDmg: [3, 8], dropChance: 0.50, weights: { E: 8, D: 14, C: 18, B: 20, A: 18, S: 13, SS: 6, SSS: 3 } },
  ELITE: { label: "ELITE", color: T.blue, hp: 220, exp: 220, stamina: 45, monsterDmg: [5, 12], dropChance: 0.62, weights: { E: 4, D: 9, C: 14, B: 18, A: 20, S: 18, SS: 11, SSS: 6 } },
  BOSS: { label: "BOSS", color: T.gold, hp: 400000, exp: 4000, stamina: 65, monsterDmg: [80, 90], dropChance: 0.75, weights: { E: 1, D: 4, C: 8, B: 14, A: 18, S: 22, SS: 20, SSS: 13 } },
  DUNGEON: { label: "DUNGEON", color: T.purple, hp: 650, exp: 60000000, stamina: 80, monsterDmg: [10, 22], dropChance: 0.90, weights: { E: 0.5, D: 1.5, C: 4, B: 9, A: 15, S: 22, SS: 25, SSS: 23 } },
  DESTRUCTION_KING: {
    label: "👑 DESTRUCTION KING",
    color: "#ff003c",
    hp: 150000,
    exp: 500000000,
    stamina: 85,
    monsterDmg: [400, 450],
    dropChance: 0.99,
    weights: { E: 0, D: 0, C: 0, B: 0, A: 0, S: 0, SS: 10, SSS: 90 }
  },
  // ── النظام الجديد (بوابات الرانك من GatesPage) ──
  E_RANK: { label: "بوابة E", color: "#4ade80", hp: 100, exp: 100, stamina: 25, monsterDmg: [2, 6],    dropChance: 0.40, weights: { E: 30, D: 25, C: 18, B: 12, A: 8,   S: 4,  SS: 2,    SSS: 1   } },
  D_RANK: { label: "بوابة D", color: "#38bdf8", hp: 200, exp: 200, stamina: 35, monsterDmg: [4, 10],   dropChance: 0.50, weights: { E: 15, D: 22, C: 22, B: 18, A: 12,  S: 7,  SS: 3,    SSS: 1   } },
  C_RANK: { label: "بوابة C", color: "#facc15", hp: 400, exp: 450, stamina: 45, monsterDmg: [7, 15],   dropChance: 0.60, weights: { E: 6,  D: 12, C: 20, B: 22, A: 18,  S: 12, SS: 7,    SSS: 3   } },
  B_RANK: { label: "بوابة B", color: "#f97316", hp: 800, exp: 1200, stamina: 55, monsterDmg: [15, 28],  dropChance: 0.70, weights: { E: 2,  D: 5,  C: 12, B: 20, A: 24,  S: 20, SS: 12,   SSS: 5   } },
  A_RANK: { label: "بوابة A", color: "#a855f7", hp: 1800, exp: 4000, stamina: 65, monsterDmg: [30, 55], dropChance: 0.80, weights: { E: 0.5,D: 2,  C: 5,  B: 12, A: 22,  S: 28, SS: 20,   SSS: 10.5} },
  S_RANK: { label: "بوابة S", color: "#7c3aed", hp: 5000, exp: 15000, stamina: 75, monsterDmg: [70, 120],dropChance: 0.90, weights: { E: 0,  D: 0.5,C: 2,  B: 6,  A: 15,  S: 28, SS: 30,   SSS: 18.5} },
  RED_GATE: { label: "البوابة الحمراء", color: "#ff003c", hp: 15000, exp: 80000, stamina: 90, monsterDmg: [200, 380], dropChance: 0.99, weights: { E: 0, D: 0, C: 0, B: 0.5, A: 3, S: 12, SS: 35, SSS: 49.5 } },
};

// ─── SHADOW SOLDIERS ──────────────────────────────────────────────────────────
export const SHADOW_EXTRACT = {
  BOSS: { chance: 0.25, statBase: 6, label: "نخبة" },
  DUNGEON: { chance: 0.35, statBase: 12, label: "خطير" },
  DESTRUCTION_KING: { chance: 0.70, statBase: 30, label: "أسطوري" },
};

export const SHADOW_TIER_COLOR = {
  BOSS: T.gold,
  DUNGEON: T.purple,
  DESTRUCTION_KING: "#ff003c",
};

export const SHADOW_MAX_DEPLOYED = 3;
export const SHADOW_LEVEL_GROWTH = 2;
export const SHADOW_EXP_PER_BATTLE = 12;
export const SHADOW_DUPLICATE_EXP = 40;

// الحد الأقصى للمستوى: 20 للجنود العاديين، 30 للخاصين بعد التحول بالكرستال
export const SHADOW_MAX_LEVEL = 20;
export const SHADOW_SPECIAL_MAX_LEVEL = 30;

// أسماء الجنود الخاصة (أسطوريون — لا يحصلون على buffStats العشوائية + ذهب تعويض أعلى)
export const SHADOW_SPECIAL_NAMES = [
  "بيليون — قائد جيش الظل الأعظم",
  "أنتاريس، ملك الدمار",
  "كاساكا ملك الثعابين",
  "بيرو - أقوى جندي نمل قبل الاستخراج",
  "إيغريس - القائد الأحمر الدموي",
];

// بركة جنود الظل لكل نوع بوابة — الـ chance تراكمية (cumulative pool)
export const SHADOW_POOLS = {
  BOSS: [
    { name: "إيغريس - القائد الأحمر الدموي", chance: 0.30 },
    { name: "تانك - القائد الأزرق الفولاذي", chance: 0.25 },
    { name: "آيرون - قائد الفرسان الحديدي", chance: 0.22 },
    { name: "باروكا حامل الخنجر الملعون", chance: 0.15 },
    { name: "كاماش الصغير", chance: 0.08 },
  ],
  DUNGEON: [
    { name: "كاساكا ملك الثعابين", chance: 0.25 },
    { name: "بيرو - أقوى جندي نمل قبل الاستخراج", chance: 0.20 },
    { name: "يوغومنت ملك الجن الجليدي", chance: 0.22 },
    { name: "ملكة النمل الحمراء", chance: 0.20 },
    { name: "فارس الموت الجليدي", chance: 0.13 },
  ],
  DESTRUCTION_KING: [
    { name: "أنتاريس، ملك الدمار", chance: 0.70 },
  ],
  S_RANK: [
    { name: "بيليون — قائد جيش الظل الأعظم", chance: 0.15 },
  ],
};

// كرستال الظل — ينزل من S_RANK بنسبة 5% (roll منفصل عن roll الجندي)
export const SHADOW_CRYSTAL_CHANCE = 0.05;

export function shadowExpToNext(level) {
  return 20 + level * 15;
}

// إحصائيات الجندي — بيليون لديه معادلة خاصة: LV1=250 · LV10=2500 · LV20=5000
export function shadowStatsBuff(soldier) {
  const name = soldier.name || "";
  const level = soldier.level || 1;
  if (name.includes("بيليون")) {
    const per = level * 250;
    return { STR: per, AGI: per, VIT: per, INT: per, SENSE: per };
  }
  const cfg = SHADOW_EXTRACT[soldier.tier] || { statBase: 4 };
  const per = cfg.statBase + level * SHADOW_LEVEL_GROWTH;
  return { STR: per, AGI: per, VIT: per, INT: per, SENSE: per };
}

export function itemShapeType(name) {
  if (/سيف|خنجر|نصل/.test(name)) return "weapon";
  if (/ناب|مخلب|قاتل/.test(name)) return "claw";
  if (/نواة/.test(name)) return "orb";
  if (/كيس|حقيبة/.test(name)) return "pouch";
  return "gem";
}

export const SLOT_STAT = { weapon: "STR", claw: "AGI", orb: "VIT", gem: "INT", pouch: "SENSE" };
export const SLOT_LABEL = { weapon: "سلاح", claw: "مخلب", orb: "نواة", gem: "جوهرة", pouch: "كيس" };
export const SLOT_ORDER = ["weapon", "claw", "orb", "gem", "pouch"];

export function tierBonusValue(tier) {
  return (TIERS.indexOf(tier) + 1) * 2;
}

export const UPGRADE_MAX_LEVEL = 10;
export function upgradeCost(level) {
  return level + 2;
}

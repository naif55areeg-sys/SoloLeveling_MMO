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
  { title: "E-RANK", min: 1, color: "#9ca3af" },               // رمادي (عادي جداً)
  { title: "D-RANK", min: 10, color: "#38bdf8" },              // أزرق فاتح
  { title: "C-RANK", min: 20, color: T.cyan },                 // سيان
  { title: "B-RANK", min: 30, color: T.blue },                 // أزرق عميق
  { title: "A-RANK", min: 40, color: "#a855f7" },              // بنفسجي
  { title: "S-RANK", min: 50, color: "#7c3aed" },              // بنفسجي غامق (قوة السحر)
  { title: "S+-RANK", min: 65, color: "#6d28d9", top: true },  // مائل للظلال
  { title: "[ ★ ]-RULER", min: 80, color: "#fbbf24", top: true },        // ذهبي
  { title: "[ ★ ]-RULER-ELITE", min: 500, color: "#f59e0b", top: true },  // ذهبي داكن
  { title: "[ ♛ ]-MONARCH-GENERAL", min: 1000, color: "#d97706", top: true }, // ذهبي ملكي
  { title: "[ ♛ ]-MONARCH-SUPREME", min: 1500, color: "#b45309", top: true }, // ذهبي أسطوري
  { title: "[ ❂ ]-SHADOW-MONARCH", min: 2000, color: "#ef4444", top: true },  // بداية الأحمر الفخم
  { title: "[ ❂ ]-SHADOW-OVERLORD", min: 3000, color: "#dc2626", top: true }, // أحمر غامق متوهج
  { title: "[ ♾ ]-ABSOLUTE", min: 5000, color: "#ff0055", top: true },       // الأحمر المطلق المدمر (أعلى لفل)
];

// ─── RANK SKILLS — مهارة نشطة واحدة لكل رتبة، تُستخدم مرة كل يوم ───────────────
export const RANK_SKILLS = {
  "E-RANK": { name: "ضربة بدائية", multiplier: 1.3, desc: "تزيد ضرر ضربتك القادمة 30%" },
  "D-RANK": { name: "خطوة الصياد", multiplier: 1.4, desc: "تزيد ضرر ضربتك القادمة 40%" },
  "C-RANK": { name: "تركيز الحواس", multiplier: 1.5, desc: "تزيد ضرر ضربتك القادمة 50%" },
  "B-RANK": { name: "ثوران القوة", multiplier: 1.7, desc: "تزيد ضرر ضربتك القادمة 70%" },
  "A-RANK": { name: "نبضة السحر الأرجواني", multiplier: 1.9, desc: "تزيد ضرر ضربتك القادمة 90%" },
  "S-RANK": { name: "ضربة الظل", multiplier: 2.0, desc: "تضاعف ضرر ضربتك القادمة بالكامل" },
  "S+-RANK": { name: "سلطة ملك الظلال", multiplier: 2.5, desc: "ضرر ضربتك القادمة × 2.5" },
};

// ─── ACHIEVEMENTS — إنجازات فخمة بدرجات (برونزي → أسطوري) ──────────────────────
export const ACHIEVEMENT_TIERS = {
  bronze: { color: "#cd7f32", label: "برونزي" },
  silver: { color: "#c0c0c0", label: "فضي" },
  gold: { color: "#fbbf24", label: "ذهبي" },
  legendary: { color: "#ff0055", label: "أسطوري" },
};

export const ACHIEVEMENTS = [
  // ── بوابات ضعيفة (NORMAL + ELITE) ──
  { id: "weak_10", title: "أول دماء", desc: "أكمل 10 بوابات عادية/نخبة", icon: "🗡️", category: "weak", target: 10, tier: "bronze" },
  { id: "weak_50", title: "صياد محترف", desc: "أكمل 50 بوابة عادية/نخبة", icon: "⚔️", category: "weak", target: 50, tier: "silver" },
  { id: "weak_150", title: "سيد البوابات الصغرى", desc: "أكمل 150 بوابة عادية/نخبة", icon: "🛡️", category: "weak", target: 150, tier: "gold" },
  { id: "weak_500", title: "كابح العاديين", desc: "أكمل 500 بوابة عادية/نخبة", icon: "🏅", category: "weak", target: 500, tier: "legendary" },

  // ── بوابات قوية (BOSS + DUNGEON + DESTRUCTION_KING) ──
  { id: "strong_5", title: "قاتل النخبة", desc: "أكمل 5 بوابات بوس/زنزانة", icon: "💀", category: "strong", target: 5, tier: "bronze" },
  { id: "strong_20", title: "مدمّر الزعماء", desc: "أكمل 20 بوابة بوس/زنزانة", icon: "🔥", category: "strong", target: 20, tier: "silver" },
  { id: "strong_75", title: "سيد الزنازين", desc: "أكمل 75 بوابة بوس/زنزانة", icon: "👑", category: "strong", target: 75, tier: "gold" },
  { id: "strong_200", title: "الند الوحيد لملك الدمار", desc: "أكمل 200 بوابة بوس/زنزانة", icon: "☠️", category: "strong", target: 200, tier: "legendary" },
  // ── إكمال المهام ──
  { id: "quests_100", title: "منجز المهام", desc: "أكمل 100 مهمة", icon: "📜", category: "quests", target: 100, tier: "silver" },
  { id: "quests_500", title: "أسطورة المهام", desc: "أكمل 500 مهمة", icon: "🏆", category: "quests", target: 500, tier: "legendary" },
  // ── إنجازات عامة ──
  { id: "level_10", title: "أول خطوة في الظلام", desc: "وصلت للفل 10", icon: "⭐", category: "level", target: 10, tier: "bronze" },
  { id: "level_50", title: "ولادة S-RANK", desc: "وصلت للفل 50", icon: "🌟", category: "level", target: 50, tier: "gold" },
  { id: "level_100", title: "حاكم الظل", desc: "وصلت للفل 100", icon: "👑", category: "level", target: 100, tier: "legendary" },
  { id: "loot_sss_1", title: "اللمسة الذهبية", desc: "احصل على عنصر SSS لأول مرة", icon: "💎", category: "lootSSS", target: 1, tier: "legendary" },
  { id: "potions_50", title: "الصيدلاني الماهر", desc: "استخدم 50 جرعة شفاء", icon: "🧪", category: "potionsUsed", target: 50, tier: "silver" },
];

export function rankFromLevel(level) {
  // الترتيب التنازلي الصحيح من الأعلى للأقل لضمان عمل الشروط بدقة
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
  E: "#9ca3af",   // رمادي
  D: "#38bdf8",   // أزرق فاتح
  C: T.cyan,      // سيان
  B: T.blue,      // أزرق عميق
  A: "#a855f7",   // بنفسجي
  S: T.gold,      // ذهبي ملكي
  SS: "#f59e0b",  // ذهبي أسطوري متوهج
  SSS: "#ff0055"  // أحمر تدميري مطلق (أعلى ندرة سلاح)
};

export const TIER_TOP = {
  S: true,       // جعلنا الـ S توب لأنها بداية درجات الذهبي الفخم
  SS: true,
  SSS: true
};
// كل مستوى فيه 5 عناصر — واحد من كل خانة تجهيز:
// weapon (STR) · claw (AGI) · orb (VIT) · gem (INT) · pouch (SENSE)
export const ITEM_POOL = {
  E: [
    "خنجر صدئ",        // weapon  → STR
    "ناب غوبلن",        // claw    → AGI
    "نواة حجرية",       // orb     → VIT
    "حجر مكسور",        // gem     → INT
    "كيس جلد بالي",     // pouch   → SENSE
  ],
  D: [
    "سيف حديدي",        // weapon
    "ناب ذئب",          // claw
    "نواة وحش صغير",    // orb
    "كوارتز شفاف",      // gem
    "حقيبة جلدية",      // pouch
  ],
  C: [
    "نصل فولاذي",       // weapon
    "ناب أورك",         // claw
    "نواة الغابة",      // orb
    "شظية ياقوت",       // gem
    "كيس مدبوغ",        // pouch
  ],
  B: [
    "سيف الفارس",       // weapon
    "مخلب وحش البرية",  // claw
    "نواة وحش",         // orb
    "جوهرة روبي",       // gem
    "حقيبة الصياد",     // pouch
  ],
  A: [
    "النصل الشيطاني",   // weapon
    "مخلب ملكة النمل",  // claw
    "نواة القوة",       // orb
    "كريستالة زمردية",  // gem
    "كيس الحارس",       // pouch
  ],
  S: [
    "خنجر باروكا",      // weapon
    "ناب كاساكا السام", // claw
    "نواة روح الظلام",  // orb
    "جوهرة قلب التنين", // gem
    "كيس الصياد الملكي",// pouch
  ],
  SS: [
    "خنجر ملك الشياطين",// weapon
    "قاتل الفرسان",     // claw
    "نواة الهاوية",     // orb
    "كريستالة الظل",    // gem
    "حقيبة الظل",       // pouch
  ],
  SSS: [
    "نصل الحاكم الواحد",  // weapon
    "مخلب الملك الظلي",   // claw
    "نواة سلطة الحاكم",   // orb
    "جوهرة السيادة",      // gem
    "كيس الملك المطلق",   // pouch
  ],
};

export const DAILY_WEIGHTS = { E: 45, D: 28, C: 15, B: 7, A: 3.2, S: 1.2, SS: 0.25, SSS: 0.05 };
export const GATE_WEIGHTS = { E: 8, D: 14, C: 18, B: 20, A: 18, S: 13, SS: 6, SSS: 3 };

// ─── GATE DIFFICULTY ──────────────────────────────────────────────────────────
export const GATE_DIFFICULTY = {
  NORMAL: { label: "NORMAL", color: T.cyan, hp: 100, exp: 120, stamina: 30, monsterDmg: [3, 8], dropChance: 0.50, weights: { E: 8, D: 14, C: 18, B: 20, A: 18, S: 13, SS: 6, SSS: 3 } },
  ELITE: { label: "ELITE", color: T.blue, hp: 220, exp: 220, stamina: 45, monsterDmg: [5, 12], dropChance: 0.62, weights: { E: 4, D: 9, C: 14, B: 18, A: 20, S: 18, SS: 11, SSS: 6 } },
  BOSS: { label: "BOSS", color: T.gold, hp: 400000, exp: 4000, stamina: 65, monsterDmg: [80, 90], dropChance: 0.75, weights: { E: 1, D: 4, C: 8, B: 14, A: 18, S: 22, SS: 20, SSS: 13 } },
  DUNGEON: { label: "DUNGEON", color: T.purple, hp: 650, exp: 60000000, stamina: 80, monsterDmg: [10, 22], dropChance: 0.90, weights: { E: 0.5, D: 1.5, C: 4, B: 9, A: 15, S: 22, SS: 25, SSS: 23 } },

  // 👑 بوابة ملك الدمار الأسطورية (المستحيلة) 💀
  DESTRUCTION_KING: {
    label: "👑 DESTRUCTION KING",
    color: "#ff003c",            // لون أحمر دمي مميز للرتبة
    hp: 150000,                  // صحة مرعبة (150 ألف) تحتاج لآلاف الضربات لتصفيرها
    exp: 500000000,              // نقاط خبرة فلكية (نصف مليار) لمن يستطيع تدميره
    stamina: 85,                 // تستهلك الستامينا شبه كاملة (95 نقطة) بمجرد الدخول
    monsterDmg: [400, 450],      // ضرر فتاك يقتل الـ Hunter من ضربة واحدة إذا لم يكن مستعداً
    dropChance: 0.99,            // لوت مضمون بنسبة 99%
    weights: { E: 0, D: 0, C: 0, B: 0, A: 0, S: 0, SS: 10, SSS: 90 } // يسقط فقط لوت أسطوري SSS و SS
  },
};

// ─── SHADOW SOLDIERS ──────────────────────────────────────────────────────────
// نظام جنود الظل: بعد هزيمة بوس قوي (BOSS/DUNGEON/DESTRUCTION_KING) فيه فرصة
// "تُحيي" الوحش كجندي ظل يرافقك ويعطيك إحصائيات إضافية. كل ما استخدمته بالمعارك
// (وهو مُجهّز بخانات النشر) يكسب خبرة ويقوى أكثر.
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

export const SHADOW_MAX_DEPLOYED = 3;     // أقصى عدد جنود ظل يمكن نشرهم بنفس الوقت
export const SHADOW_LEVEL_GROWTH = 2;     // كل لفل يزيد +2 لكل إحصائية
export const SHADOW_EXP_PER_BATTLE = 12;  // خبرة الجندي المنشور عن كل معركة منتصرة
export const SHADOW_DUPLICATE_EXP = 40;   // خبرة إضافية إذا استخرجت نفس الوحش مرة ثانية

export function shadowExpToNext(level) {
  return 20 + level * 15;
}

// إحصائيات الجندي الحالية (تُحسب من رتبته + لفله، بدون تخزين أرقام ثابتة)
export function shadowStatsBuff(soldier) {
  const cfg = SHADOW_EXTRACT[soldier.tier] || { statBase: 4 };
  const per = cfg.statBase + (soldier.level || 1) * SHADOW_LEVEL_GROWTH;
  return { STR: per, AGI: per, VIT: per, INT: per, SENSE: per };
}


// الكلمات المفتاحية لكل نوع — weapon · claw · orb · gem · pouch
export function itemShapeType(name) {
  if (/سيف|خنجر|نصل/.test(name)) return "weapon";
  if (/ناب|مخلب|قاتل/.test(name)) return "claw";
  if (/نواة/.test(name)) return "orb";
  if (/كيس|حقيبة/.test(name)) return "pouch";
  return "gem"; // جوهرة، حجر، كريستالة، شظية
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

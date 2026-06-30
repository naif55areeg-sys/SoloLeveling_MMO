import express from "express";
import {
  upsertPlayer, getLeaderboard, getPlayer,
  getActiveBoss, spawnBoss, damageBoss, getBossDamageRanking,
  distributeBossRewards, getDailyBossDamage, forceKillBoss,
  fightPvP, getPvPHistory, calcPower, getBossAttacksToday,
  getDb
} from "../db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();

const BOSS_MAX_ATTACKS_PER_DAY = 10;

const BOSS_NAMES = [
  "ملك الظلام المستيقظ",
  "أمير الهاوية الأبدي",
  "حارس الزنزانة المزدوجة",
  "سيد الأعماق المحظورة",
];

const BOSS_MAX_HP = 10_000_000;

let activeBossScheduled = false;

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
router.get("/leaderboard", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const rows = await getLeaderboard(limit);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── ME ───────────────────────────────────────────────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
  try {
    const player = await getPlayer(req.user.discord_id);
    res.json(player || null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── SYNC ─────────────────────────────────────────────────────────────────────
router.post("/sync", requireAuth, async (req, res) => {
  try {
    const {
      level, exp, str, agi, vit, intl, sense,
      unlocked_achievements, gate_stats, sss_loot_count, potions_used,
      equipped, inventory
    } = req.body;
    if (!level) return res.status(400).json({ error: "missing_data" });

    const power = await upsertPlayer({
      discord_id: req.user.discord_id,
      username: req.user.username,
      avatar: req.user.avatar || null,
      level, exp: exp || 0,
      str: str || 10, agi: agi || 10, vit: vit || 10,
      intl: intl || 10, sense: sense || 10,
      unlocked_achievements: unlocked_achievements || null,
      gate_stats: gate_stats || null,
      sss_loot_count: sss_loot_count ?? null,
      potions_used: potions_used ?? null,
      equipped: equipped || null,
      inventory: inventory || null,
    });
    res.json({ ok: true, power });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── PLAYER PUBLIC PROFILE ────────────────────────────────────────────────────
router.get("/player/:discord_id", async (req, res) => {
  try {
    const { discord_id } = req.params;
    const player = await getPlayer(discord_id);
    if (!player) return res.status(404).json({ error: "لاعب غير موجود" });

    const parse = (v, fallback) => {
      try { return typeof v === "string" ? JSON.parse(v) : v ?? fallback; }
      catch { return fallback; }
    };

    res.json({
      discord_id: player.discord_id,
      username: player.username,
      avatar: player.avatar,
      level: player.level,
      exp: player.exp,
      power: player.power,
      season_points: player.season_points,
      str: player.str,
      agi: player.agi,
      vit: player.vit,
      intl: player.intl,
      sense: player.sense,
      unlocked_achievements: parse(player.unlocked_achievements, []),
      gate_stats: parse(player.gate_stats, {}),
      equipped: parse(player.equipped, {}),
      inventory: parse(player.inventory, []),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

// ─── WORLD BOSS ───────────────────────────────────────────────────────────────
router.get("/boss", async (req, res) => {
  try {
    const boss = await getActiveBoss();
    if (!boss) return res.json({ boss: null });
    const ranking = await getBossDamageRanking(boss.id);

    let attacks_today = 0;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const jwt = await import("jsonwebtoken");
        const decoded = jwt.default.verify(authHeader.replace("Bearer ", ""), process.env.JWT_SECRET);
        attacks_today = await getBossAttacksToday(boss.id, decoded.discord_id);
      } catch { }
    }

    res.json({ boss, ranking, attacks_today, max_attacks: BOSS_MAX_ATTACKS_PER_DAY });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/boss/attack", requireAuth, async (req, res) => {
  try {
    const { str, level } = req.body;
    const boss = await getActiveBoss();
    if (!boss) return res.status(404).json({ error: "no_active_boss" });
    if (boss.is_dead) return res.status(400).json({ error: "boss_already_dead" });

    const attacksToday = await getBossAttacksToday(boss.id, req.user.discord_id);
    if (attacksToday >= BOSS_MAX_ATTACKS_PER_DAY) {
      return res.status(429).json({
        error: "daily_limit_reached",
        attacks_today: attacksToday,
        max_attacks: BOSS_MAX_ATTACKS_PER_DAY,
        message: "وصلت الحد اليومي",
      });
    }

    // ── معادلة الضرر الجديدة مع كريت 15% ──
    const base = (str || 10) * 8 + (level || 1) * 5;
    const variance = 0.85 + Math.random() * 0.3;
    const isCrit = Math.random() < 0.15;
    const damage = Math.floor(base * variance * (isCrit ? 2.5 : 1));

    const result = await damageBoss(boss.id, req.user.discord_id, req.user.username, damage);

    // ── موت البوس → توزيع مكافآت + ريسبون بعد ساعة ──
    let rewards = [];
    let respawn_at = null;
    if (result?.is_dead) {
      rewards = await distributeBossRewards(boss.id);
      respawn_at = Date.now() + 60 * 60 * 1000; // ساعة واحد
      const respawnName = BOSS_NAMES[Math.floor(Math.random() * BOSS_NAMES.length)];
      setTimeout(async () => {
        try {
          await spawnBoss({ name: respawnName, max_hp: BOSS_MAX_HP, reward_exp: 5000000, starts_at: respawn_at });
        } catch (e) { console.error('Boss respawn error:', e); }
      }, 100);
    }

    // إجمالي ضرر اليوم (للإنجاز)
    const daily_damage = await getDailyBossDamage(boss.id, req.user.discord_id);

    res.json({
      ok: true, damage, is_crit: isCrit,
      attacks_today: attacksToday + 1,
      max_attacks: BOSS_MAX_ATTACKS_PER_DAY,
      attacks_remaining: BOSS_MAX_ATTACKS_PER_DAY - (attacksToday + 1),
      rewards, respawn_at, daily_damage,
      ...result,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/boss/spawn", requireAuth, async (req, res) => {
  try {
    const { name, max_hp, reward_exp, reward_desc, starts_at } = req.body;
    const id = await spawnBoss({
      name: name || "وحش الظلام",
      max_hp: max_hp || BOSS_MAX_HP,
      reward_exp: reward_exp || 5000000,
      reward_desc,
      starts_at: starts_at || null,
    });
    res.json({ ok: true, boss_id: id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── BOSS SCHEDULER ──────────────────────────────────────────────────────────────
export let activeBroadcast = null;

export function initBossScheduler() {
  if (activeBossScheduled) return;
  activeBossScheduled = true;

  const SAUDI_OFFSET = 3 * 60 * 60 * 1000;
  let lastWarnDay = -1;
  let lastResetDay = -1;

  setInterval(async () => {
    const now = new Date();
    const saudiNow = new Date(now.getTime() + SAUDI_OFFSET);
    const sH = saudiNow.getUTCHours();
    const sM = saudiNow.getUTCMinutes();
    const sDay = saudiNow.getUTCDate();

    // تحذير 11:30م سعودي → قبل نصف ساعة من الريست
    if (sH === 23 && sM === 30 && sDay !== lastWarnDay) {
      lastWarnDay = sDay;
      activeBroadcast = {
        message: "⚠️ تحذير! ستُغلق بوابة الزنزانة المزدوجة و يتجدد البوس في خلال 30 دقيقة!",
        type: "warning",
        sender: "النظام",
        sentAt: Date.now(),
        updated_at: Date.now(),
        expiresAt: Date.now() + 35 * 60 * 1000,
      };
      console.log('⚠️  تحذير البوس أرسل لكل اللاعبين');
    }

    // ريست 12:00 صباحاً سعودي
    if (sH === 0 && sM === 0 && sDay !== lastResetDay) {
      lastResetDay = sDay;
      try {
        const boss = await getActiveBoss();
        if (boss && boss.status === 'active') {
          await forceKillBoss(boss.id);
          console.log('🔄 ريست البوس منتصف الليل');
        }
        const name = BOSS_NAMES[sDay % BOSS_NAMES.length];
        const startsAt = Date.now() + 60 * 60 * 1000; // ساعة بعد الريست
        await spawnBoss({ name, max_hp: BOSS_MAX_HP, reward_exp: 5000000, starts_at: startsAt });
        console.log(`✅ بوس جديد جدول: ${name}`);
      } catch (e) {
        console.error('خطأ ريست البوس:', e);
      }
    }
  }, 60000); // فحص كل دقيقة
}

// ─── PVP ──────────────────────────────────────────────────────────────────────
router.post("/pvp/challenge", requireAuth, async (req, res) => {
  try {
    const { defender_id } = req.body;
    if (!defender_id) return res.status(400).json({ error: "missing_defender_id" });
    if (defender_id === req.user.discord_id) return res.status(400).json({ error: "cant_fight_yourself" });

    const result = await fightPvP(req.user.discord_id, defender_id);
    if (!result) return res.status(404).json({ error: "player_not_found" });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/pvp/history", requireAuth, async (req, res) => {
  try {
    const history = await getPvPHistory(req.user.discord_id);
    res.json(history);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ─── BROADCAST ────────────────────────────────────────────────────────────────
let activeBroadcast = null;

router.get("/broadcast", (req, res) => {
  if (!activeBroadcast) return res.json(null);
  if (Date.now() > activeBroadcast.expiresAt) {
    activeBroadcast = null;
    return res.json(null);
  }
  res.json(activeBroadcast);
});

router.post("/broadcast", requireAuth, async (req, res) => {
  try {
    const { message, type = "info", duration = 30 } = req.body;
    if (!message) return res.status(400).json({ error: "الرسالة مطلوبة" });
    const now = Date.now();

    // لو takeover، الرسالة ممكن تكون JSON فيها videoUrl + overlayText
    let parsedMessage = message;
    let videoUrl = null;
    let overlayText = null;
    if (type === "takeover") {
      try {
        const parsed = JSON.parse(message);
        videoUrl    = parsed.videoUrl    || message;
        overlayText = parsed.overlayText || "";
        parsedMessage = videoUrl;
      } catch {
        videoUrl = message;
      }
    }

    activeBroadcast = {
      message:    parsedMessage,
      videoUrl,
      overlayText,
      type,
      sender:     req.user.username,
      sentAt:     now,
      updated_at: now,
      expiresAt:  now + duration * 60 * 1000,
    };
    res.json({ ok: true, broadcast: activeBroadcast });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── ADMIN: جلب لاعب ──────────────────────────────────────────────────────────
router.get("/admin/player/:discord_id", requireAuth, async (req, res) => {
  try {
    const ADMIN_IDS = (process.env.ADMIN_DISCORD_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
    if (!ADMIN_IDS.includes(req.user.discord_id))
      return res.status(403).json({ error: "غير مصرح" });

    const player = await getPlayer(req.params.discord_id);
    if (!player) return res.status(404).json({ error: "لاعب غير موجود" });

    const parse = (v, fb) => { try { return typeof v === "string" ? JSON.parse(v) : v ?? fb; } catch { return fb; } };
    res.json({
      discord_id: player.discord_id,
      username:   player.username,
      avatar:     player.avatar,
      level:      player.level,
      exp:        player.exp,
      power:      player.power,
      str: player.str, agi: player.agi, vit: player.vit,
      intl: player.intl, sense: player.sense,
      equipped:  parse(player.equipped, {}),
      inventory: parse(player.inventory, []),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── ADMIN: تعديل لاعب ────────────────────────────────────────────────────────
router.post("/admin/edit-player", requireAuth, async (req, res) => {
  try {
    const ADMIN_IDS = (process.env.ADMIN_DISCORD_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
    if (!ADMIN_IDS.includes(req.user.discord_id))
      return res.status(403).json({ error: "غير مصرح" });

    const { discord_id, level, exp, str, agi, vit, intl, sense } = req.body;
    if (!discord_id) return res.status(400).json({ error: "discord_id مطلوب" });

    const player = await getPlayer(discord_id);
    if (!player) return res.status(404).json({ error: "لاعب غير موجود" });

    const power = await upsertPlayer({
      discord_id,
      username: player.username,
      avatar:   player.avatar,
      level:    level  ?? player.level,
      exp:      exp    ?? player.exp,
      str:      str    ?? player.str,
      agi:      agi    ?? player.agi,
      vit:      vit    ?? player.vit,
      intl:     intl   ?? player.intl,
      sense:    sense  ?? player.sense,
    });

    res.json({ ok: true, power, message: `تم تحديث ${player.username}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

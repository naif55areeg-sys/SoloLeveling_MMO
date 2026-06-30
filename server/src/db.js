import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

// الاتصال بالقاعدة السحابية عن طريق رابط الـ Connection String الذي سنحصل عليه
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // مطلوب لتأمين الاتصال مع السيرفرات السحابية مثل Supabase او Neon
  }
});

let tablesInitialized = false;

export async function getDb() {
  if (!tablesInitialized) {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS players (
          discord_id TEXT PRIMARY KEY,
          username TEXT NOT NULL,
          avatar TEXT,
          level INTEGER DEFAULT 1,
          exp BIGINT DEFAULT 0,
          str INTEGER DEFAULT 10,
          agi INTEGER DEFAULT 10,
          vit INTEGER DEFAULT 10,
          intl INTEGER DEFAULT 10,
          sense INTEGER DEFAULT 10,
          power INTEGER DEFAULT 0,
          guild_id INTEGER,
          season_points INTEGER DEFAULT 0,
          unlocked_achievements TEXT DEFAULT '[]',
          gate_stats TEXT DEFAULT '{}',
          sss_loot_count INTEGER DEFAULT 0,
          potions_used INTEGER DEFAULT 0,
          equipped TEXT DEFAULT '{}',
          inventory TEXT DEFAULT '[]',
          created_at BIGINT,
          updated_at BIGINT
        );

        ALTER TABLE players ADD COLUMN IF NOT EXISTS unlocked_achievements TEXT DEFAULT '[]';
        ALTER TABLE players ADD COLUMN IF NOT EXISTS gate_stats TEXT DEFAULT '{}';
        ALTER TABLE players ADD COLUMN IF NOT EXISTS sss_loot_count INTEGER DEFAULT 0;
        ALTER TABLE players ADD COLUMN IF NOT EXISTS potions_used INTEGER DEFAULT 0;
        ALTER TABLE players ADD COLUMN IF NOT EXISTS equipped TEXT DEFAULT '{}';
        ALTER TABLE players ADD COLUMN IF NOT EXISTS inventory TEXT DEFAULT '[]';
        ALTER TABLE players ALTER COLUMN exp TYPE BIGINT USING exp::bigint;

        CREATE TABLE IF NOT EXISTS world_boss (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          max_hp INTEGER NOT NULL,
          current_hp INTEGER NOT NULL,
          reward_exp INTEGER NOT NULL,
          reward_desc TEXT,
          starts_at BIGINT NOT NULL,
          ends_at BIGINT NOT NULL,
          is_dead INTEGER DEFAULT 0
        );

        ALTER TABLE world_boss ADD COLUMN IF NOT EXISTS is_dead INTEGER DEFAULT 0;
        ALTER TABLE world_boss ADD COLUMN IF NOT EXISTS starts_at BIGINT DEFAULT 0;

        CREATE TABLE IF NOT EXISTS boss_damage_log (
          id SERIAL PRIMARY KEY,
          boss_id INTEGER NOT NULL,
          discord_id TEXT NOT NULL,
          username TEXT NOT NULL,
          damage BIGINT NOT NULL,
          dealt_at BIGINT NOT NULL
        );

        ALTER TABLE boss_damage_log ALTER COLUMN damage TYPE BIGINT USING damage::bigint;

        CREATE TABLE IF NOT EXISTS pvp_matches (
          id SERIAL PRIMARY KEY,
          challenger_id TEXT NOT NULL,
          defender_id TEXT NOT NULL,
          winner_id TEXT,
          challenger_power INTEGER,
          defender_power INTEGER,
          fought_at BIGINT NOT NULL
        );
      `);
      tablesInitialized = true;
    } finally {
      client.release();
    }
  }
  return pool;
}

export function calcPower(p) {
  return (p.level * 50 + p.str * 4 + p.agi * 3 + p.vit * 3 + p.intl * 4 + p.sense * 2);
}

export async function upsertPlayer(p) {
  const db = await getDb();
  const now = Date.now();
  const power = calcPower(p);

  const existingRes = await db.query("SELECT discord_id FROM players WHERE discord_id = $1", [p.discord_id]);

  if (existingRes.rows.length > 0) {
    await db.query(
      `UPDATE players SET
        username=$1, avatar=$2, level=$3, exp=$4,
        str=$5, agi=$6, vit=$7, intl=$8, sense=$9,
        power=$10, updated_at=$11,
        unlocked_achievements=COALESCE($12, unlocked_achievements),
        gate_stats=COALESCE($13, gate_stats),
        sss_loot_count=COALESCE($14, sss_loot_count),
        potions_used=COALESCE($15, potions_used),
        equipped=COALESCE($16, equipped),
        inventory=COALESCE($17, inventory)
      WHERE discord_id=$18`,
      [
        p.username, p.avatar, p.level, p.exp,
        p.str, p.agi, p.vit, p.intl, p.sense,
        power, now,
        p.unlocked_achievements || null,
        p.gate_stats || null,
        p.sss_loot_count ?? null,
        p.potions_used ?? null,
        p.equipped || null,
        p.inventory || null,
        p.discord_id
      ]
    );
  } else {
    await db.query(
      `INSERT INTO players
        (discord_id, username, avatar, level, exp, str, agi, vit, intl, sense, power,
         season_points, unlocked_achievements, gate_stats, sss_loot_count, potions_used,
         equipped, inventory, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,0,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [
        p.discord_id, p.username, p.avatar, p.level, p.exp,
        p.str, p.agi, p.vit, p.intl, p.sense, power,
        p.unlocked_achievements || '[]',
        p.gate_stats || '{}',
        p.sss_loot_count || 0,
        p.potions_used || 0,
        p.equipped || '{}',
        p.inventory || '[]',
        now, now
      ]
    );
  }
  return power;
}

export async function getPlayer(discordId) {
  const db = await getDb();
  const res = await db.query("SELECT * FROM players WHERE discord_id = $1", [discordId]);
  return res.rows[0] || null;
}

export async function getLeaderboard(limit = 50) {
  const db = await getDb();
  const res = await db.query(
    "SELECT discord_id, username, avatar, level, power, season_points FROM players ORDER BY power DESC LIMIT $1",
    [limit]
  );
  return res.rows;
}

// ─── WORLD BOSS ──────────────────────────────────────────────────────────────

// منتصف الليل بتوقيت السعودية = 21:00 UTC
function nextSaudiMidnightAfter(ts) {
  const d = new Date(ts);
  let midnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 21, 0, 0, 0);
  if (midnight <= ts) midnight += 24 * 60 * 60 * 1000;
  return midnight;
}

export async function getActiveBoss() {
  const db = await getDb();
  const now = Date.now();
  // بوس نشط حالياً
  const active = await db.query(
    `SELECT *, 'active' as status FROM world_boss WHERE starts_at <= $1 AND ends_at >= $1 AND is_dead = 0 ORDER BY id DESC LIMIT 1`,
    [now]
  );
  if (active.rows.length > 0) return active.rows[0];
  // بوس قادم (انتظار ريسبون)
  const pending = await db.query(
    `SELECT *, 'respawning' as status FROM world_boss WHERE starts_at > $1 ORDER BY starts_at ASC LIMIT 1`,
    [now]
  );
  return pending.rows[0] || null;
}

export async function spawnBoss({ name, max_hp, reward_exp, reward_desc, starts_at = null }) {
  const db = await getDb();
  const startsAt = starts_at || Date.now();
  const endsAt = nextSaudiMidnightAfter(startsAt);
  const res = await db.query(
    `INSERT INTO world_boss (name, max_hp, current_hp, reward_exp, reward_desc, starts_at, ends_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [name, max_hp, max_hp, reward_exp, reward_desc || '', startsAt, endsAt]
  );
  return res.rows[0].id;
}

// توزيع مكافآت أول 3 عند موت البوس
export async function distributeBossRewards(boss_id) {
  const db = await getDb();
  const res = await db.query(
    `SELECT discord_id, username, SUM(damage)::bigint as total_damage
     FROM boss_damage_log WHERE boss_id = $1
     GROUP BY discord_id, username ORDER BY total_damage DESC LIMIT 3`,
    [boss_id]
  );
  const REWARDS = [5000000, 2000000, 800000];
  const result = [];
  for (let i = 0; i < res.rows.length; i++) {
    const { discord_id, username, total_damage } = res.rows[i];
    const exp = REWARDS[i];
    await db.query(`UPDATE players SET exp = exp + $1 WHERE discord_id = $2`, [exp, discord_id]);
    result.push({ rank: i + 1, discord_id, username, total_damage: Number(total_damage), exp_reward: exp });
  }
  return result;
}

// إجمالي ضرر اللاعب على البوس اليوم (بتوقيت السعودية)
export async function getDailyBossDamage(boss_id, discord_id) {
  const db = await getDb();
  const now = Date.now();
  // يوم السعودية يبدأ 21:00 UTC
  const today21utc = (() => {
    const d = new Date(now);
    const t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 21, 0, 0, 0);
    return t > now ? t - 86400000 : t;
  })();
  const res = await db.query(
    `SELECT COALESCE(SUM(damage), 0)::bigint as total FROM boss_damage_log
     WHERE boss_id = $1 AND discord_id = $2 AND dealt_at >= $3`,
    [boss_id, discord_id, today21utc]
  );
  return Number(res.rows[0]?.total || 0);
}

// إغلاق البوس بالقوة (ريست منتصف الليل)
export async function forceKillBoss(boss_id) {
  const db = await getDb();
  await db.query(`UPDATE world_boss SET is_dead = 1 WHERE id = $1`, [boss_id]);
}

export async function damageBoss(boss_id, discord_id, username, damage) {
  const db = await getDb();
  const res = await db.query("SELECT * FROM world_boss WHERE id = $1", [boss_id]);
  const boss = res.rows[0];
  if (!boss || boss.is_dead) return null;

  const new_hp = Math.max(0, boss.current_hp - damage);
  const is_dead = new_hp <= 0 ? 1 : 0;
  await db.query("UPDATE world_boss SET current_hp = $1, is_dead = $2 WHERE id = $3", [new_hp, is_dead, boss_id]);
  await db.query(
    "INSERT INTO boss_damage_log (boss_id, discord_id, username, damage, dealt_at) VALUES ($1, $2, $3, $4, $5)",
    [boss_id, discord_id, username, damage, Date.now()]
  );

  return { new_hp, is_dead, total_hp: boss.max_hp };
}

export async function getBossDamageRanking(boss_id) {
  const db = await getDb();
  const res = await db.query(
    `SELECT discord_id, username, SUM(damage) as total_damage
     FROM boss_damage_log WHERE boss_id = $1
     GROUP BY discord_id, username ORDER BY total_damage DESC LIMIT 20`,
    [boss_id]
  );
  return res.rows;
}

export async function getBossAttacksToday(boss_id, discord_id) {
  const db = await getDb();
  const now = new Date();
  const startOfDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const res = await db.query(
    `SELECT COUNT(*) as count FROM boss_damage_log
     WHERE boss_id = $1 AND discord_id = $2 AND dealt_at >= $3`,
    [boss_id, discord_id, startOfDay]
  );
  return parseInt(res.rows[0]?.count || 0, 10);
}

// ─── PVP ──────────────────────────────────────────────────────────────────────
export async function fightPvP(challenger_id, defender_id) {
  const db = await getDb();
  const a = await getPlayer(challenger_id);
  const b = await getPlayer(defender_id);
  if (!a || !b) return null;

  const aScore = a.power * (0.9 + Math.random() * 0.2);
  const bScore = b.power * (0.9 + Math.random() * 0.2);
  const winner_id = aScore >= bScore ? challenger_id : defender_id;

  await db.query(
    `INSERT INTO pvp_matches (challenger_id, defender_id, winner_id, challenger_power, defender_power, fought_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [challenger_id, defender_id, winner_id, a.power, b.power, Date.now()]
  );

  await db.query("UPDATE players SET season_points = season_points + 10 WHERE discord_id = $1", [winner_id]);

  return { winner_id, challenger: a, defender: b, challenger_score: Math.round(aScore), defender_score: Math.round(bScore) };
}

export async function getPvPHistory(discord_id, limit = 10) {
  const db = await getDb();
  const res = await db.query(
    `SELECT * FROM pvp_matches WHERE challenger_id = $1 OR defender_id = $2 ORDER BY fought_at DESC LIMIT $3`,
    [discord_id, discord_id, limit]
  );
  return res.rows;
}
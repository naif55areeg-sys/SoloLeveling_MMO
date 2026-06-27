import express from "express";
import pkg from "pg";
import jwt from "jsonwebtoken";
const { Pool } = pkg;

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// ─── إنشاء الجداول إذا ما كانت موجودة ────────────────────────────────────────
await pool.query(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id          SERIAL PRIMARY KEY,
    room        TEXT        NOT NULL DEFAULT 'global',
    discord_id  TEXT        NOT NULL,
    username    TEXT        NOT NULL,
    avatar      TEXT,
    level       INT         DEFAULT 1,
    content     TEXT        NOT NULL,
    reply_to    INT         REFERENCES chat_messages(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS chat_reactions (
    id          SERIAL PRIMARY KEY,
    message_id  INT  NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    discord_id  TEXT NOT NULL,
    emoji       TEXT NOT NULL,
    UNIQUE(message_id, discord_id, emoji)
  );
`);

// ─── middleware: نفس طريقة auth.js ───────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "no_token" });
  try {
    const token = header.replace("Bearer ", "");
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

// ─── GET /api/chat/:room — جلب الرسائل ───────────────────────────────────────
router.get("/:room", async (req, res) => {
  const { room } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const before = req.query.before ? parseInt(req.query.before) : null;

  try {
    const params = before ? [room, limit, before] : [room, limit];
    const { rows } = await pool.query(`
      SELECT
        m.id, m.room, m.discord_id, m.username, m.avatar, m.level,
        m.content, m.reply_to, m.created_at,
        COALESCE(
          json_agg(json_build_object('emoji', r.emoji, 'discord_id', r.discord_id))
          FILTER (WHERE r.id IS NOT NULL), '[]'
        ) AS reactions
      FROM chat_messages m
      LEFT JOIN chat_reactions r ON r.message_id = m.id
      WHERE m.room = $1
        ${before ? "AND m.id < $3" : ""}
      GROUP BY m.id
      ORDER BY m.id DESC
      LIMIT $2
    `, params);

    res.json(rows.reverse());
  } catch (e) {
    console.error("chat fetch error:", e);
    res.status(500).json({ error: "server_error" });
  }
});

// ─── POST /api/chat/:room — إرسال رسالة ──────────────────────────────────────
router.post("/:room", requireAuth, async (req, res) => {
  const { room } = req.params;
  const { content, reply_to } = req.body;
  // التوكن يحتوي discord_id مو id
  const { discord_id, username, avatar } = req.user;

  if (!content?.trim()) return res.status(400).json({ error: "empty_message" });
  if (content.length > 500) return res.status(400).json({ error: "too_long" });

  try {
    // نجيب الـ level من جدول اللاعبين
    const playerRes = await pool.query(
      "SELECT level FROM players WHERE discord_id = $1", [discord_id]
    );
    const level = playerRes.rows[0]?.level || 1;

    const { rows } = await pool.query(`
      INSERT INTO chat_messages (room, discord_id, username, avatar, level, content, reply_to)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, room, discord_id, username, avatar, level, content, reply_to, created_at
    `, [room, discord_id, username, avatar, level, content.trim(), reply_to || null]);

    res.json({ ...rows[0], reactions: [] });
  } catch (e) {
    console.error("chat send error:", e);
    res.status(500).json({ error: "server_error" });
  }
});

// ─── DELETE /api/chat/:room/:id — حذف رسالة ──────────────────────────────────
router.delete("/:room/:id", requireAuth, async (req, res) => {
  const msgId = parseInt(req.params.id);
  const { discord_id } = req.user;
  const isAdmin = req.headers["x-admin-key"] === (process.env.ADMIN_KEY || "nyvora2026");

  try {
    const { rows } = await pool.query(
      "SELECT discord_id FROM chat_messages WHERE id = $1", [msgId]
    );
    if (!rows.length) return res.status(404).json({ error: "not_found" });
    if (!isAdmin && rows[0].discord_id !== discord_id)
      return res.status(403).json({ error: "forbidden" });

    await pool.query("DELETE FROM chat_messages WHERE id = $1", [msgId]);
    res.json({ ok: true });
  } catch (e) {
    console.error("chat delete error:", e);
    res.status(500).json({ error: "server_error" });
  }
});

// ─── POST /api/chat/:room/:id/react — إضافة/إزالة ريأكشن ────────────────────
router.post("/:room/:id/react", requireAuth, async (req, res) => {
  const msgId = parseInt(req.params.id);
  const { emoji } = req.body;
  const { discord_id } = req.user;

  if (!emoji) return res.status(400).json({ error: "no_emoji" });

  try {
    const { rows } = await pool.query(
      "SELECT id FROM chat_reactions WHERE message_id=$1 AND discord_id=$2 AND emoji=$3",
      [msgId, discord_id, emoji]
    );
    if (rows.length) {
      await pool.query("DELETE FROM chat_reactions WHERE id=$1", [rows[0].id]);
    } else {
      await pool.query(
        "INSERT INTO chat_reactions (message_id, discord_id, emoji) VALUES ($1,$2,$3)",
        [msgId, discord_id, emoji]
      );
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("react error:", e);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;

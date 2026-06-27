// ─── CHAT ROUTES ─────────────────────────────────────────────────────────────
// أضيف هذا الكود في سيرفرك (Express) بجانب باقي الـ routes
// يتطلب: better-sqlite3 أو mysql2/pg حسب قاعدة بياناتك
//
// إذا تستخدم SQLite (better-sqlite3):
//   npm install better-sqlite3

// ── إنشاء الجدول (شغّله مرة واحدة عند بدء السيرفر) ────────────────────────
/*
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      room        TEXT    NOT NULL DEFAULT 'global',
      discord_id  TEXT    NOT NULL,
      username    TEXT    NOT NULL,
      avatar      TEXT,
      level       INTEGER DEFAULT 1,
      is_admin    INTEGER DEFAULT 0,
      content     TEXT    NOT NULL,
      reply_to    INTEGER,
      reply_to_content  TEXT,
      reply_to_username TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_reactions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      room        TEXT NOT NULL DEFAULT 'global',
      message_id  INTEGER NOT NULL,
      discord_id  TEXT NOT NULL,
      emoji       TEXT NOT NULL,
      UNIQUE(message_id, discord_id, emoji)
    );
  `);
*/

// ── GET /api/chat/:room — جلب الرسائل ───────────────────────────────────────
app.get("/api/chat/:room", (req, res) => {
  const { room } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const before = req.query.before ? parseInt(req.query.before) : null;

  try {
    let query = `
      SELECT
        m.id, m.room, m.discord_id, m.username, m.avatar,
        m.level, m.is_admin, m.content,
        m.reply_to, m.reply_to_content, m.reply_to_username,
        m.created_at
      FROM chat_messages m
      WHERE m.room = ?
      ${before ? "AND m.id < ?" : ""}
      ORDER BY m.id ASC
      LIMIT ?
    `;
    const params = before ? [room, before, limit] : [room, limit];
    const messages = db.prepare(query).all(...params);

    // جلب الريأكشنز لكل رسالة
    const ids = messages.map(m => m.id);
    const reactions = ids.length
      ? db.prepare(`
          SELECT message_id, discord_id, emoji
          FROM chat_reactions
          WHERE message_id IN (${ids.map(() => "?").join(",")})
        `).all(...ids)
      : [];

    // دمج الريأكشنز مع الرسائل
    const reactionMap = {};
    reactions.forEach(r => {
      if (!reactionMap[r.message_id]) reactionMap[r.message_id] = [];
      reactionMap[r.message_id].push({ discord_id: r.discord_id, emoji: r.emoji });
    });

    const result = messages.map(m => ({
      ...m,
      is_admin: !!m.is_admin,
      reactions: reactionMap[m.id] || [],
    }));

    res.json(result);
  } catch (err) {
    console.error("Chat fetch error:", err);
    res.status(500).json({ error: "failed" });
  }
});

// ── POST /api/chat/:room — إرسال رسالة ──────────────────────────────────────
app.post("/api/chat/:room", requireAuth, (req, res) => {
  const { room } = req.params;
  const { content, reply_to } = req.body;
  const user = req.user; // من middleware الـ auth

  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "content required" });
  }
  const text = content.trim().slice(0, 500);
  if (!text) return res.status(400).json({ error: "empty" });

  try {
    // جلب بيانات الرسالة المردود عليها
    let replyContent = null, replyUsername = null;
    if (reply_to) {
      const replied = db.prepare("SELECT content, username FROM chat_messages WHERE id = ? AND room = ?").get(reply_to, room);
      if (replied) {
        replyContent  = replied.content.slice(0, 100);
        replyUsername = replied.username;
      }
    }

    // جلب مستوى اللاعب من جدول اللاعبين
    const player = db.prepare("SELECT level, is_admin FROM players WHERE discord_id = ?").get(user.id);

    const result = db.prepare(`
      INSERT INTO chat_messages
        (room, discord_id, username, avatar, level, is_admin, content, reply_to, reply_to_content, reply_to_username)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      room, user.id, user.username, user.avatar,
      player?.level || 1,
      player?.is_admin || 0,
      text,
      reply_to || null,
      replyContent,
      replyUsername,
    );

    const msg = db.prepare("SELECT * FROM chat_messages WHERE id = ?").get(result.lastInsertRowid);
    res.json({ ...msg, is_admin: !!msg.is_admin, reactions: [] });
  } catch (err) {
    console.error("Chat send error:", err);
    res.status(500).json({ error: "failed" });
  }
});

// ── DELETE /api/chat/:room/:id — حذف رسالة ──────────────────────────────────
app.delete("/api/chat/:room/:id", requireAuth, (req, res) => {
  const { room, id } = req.params;
  const user = req.user;

  try {
    const msg = db.prepare("SELECT * FROM chat_messages WHERE id = ? AND room = ?").get(id, room);
    if (!msg) return res.status(404).json({ error: "not found" });

    const player = db.prepare("SELECT is_admin FROM players WHERE discord_id = ?").get(user.id);
    const isAdmin = !!player?.is_admin;

    // فقط صاحب الرسالة أو الأدمن
    if (msg.discord_id !== user.id && !isAdmin) {
      return res.status(403).json({ error: "forbidden" });
    }

    db.prepare("DELETE FROM chat_messages WHERE id = ?").run(id);
    db.prepare("DELETE FROM chat_reactions WHERE message_id = ?").run(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "failed" });
  }
});

// ── POST /api/chat/:room/:id/react — ريأكشن ────────────────────────────────
app.post("/api/chat/:room/:id/react", requireAuth, (req, res) => {
  const { room, id } = req.params;
  const { emoji } = req.body;
  const user = req.user;

  const ALLOWED_EMOJIS = ["👍","❤️","😂","😮","😢","🔥","⚔️","💀","👑","🎉","💪","🌟","✨","🏆","💎","🎯","👊","🤝"];
  if (!ALLOWED_EMOJIS.includes(emoji)) {
    return res.status(400).json({ error: "emoji not allowed" });
  }

  try {
    // toggle: إذا موجود نحذفه، إذا ما موجود نضيفه
    const existing = db.prepare(
      "SELECT id FROM chat_reactions WHERE message_id = ? AND discord_id = ? AND emoji = ?"
    ).get(id, user.id, emoji);

    if (existing) {
      db.prepare("DELETE FROM chat_reactions WHERE id = ?").run(existing.id);
    } else {
      db.prepare(
        "INSERT OR IGNORE INTO chat_reactions (room, message_id, discord_id, emoji) VALUES (?, ?, ?, ?)"
      ).run(room, id, user.id, emoji);
    }
    res.json({ ok: true, toggled: existing ? "removed" : "added" });
  } catch (err) {
    res.status(500).json({ error: "failed" });
  }
});

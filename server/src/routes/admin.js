import express from "express";
import { getPlayer, upsertPlayer } from "../db.js";

const router = express.Router();

// نفس رمز لوحة الأدمن المستخدم بالواجهة — غيّره هنا وبالواجهة معاً لو حبيت
const ADMIN_KEY = process.env.ADMIN_KEY || "nyvora2026";

function requireAdmin(req, res, next) {
  if (req.headers["x-admin-key"] !== ADMIN_KEY) {
    return res.status(403).json({ error: "not_admin" });
  }
  next();
}

// جلب لاعب معيّن عن طريق Discord ID
router.get("/player/:discordId", requireAdmin, async (req, res) => {
  try {
    // ⚠️ لازم await لأن db.js عندك يستخدم مكتبة sqlite (Async)
    const player = await getPlayer(req.params.discordId);
    if (!player) return res.status(404).json({ error: "player_not_found" });
    res.json(player);
  } catch (error) {
    console.error("Admin Get Error:", error);
    res.status(500).json({ error: "internal_server_error", details: error.message });
  }
});

// تعديل المستوى/الإحصائيات لأي لاعب (أدمن فقط)
router.post("/player/:discordId", requireAdmin, async (req, res) => {
  try {
    const existing = await getPlayer(req.params.discordId);
    if (!existing) return res.status(404).json({ error: "player_not_found" });

    const { level, str, agi, vit, intl, sense } = req.body;

    const updatedData = {
      discord_id: existing.discord_id,
      username: existing.username || "Unknown",
      avatar: existing.avatar || "",
      level: Number(level ?? existing.level),
      exp: Number(existing.exp),
      str: Number(str ?? existing.str),
      agi: Number(agi ?? existing.agi),
      vit: Number(vit ?? existing.vit),
      intl: Number(intl ?? existing.intl),
      sense: Number(sense ?? existing.sense),
    };

    // ⚠️ لازم await هنا أيضاً — وإلا الرد يرجع قبل ما يخلص الحفظ بقاعدة البيانات فعلياً
    const power = await upsertPlayer(updatedData);

    res.json({ ok: true, power });
  } catch (error) {
    console.error("Admin Update Error:", error);
    res.status(500).json({
      error: "internal_server_error",
      details: error.message,
    });
  }
});

export default router;

import express from "express";
import { getPlayer, upsertPlayer } from "../db.js";

const router = express.Router();

const ADMIN_KEY = process.env.ADMIN_KEY || "nyvora2026";

function requireAdmin(req, res, next) {
  if (req.headers["x-admin-key"] !== ADMIN_KEY) {
    return res.status(403).json({ error: "not_admin" });
  }
  next();
}

router.get("/player/:discordId", requireAdmin, async (req, res) => {
  try {
    const player = await getPlayer(req.params.discordId);
    if (!player) return res.status(404).json({ error: "player_not_found" });
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: "internal_server_error" });
  }
});

router.post("/player/:discordId", requireAdmin, async (req, res) => {
  try {
    const existing = await getPlayer(req.params.discordId);
    if (!existing) return res.status(404).json({ error: "player_not_found" });

    const { level, str, agi, vit, intl, sense } = req.body;

    const updatedData = {
      ...existing, // الاحتفاظ بالقيم القديمة
      level: Number(level ?? existing.level),
      str: Number(str ?? existing.str),
      agi: Number(agi ?? existing.agi),
      vit: Number(vit ?? existing.vit),
      intl: Number(intl ?? existing.intl),
      sense: Number(sense ?? existing.sense),
    };

    const power = await upsertPlayer(updatedData);
    res.json({ ok: true, power });
  } catch (error) {
    res.status(500).json({ error: "internal_server_error", details: error.message });
  }
});

export default router;
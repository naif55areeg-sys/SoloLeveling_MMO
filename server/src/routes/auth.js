import express from "express";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { upsertPlayer, getPlayer } from "../db.js";

dotenv.config();

const router = express.Router();

// 1) توجيه للـ Discord OAuth
router.get("/discord", (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify`;
  res.redirect(url);
});

// 2) Callback — نستبدل الـ code بتوكن ثم نرجع للواجهة
router.get("/discord/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing code");
  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(400).json({ error: "discord_token_failed", details: tokenData });
    }

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const discordUser = await userRes.json();

    // أنشئ أو حدّث اللاعب
    let player = await getPlayer(discordUser.id);
    if (!player) {
      await upsertPlayer({
        discord_id: discordUser.id,
        username: discordUser.username,
        avatar: discordUser.avatar,
        level: 1, exp: 0, str: 10, agi: 10, vit: 10, intl: 10, sense: 10,
      });
      player = await getPlayer(discordUser.id);
    }

    const sessionToken = jwt.sign(
      { discord_id: discordUser.id, username: discordUser.username, avatar: discordUser.avatar },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // أرجع للواجهة مع التوكن + بيانات اللاعب
    const playerData = encodeURIComponent(JSON.stringify({
      id: discordUser.id,
      username: discordUser.username,
      avatar: discordUser.avatar,
      power: player?.power || 0,
    }));

    res.redirect(`https://solo-leveling-mmo.vercel.app/?token=${sessionToken}&user=${playerData}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "auth_failed" });
  }
});

// Middleware
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "no_token" });
  try {
    const token = header.replace("Bearer ", "");
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: "invalid_token" });
  }
}

export default router;
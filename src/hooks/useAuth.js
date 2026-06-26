import { useState, useEffect, useCallback } from "react";

const SERVER = "https://sololeveling-mmo-server.onrender.com";
const TOKEN_KEY = "sl-discord-token";
const USER_KEY = "sl-discord-user";

export function useAuth() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // عند أول تشغيل: اقرأ التوكن من URL أو localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    const urlUser = params.get("user");

    if (urlToken) {
      localStorage.setItem(TOKEN_KEY, urlToken);
      setToken(urlToken);
      if (urlUser) {
        try {
          const u = JSON.parse(decodeURIComponent(urlUser));
          localStorage.setItem(USER_KEY, JSON.stringify(u));
          setUser(u);
        } catch { }
      }
      // نظّف الـ URL
      window.history.replaceState({}, "", "/");
    } else {
      const saved = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);
      if (saved) {
        setToken(saved);
        if (savedUser) {
          try { setUser(JSON.parse(savedUser)); } catch { }
        }
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(() => {
    window.location.href = `${SERVER}/auth/discord`;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // مزامنة بيانات اللاعب مع السيرفر
  const syncPlayer = useCallback(async (state) => {
    if (!token || !user) return null;
    try {
      const stats = state.stats || {};
      const res = await fetch(`${SERVER}/api/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          level: state.level,
          exp: state.exp,
          str: stats.STR,
          agi: stats.AGI,
          vit: stats.VIT,
          intl: stats.INT,
          sense: stats.SENSE,
          // إنجازات اللاعب — تُخزّن بالسيرفر عشان يشوفها اللاعبين الثانين
          unlocked_achievements: JSON.stringify(state.unlockedAchievements || []),
          // إحصائيات البوابات لحساب التقدّم
          gate_stats: JSON.stringify(state.gateStats || {}),
          sss_loot_count: state.sssLootCount || 0,
          potions_used: state.potionsUsedCount || 0,
          // التجهيز والمخزون
          equipped: JSON.stringify(state.equipped || {}),
          inventory: JSON.stringify(state.inventory || []),
        }),
      });
      if (!res.ok) throw new Error("sync failed");
      return await res.json();
    } catch (e) {
      console.warn("Sync error:", e.message);
      return null;
    }
  }, [token, user]);

  // جلب الـ Leaderboard
  const fetchLeaderboard = useCallback(async (limit = 50) => {
    try {
      const res = await fetch(`${SERVER}/api/leaderboard?limit=${limit}`);
      return await res.json();
    } catch { return []; }
  }, []);

  // جلب World Boss
  const fetchBoss = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER}/api/boss`);
      return await res.json();
    } catch { return null; }
  }, []);

  // هجوم على البوس
  const attackBoss = useCallback(async (str, level) => {
    if (!token) return null;
    try {
      const res = await fetch(`${SERVER}/api/boss/attack`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ str, level }),
      });
      return await res.json();
    } catch { return null; }
  }, [token]);

  // تحدي PvP
  const challengePvP = useCallback(async (defender_id) => {
    if (!token) return null;
    try {
      const res = await fetch(`${SERVER}/api/pvp/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ defender_id }),
      });
      return await res.json();
    } catch { return null; }
  }, [token]);

  // سبون بوس (للتطوير)
  const spawnBoss = useCallback(async (data) => {
    if (!token) return null;
    try {
      const res = await fetch(`${SERVER}/api/boss/spawn`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch { return null; }
  }, [token]);

  const fetchProfile = useCallback(async (discord_id) => {
    try {
      const res = await fetch(`${SERVER}/api/player/${discord_id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }, []);

  // إرسال إعلان عام (أدمن فقط)
  const sendBroadcast = useCallback(async ({ message, type = "info", duration = 10 }) => {
    if (!token) return null;
    try {
      const res = await fetch(`${SERVER}/api/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ message, type, duration }),
      });
      return await res.json();
    } catch { return null; }
  }, [token]);

  // جلب آخر إعلان نشط
  const fetchBroadcast = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER}/api/broadcast`);
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }, []);

  // تعديل لاعب آخر (أدمن)
  const adminEditPlayer = useCallback(async (discord_id, patch) => {
    if (!token) return null;
    try {
      const res = await fetch(`${SERVER}/api/admin/edit-player`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ discord_id, ...patch }),
      });
      return await res.json();
    } catch { return null; }
  }, [token]);


  // جلب بيانات لاعب (أدمن)
  const adminGetPlayer = useCallback(async (discord_id) => {
    if (!token) return null;
    try {
      const res = await fetch(`${SERVER}/api/admin/player/${discord_id}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }, [token]);

  // تحديث بيانات لاعب (أدمن)
  const adminUpdatePlayer = useCallback(async (discord_id, patch) => {
    if (!token) return null;
    try {
      const res = await fetch(`${SERVER}/api/admin/edit-player`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ discord_id, ...patch }),
      });
      return await res.json();
    } catch { return null; }
  }, [token]);

  return { token, user, loading, login, logout, syncPlayer, fetchLeaderboard, fetchBoss, attackBoss, challengePvP, spawnBoss, fetchProfile, sendBroadcast, fetchBroadcast, adminEditPlayer, adminGetPlayer, adminUpdatePlayer };
}
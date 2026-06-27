import { useState, useEffect, useCallback } from "react";
import { CSS, T } from "./constants/tokens";
import { GATE_DIFFICULTY, DAILY_WEIGHTS, ITEM_POOL, TIERS, itemShapeType, UPGRADE_MAX_LEVEL, upgradeCost, rankFromLevel, RANK_SKILLS, ACHIEVEMENTS } from "./constants/gameData";
import { rollLoot, rollDamage, rollMonsterDamage, maxPlayerHp, maxStaminaForLevel, effectiveStats, gainExp, todayStr, weekKey, checkNewAchievements } from "./constants/gameLogic";
import { LIMITS } from "./constants/gameData";
import { useSystemState } from "./hooks/useSystemState";
import { useAuth } from "./hooks/useAuth";

import { AmbientParticles, SignatureMark } from "./components/UI";
import { Preloader, Nav } from "./components/Preloader";
import { LevelUpToast, LootRevealModal, AchievementToast } from "./components/Toasts";

import { HomePage } from "./pages/HomePage";
import { QuestListPage } from "./pages/QuestListPage";
import { StatsPage, RankPage, LootPage, StatusBar, AchievementsPage } from "./pages/OtherPages";
import { GatesPage } from "./pages/GatesPage";
import { LeaderboardPage, WorldBossPage, DiscordLoginBanner, BroadcastBanner, ChatPage } from "./pages/MMOPages";

// الصفحات المتاحة — أضفنا MMO و BOSS
const ALL_PAGES = ["HOME", "QUESTS", "STATS", "GATES", "RANK", "LOOT", "MMO", "BOSS", "CHAT"];

export default function App() {
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState("HOME");
  const { state, loaded, update, mergeServerStats, markSynced } = useSystemState();
  const { token, user, login, logout, syncPlayer, fetchLeaderboard, fetchBoss, attackBoss, challengePvP, spawnBoss, adminGetPlayer, adminUpdatePlayer, sendBroadcast, fetchBroadcast, fetchProfile, fetchMessages, sendMessage, deleteMessage, addReaction } = useAuth();
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const [lootInfo, setLootInfo] = useState(null);
  const [achievementQueue, setAchievementQueue] = useState([]); // إنجازات بانتظار العرض
  const [achievementToast, setAchievementToast] = useState(null); // الإنجاز المعروض حالياً
  const [showSig, setShowSig] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminInputVisible, setAdminInputVisible] = useState(false);
  const [combatFlash, setCombatFlash] = useState(null);
  const [bossForm, setBossForm] = useState({ name: "وحش الظلام العظيم", max_hp: 1000000000, reward_exp: 50000 });
  const [bossSaving, setBossSaving] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ message: "", type: "info" });
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [takeoverVideoUrl, setTakeoverVideoUrl] = useState("");
  const [takeoverSending, setTakeoverSending] = useState(false);

  // ── تعديل لاعب آخر من لوحة الأدمن ──
  const [targetIdInput, setTargetIdInput] = useState("");
  const [targetPlayer, setTargetPlayer] = useState(null);
  const [targetLoading, setTargetLoading] = useState(false);
  const [targetSaving, setTargetSaving] = useState(false);
  const [targetNotFound, setTargetNotFound] = useState(false);

  // مزامنة تلقائية بعد كل تغيير مهم (level up)
  useEffect(() => {
    if (!state || !loaded || !token || !user) return;
    (async () => {
      const result = await syncPlayer(state);
      if (result) {
        markSynced({
          level: state.level,
          exp: state.exp,
          str: state.stats?.STR,
          agi: state.stats?.AGI,
          vit: state.stats?.VIT,
          intl: state.stats?.INT,
          sense: state.stats?.SENSE,
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.level, state?.exp, state?.unlockedAchievements?.length]);

  // 🔄 سحب أي تعديل خارجي صار على بيانات اللاعب (مثل تعديل الأدمن) وتطبيقه محليًا فورًا
  // — أول ما تفتح اللعبة، وبعدها كل دقيقة، عشان الصفحة الرئيسية تتحدث بدون ما يحتاج
  // اللاعب يسوي أي أكشن يفعّل المزامنة العادية (وبدون هذا، تعديل الأدمن ما ينعكس أبداً
  // على الصفحة الرئيسية، وممكن ينعكس بقائمة الصيادين بس يرجع ينمسح بأول sync عادي).
  useEffect(() => {
    if (!loaded || !token || !user) return;
    const pull = async () => {
      const profile = await fetchProfile(user.id);
      if (profile) mergeServerStats(profile);
    };
    pull();
    const t = setInterval(pull, 60000);
    return () => clearInterval(t);
  }, [loaded, token, user, fetchProfile, mergeServerStats]);

  // Clear combat flash
  useEffect(() => {
    if (!combatFlash) return;
    const t = setTimeout(() => setCombatFlash(null), 1300);
    return () => clearTimeout(t);
  }, [combatFlash]);

  // 🏆 إخراج إنجاز واحد من الطابور للعرض كل ما تفرغ النافذة الحالية
  useEffect(() => {
    if (achievementToast || achievementQueue.length === 0) return;
    setAchievementToast(achievementQueue[0]);
    setAchievementQueue((q) => q.slice(1));
  }, [achievementToast, achievementQueue]);

  // ─── ADMIN ACTIONS ────────────────────────────────────────────────────────────
  const adminSet = (patch) => update((prev) => ({ ...prev, ...patch }));

  const adminResetDaily = () => update((prev) => ({
    ...prev,
    gateAttacksToday: 0,
    lastGateAttackDate: null,
    dailyQuestAdds: 0,
    lastAddDate: null,
    quests: prev.quests.map((q) => q.frequency === "daily" ? { ...q, completed: false, lastDate: null } : q),
  }));

  const adminResetWeekly = () => update((prev) => ({
    ...prev,
    quests: prev.quests.map((q) => q.frequency === "weekly" ? { ...q, completed: false, lastDate: null } : q),
  }));

  const adminFullReset = () => {
    if (!window.confirm("تأكيد: هذا سيمسح كل البيانات!")) return;
    localStorage.clear();
    window.location.reload();
  };

  const adminGiveAllLoot = () => {
    update((prev) => {
      const inventory = [...(prev.inventory || [])];
      for (const [tier, items] of Object.entries(ITEM_POOL)) {
        for (const name of items) {
          const idx = inventory.findIndex((it) => it.name === name && it.tier === tier);
          if (idx >= 0) {
            inventory[idx] = { ...inventory[idx], qty: inventory[idx].qty + 99 };
          } else {
            inventory.push({ name, tier, qty: 99, level: 0 });
          }
        }
      }
      return { ...prev, inventory };
    });
  };

  // إطلاق/تحديث البوس العالمي مباشرة من لوحة الأدمن — بدون لمس كود السيرفر
  const adminSpawnBoss = async () => {
    if (!spawnBoss) return;
    setBossSaving(true);
    const result = await spawnBoss(bossForm);
    setBossSaving(false);
    if (result?.ok) {
      alert("✅ تم إطلاق/تحديث البوس بالاسم الجديد");
    } else {
      alert("⚠️ فشل الطلب — تأكد إنك مسجّل دخول وإن السيرفر شغال");
    }
  };

  // إرسال إعلان للجميع
  const adminSendBroadcast = async () => {
    if (!broadcastForm.message.trim()) return;
    setBroadcastSending(true);
    const result = await sendBroadcast({ message: broadcastForm.message, type: broadcastForm.type, duration: 30 });
    setBroadcastSending(false);
    if (result?.ok || result?.message) {
      alert("✅ تم إرسال الإعلان لجميع اللاعبين");
      setBroadcastForm((p) => ({ ...p, message: "" }));
    } else {
      const reason = !token ? "غير مسجّل دخول" : !result ? "السيرفر لا يرد" : "خطأ في السيرفر";
      alert(`⚠️ فشل الإرسال — ${reason}`);
    }
  };

  // 🖥️ تشغيل فيديو شاشة كاملة (Takeover) لجميع اللاعبين — نفس قناة البرودكاست، نوع خاص "takeover"
  const adminSendTakeover = async () => {
    if (!takeoverVideoUrl.trim()) return;
    setTakeoverSending(true);
    const result = await sendBroadcast({ message: takeoverVideoUrl.trim(), type: "takeover", duration: 5 });
    setTakeoverSending(false);
    if (result?.ok || result?.message) {
      alert("✅ تم تشغيل الفيديو لجميع اللاعبين");
      setTakeoverVideoUrl("");
    } else {
      const reason = !token ? "غير مسجّل دخول" : !result ? "السيرفر لا يرد" : "خطأ في السيرفر";
      alert(`⚠️ فشل التشغيل — ${reason}`);
    }
  };

  // البحث عن لاعب آخر بالـ Discord ID
  const adminSearchPlayer = async () => {
    if (!targetIdInput.trim()) return;
    setTargetLoading(true);
    setTargetNotFound(false);
    const player = await adminGetPlayer(targetIdInput.trim());
    setTargetLoading(false);
    if (player) {
      setTargetPlayer(player);
    } else {
      setTargetPlayer(null);
      setTargetNotFound(true);
    }
  };

  // تحديث حقل بفورم اللاعب المستهدف
  const updateTargetField = (key, value) => {
    setTargetPlayer((p) => ({ ...p, [key]: Number(value) }));
  };

  // حفظ تعديلات اللاعب المستهدف بقاعدة بيانات السيرفر
  const adminSaveTargetPlayer = async () => {
    if (!targetPlayer) return;
    setTargetSaving(true);
    const result = await adminUpdatePlayer(targetPlayer.discord_id, {
      level: targetPlayer.level,
      str: targetPlayer.str,
      agi: targetPlayer.agi,
      vit: targetPlayer.vit,
      intl: targetPlayer.intl,
      sense: targetPlayer.sense,
    });
    setTargetSaving(false);
    if (result?.ok) {
      alert(`✅ تم تحديث اللاعب — القوة الجديدة: ${result.power}`);
    } else {
      alert("⚠️ فشل الحفظ — تأكد إن راوت الأدمن مركّب بالسيرفر");
    }
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      // استخدم (e.metaKey) لمستخدمي الماك، و (e.ctrlKey) للويندوز
      if ((e.ctrlKey || e.metaKey) && (e.key === "m" || e.key === "M")) {
        e.preventDefault();
        setShowAdmin((prev) => !prev);
        setAdminAuth(false);
        setAdminPass("");
        setAdminInputVisible(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // ─── COMPLETE QUEST ─────────────────────────────────────────────────────────
  // ⚡ تفعيل مهارة الرانك النشطة — تطبّق على الضربة القادمة فقط، مرة واحدة باليوم
  const useSkill = () => {
    update((prev) => {
      const today = todayStr();
      if (prev.skillUsedDate === today) return prev; // مستخدمة اليوم بالفعل
      return { ...prev, skillUsedDate: today, skillActiveAttack: true };
    });
  };

  const completeQuest = (id, qteMult = 1.0) => {
    update((prev) => {
      const quest = prev.quests.find((q) => q.id === id);
      if (!quest || quest.completed) return prev;
      if (prev.stamina <= 0) return prev;

      const isGate = quest.type === "GATE";
      const gate = isGate ? (GATE_DIFFICULTY[quest.difficulty] || GATE_DIFFICULTY.NORMAL) : null;
      const staminaCost = gate ? gate.stamina : 1;

      const today = todayStr();
      if (isGate) {
        const attacksCount = prev.lastGateAttackDate === today ? (prev.gateAttacksToday || 0) : 0;
        if (attacksCount >= (prev.maxGateAttacksPerDay ?? 23)) {
          setCombatFlash({ questId: id, blocked: true, msg: "وصلت الحد اليومي للهجمات!", ts: Date.now() });
          return prev;
        }
      }

      if (quest.lastCompletedAt && Date.now() - quest.lastCompletedAt < 8 * 60 * 60 * 1000) return prev;
      if (prev.stamina < staminaCost) return prev;
      if (isGate && prev.playerHp <= 0) {
        setCombatFlash({ questId: id, blocked: true, ts: Date.now() });
        return prev;
      }

      let updatedQuest, dmgDealt = 0, crit = false, dmgTaken = 0;

      if (!isGate) {
        updatedQuest = { ...quest, completed: true, lastDate: todayStr(), lastCompletedAt: Date.now() };
      } else {
        const maxHp = quest.maxHp ?? gate.hp;
        const currentHp = quest.hp ?? maxHp;
        const hit = rollDamage(effectiveStats(prev).STR);
        dmgDealt = hit.dmg; crit = hit.crit;

        // ⚡ تطبيق مهارة الرانك النشطة
        let skillBoosted = false;
        if (prev.skillActiveAttack) {
          const rankSkill = RANK_SKILLS[rankFromLevel(prev.level).title];
          if (rankSkill) {
            dmgDealt = Math.round(dmgDealt * rankSkill.multiplier);
            skillBoosted = true;
          }
        }

        // ⚡ تطبيق مضاعف QTE
        if (qteMult !== 1.0) dmgDealt = Math.round(dmgDealt * qteMult);

        const newHp = Math.max(0, currentHp - dmgDealt);
        const isDead = newHp <= 0;
        dmgTaken = rollMonsterDamage(gate.monsterDmg);
        updatedQuest = { ...quest, hp: newHp, maxHp, completed: isDead, lastDate: todayStr(), lastCompletedAt: isDead ? Date.now() : quest.lastCompletedAt };
        setCombatFlash({ questId: id, dmg: dmgDealt, crit, dmgTaken, boosted: skillBoosted, ts: Date.now() });
      }

      const quests = prev.quests.map((q) => q.id === id ? updatedQuest : q);
      let nextState = { ...prev, quests };

      const shouldGrantExp = !isGate || updatedQuest.completed;
      if (shouldGrantExp) {
        nextState = gainExp(nextState, quest.expReward);
        if (nextState._leveledUp > 0) {
          const prevRank = rankFromLevel(prev.level);
          const newRank = rankFromLevel(nextState.level);
          setLevelUpInfo({ newLevel: nextState.level, rank: newRank, rankChanged: prevRank.title !== newRank.title });
          nextState.potions = (nextState.potions || 0) + nextState._leveledUp;
        }
        delete nextState._leveledUp;
      }

      const loot = updatedQuest.completed
        ? rollLoot(isGate ? gate.dropChance : 0.16, isGate ? gate.weights : DAILY_WEIGHTS)
        : null;

      let finalState = nextState;
      if (loot) {
        const inventory = [...(finalState.inventory || [])];
        const idx = inventory.findIndex((it) => it.name === loot.name && it.tier === loot.tier);
        if (idx >= 0) inventory[idx] = { ...inventory[idx], qty: inventory[idx].qty + 1 };
        else inventory.push({ name: loot.name, tier: loot.tier, qty: 1 });
        finalState = { ...finalState, inventory };
        if (loot.tier === "SSS") {
          finalState = { ...finalState, sssLootCount: (finalState.sssLootCount || 0) + 1 };
        }
        setLootInfo(loot);
      }

      // 🏆 تحديث عداد البوابات المكتملة (للإنجازات) + فحص أي إنجاز جديد تحقق
      if (isGate && updatedQuest.completed) {
        const gs = { ...(finalState.gateStats || {}) };
        gs[quest.difficulty] = (gs[quest.difficulty] || 0) + 1;
        finalState = { ...finalState, gateStats: gs };
      }
      {
        const newlyUnlocked = checkNewAchievements(finalState);
        if (newlyUnlocked.length > 0) {
          finalState = { ...finalState, unlockedAchievements: [...(finalState.unlockedAchievements || []), ...newlyUnlocked] };
          setAchievementQueue((q) => [...q, ...newlyUnlocked.map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter(Boolean)]);
        }
      }

      const maxPHp = maxPlayerHp(effectiveStats(finalState));
      const newPlayerHp = isGate ? Math.max(0, prev.playerHp - dmgTaken) : prev.playerHp;
      const todayKey = todayStr();
      const prevAttacks = finalState.lastGateAttackDate === todayKey ? (finalState.gateAttacksToday || 0) : 0;

      return {
        ...finalState,
        stamina: Math.max(0, finalState.stamina - staminaCost),
        playerHp: Math.min(maxPHp, newPlayerHp),
        gateAttacksToday: isGate ? prevAttacks + 1 : (finalState.gateAttacksToday || 0),
        lastGateAttackDate: isGate ? todayKey : (finalState.lastGateAttackDate || null),
        skillActiveAttack: isGate ? false : (finalState.skillActiveAttack || false),
      };
    });
  };

  const usePotion = () => update((prev) => {
    if (prev.potions <= 0) return prev;
    const max = maxPlayerHp(effectiveStats(prev));
    let next = {
      ...prev,
      potions: prev.potions - 1,
      playerHp: Math.min(max, prev.playerHp + 50),
      potionsUsedCount: (prev.potionsUsedCount || 0) + 1,
    };
    const newlyUnlocked = checkNewAchievements(next);
    if (newlyUnlocked.length > 0) {
      next = { ...next, unlockedAchievements: [...(next.unlockedAchievements || []), ...newlyUnlocked] };
      setAchievementQueue((q) => [...q, ...newlyUnlocked.map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter(Boolean)]);
    }
    return next;
  });

  const restPlayer = () => update((prev) => {
    if (prev.stamina < 15) {
      alert("الستامينا منخفضة جداً! تحتاج 15 ستامينا على الأقل.");
      return prev;
    }
    const max = maxPlayerHp(effectiveStats(prev));
    return { ...prev, playerHp: Math.min(max, prev.playerHp + 15), stamina: Math.max(0, prev.stamina - 25) };
  });

  const deleteQuest = (id) => update((prev) => ({ ...prev, quests: prev.quests.filter((q) => q.id !== id) }));

  const addQuest = ({ title, expReward, frequency, type, difficulty }) => update((prev) => {
    const today = todayStr();
    let adds = prev.dailyQuestAdds || 0;
    if (prev.lastAddDate !== today) adds = 0;
    if (adds >= LIMITS.MAX_CUSTOM_QUESTS) return prev;

    let safeExp, hp = null, maxHp = null, diffKey = null;
    if (type === "GATE") {
      diffKey = difficulty && GATE_DIFFICULTY[difficulty] ? difficulty : "NORMAL";
      const gatePreset = GATE_DIFFICULTY[diffKey];
      safeExp = gatePreset.exp; hp = gatePreset.hp; maxHp = gatePreset.hp;
    } else {
      const maxExpMap = { DAILY: LIMITS.MAX_EXP_DAILY, WEEKLY: LIMITS.MAX_EXP_WEEKLY };
      safeExp = Math.min(Number(expReward) || 10, maxExpMap[type] || LIMITS.MAX_EXP_DAILY);
    }

    return {
      ...prev,
      dailyQuestAdds: adds + 1,
      lastAddDate: today,
      quests: [...prev.quests, {
        id: `q_custom_${Date.now()}`, title, type, expReward: safeExp,
        frequency, hp, maxHp, difficulty: diffKey, completed: false, lastDate: null
      }],
    };
  });

  const allocateStat = (key) => update((prev) => {
    if (prev.statPoints <= 0) return prev;
    return { ...prev, statPoints: prev.statPoints - 1, stats: { ...prev.stats, [key]: prev.stats[key] + 1 } };
  });

  const equipItem = (key) => update((prev) => {
    const item = (prev.inventory || []).find((it) => `${it.tier}-${it.name}` === key);
    if (!item) return prev;
    const slot = itemShapeType(item.name);
    const equipped = { ...(prev.equipped || {}) };
    equipped[slot] = equipped[slot] === key ? null : key;
    return { ...prev, equipped };
  });

  const upgradeItem = (key) => update((prev) => {
    const inv = prev.inventory || [];
    const idx = inv.findIndex((it) => `${it.tier}-${it.name}` === key);
    if (idx < 0) return prev;
    const item = inv[idx];
    const level = item.level || 0;
    if (level >= UPGRADE_MAX_LEVEL) return prev;
    const cost = upgradeCost(level);
    if (item.qty < cost + 1) return prev;
    const inventory = [...inv];
    inventory[idx] = { ...item, qty: item.qty - cost, level: level + 1 };
    return { ...prev, inventory };
  });

  const combineItems = (keys) => update((prev) => {
    if (keys.length !== 3) return prev;
    const inv = prev.inventory || [];
    const items = keys.map((k) => inv.find((it) => `${it.tier}-${it.name}` === k)).filter(Boolean);
    if (items.length !== 3) return prev;
    const tier = items[0].tier;
    if (!items.every((it) => it.tier === tier)) return prev;
    const tierIdx = TIERS.indexOf(tier);
    if (tierIdx < 0 || tierIdx >= TIERS.length - 1) return prev;
    const nextTier = TIERS[tierIdx + 1];

    let inventory = [...inv];
    let equipped = { ...(prev.equipped || {}) };
    for (const key of keys) {
      const idx = inventory.findIndex((it) => `${it.tier}-${it.name}` === key);
      if (idx < 0) continue;
      const newQty = inventory[idx].qty - 1;
      if (newQty <= 0) {
        for (const slot of Object.keys(equipped)) {
          if (equipped[slot] === key) equipped[slot] = null;
        }
        inventory.splice(idx, 1);
      } else {
        inventory[idx] = { ...inventory[idx], qty: newQty };
      }
    }

    const pool = ITEM_POOL[nextTier];
    const name = pool[Math.floor(Math.random() * pool.length)];
    const existingIdx = inventory.findIndex((it) => it.tier === nextTier && it.name === name);
    if (existingIdx >= 0) inventory[existingIdx] = { ...inventory[existingIdx], qty: inventory[existingIdx].qty + 1 };
    else inventory.push({ name, tier: nextTier, qty: 1, level: 0 });

    setLootInfo({ tier: nextTier, name });
    return { ...prev, inventory, equipped };
  });

  return (
    <div style={{ minHeight: "100vh", background: T.bg, position: "relative" }}>
      <style>{CSS}</style>
      {ready && loaded && <AmbientParticles />}
      {!ready && <Preloader onComplete={() => setReady(true)} />}
      {ready && !loaded && (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontFamily: "monospace", fontSize: 12 }}>
          SYNCING SYSTEM DATA...
        </div>
      )}
      {ready && loaded && (
        <div style={{ position: "relative", zIndex: 1 }}>
          <LevelUpToast info={levelUpInfo} onDone={() => setLevelUpInfo(null)} />
          <LootRevealModal info={lootInfo} onDone={() => setLootInfo(null)} />
          <AchievementToast info={achievementToast} onDone={() => setAchievementToast(null)} />
          <SignatureMark visible={showSig} />
          <BroadcastBanner fetchBroadcast={fetchBroadcast} />

          {/* Discord Banner — بس في صفحات MMO/BOSS */}
          {(page === "MMO" || page === "BOSS") && (
            <DiscordLoginBanner user={user} onLogin={login} onLogout={logout} />
          )}

          <Nav activePage={page} onNavigate={setPage} level={state.level} statPoints={state.statPoints} />




          {page === "HOME" && <HomePage state={state} onNavigate={setPage} user={user} onLogin={login} onLogout={logout} />}
          {page === "QUESTS" && (
            <QuestListPage
              title="السجل اليومي" subtitle="DAILY / WEEKLY QUESTS"
              types={["DAILY", "WEEKLY"]} addType="DAILY"
              state={state} onComplete={completeQuest} onDelete={deleteQuest}
              onAdd={addQuest} combatFlash={combatFlash}
            />
          )}
          {page === "STATS" && <StatsPage state={state} onAllocate={allocateStat} />}
          {page === "GATES" && (
            <GatesPage
              state={state} onComplete={completeQuest} onDelete={deleteQuest}
              onAdd={addQuest} onPotion={usePotion} onRest={restPlayer} combatFlash={combatFlash}
              onUseSkill={useSkill}
              onBattleEnd={({ playerHp, potions: newPotions, gate, monster, won, loot, exp: expGained, escaped }) => {
                update((prev) => {
                  let next = { ...prev, playerHp: playerHp ?? prev.playerHp };
                  if (newPotions !== undefined) next.potions = newPotions;
                  if (won && expGained) {
                    next = gainExp(next, expGained);
                    if (next._leveledUp > 0) {
                      const prevRank = rankFromLevel(prev.level);
                      const newRank = rankFromLevel(next.level);
                      setLevelUpInfo({ newLevel: next.level, rank: newRank, rankChanged: prevRank.title !== newRank.title });
                      next.potions = (next.potions || 0) + next._leveledUp;
                    }
                    delete next._leveledUp;
                    // تحديث عداد البوابات
                    if (gate) {
                      const gs = { ...(next.gateStats || {}) };
                      gs[gate] = (gs[gate] || 0) + 1;
                      next.gateStats = gs;
                    }
                    // لوت
                    if (loot) {
                      const inventory = [...(next.inventory || [])];
                      const idx = inventory.findIndex((it) => it.name === loot.name && it.tier === loot.tier);
                      if (idx >= 0) inventory[idx] = { ...inventory[idx], qty: inventory[idx].qty + 1 };
                      else inventory.push({ name: loot.name, tier: loot.tier, qty: 1 });
                      next.inventory = inventory;
                      if (loot.tier === "SSS") next.sssLootCount = (next.sssLootCount || 0) + 1;
                      setLootInfo(loot);
                    }
                    // فحص الإنجازات
                    const newlyUnlocked = checkNewAchievements(next);
                    if (newlyUnlocked.length > 0) {
                      next.unlockedAchievements = [...(next.unlockedAchievements || []), ...newlyUnlocked];
                      setAchievementQueue((q) => [...q, ...newlyUnlocked.map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter(Boolean)]);
                    }
                    // خصم الستامينا
                    const stCost = (GATE_DIFFICULTY[gate] || GATE_DIFFICULTY.NORMAL).stamina;
                    next.stamina = Math.max(0, next.stamina - stCost);
                    // عداد الهجمات
                    const todayKey = todayStr();
                    const prevAtk = next.lastGateAttackDate === todayKey ? (next.gateAttacksToday || 0) : 0;
                    next.gateAttacksToday = prevAtk + 1;
                    next.lastGateAttackDate = todayKey;
                  }
                  return next;
                });
              }}
            />
          )}
          {page === "RANK" && <RankPage state={state} />}
          {page === "ACHIEVEMENTS" && <AchievementsPage state={state} onUnlock={(missed) => {
            // حفظ الإنجازات الجديدة بالستيت
            update((prev) => ({
              ...prev,
              unlockedAchievements: [...new Set([...(prev.unlockedAchievements || []), ...missed.map((a) => a.id)])],
            }));
            // إضافة toast لكل إنجاز
            setAchievementQueue((q) => [...q, ...missed]);
          }} />}
          {page === "LOOT" && (
            <LootPage state={state} onEquip={equipItem} onUpgrade={upgradeItem} onCombine={combineItems} />
          )}
          {page === "MMO" && (
            <LeaderboardPage
              fetchLeaderboard={fetchLeaderboard}
              currentUser={user}
              challengePvP={challengePvP}
              state={state}
            />
          )}
          {/* ─── ADMIN PANEL ─── */}
          {showAdmin && (
            <div style={{
              position: "fixed", inset: 0, zIndex: 9000,
              background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "fadeIn 0.2s ease-out",
            }} onClick={(e) => { if (e.target === e.currentTarget) setShowAdmin(false); }}>
              <div style={{
                background: "linear-gradient(135deg, #0a0018, #04000f)",
                border: "1px solid #a855f730",
                borderRadius: 16, padding: 32, width: 420, maxWidth: "92vw",
                boxShadow: "0 0 60px #a855f720, 0 20px 60px rgba(0,0,0,0.8)",
                position: "relative",
              }}>
                {/* header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 4, color: "#a855f7", marginBottom: 4 }}>◈ ADMIN PANEL</div>
                    <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 18, fontWeight: 900, color: "#fff" }}>NYVORA CONTROL</div>
                  </div>
                  <button onClick={() => setShowAdmin(false)} style={{ background: "none", border: "1px solid #ffffff20", color: "#6b7280", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14 }}>✕</button>
                </div>

                {/* password gate */}
                {!adminAuth ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: "#6b7280", marginBottom: 4 }}>أدخل رمز الأدمن</div>
                    <input
                      type="password"
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (adminPass === "nyvora2026") setAdminAuth(true);
                          else { setAdminPass(""); }
                        }
                      }}
                      placeholder="••••••••••"
                      autoFocus
                      style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #a855f740", borderRadius: 8, padding: "12px 16px", color: "#fff", fontFamily: "monospace", fontSize: 14, letterSpacing: 4, outline: "none" }}
                    />
                    <button onClick={() => {
                      if (adminPass === "nyvora2026") setAdminAuth(true);
                      else setAdminPass("");
                    }} style={{ padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #7c3aed, #1d4ed8)", color: "#fff", fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 2 }}>
                      ENTER ▶
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                    {/* ── LEVEL & EXP ── */}
                    <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid #a855f720", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#a855f7", marginBottom: 10 }}>⬡ LEVEL & EXP</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {[1, 5, 10, 500000000000].map((n) => (
                          <button key={n} onClick={() => adminSet({ level: Math.max(1, state.level + n) })} style={{ flex: 1, padding: "7px 4px", borderRadius: 6, border: "1px solid #a855f740", background: "rgba(168,85,247,0.12)", color: "#a855f7", fontFamily: "monospace", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+{n} LV</button>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button onClick={() => adminSet({ exp: 0, level: 1, expToNext: 100 })} style={{ flex: 1, padding: "7px", borderRadius: 6, border: "1px solid #ef444440", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontFamily: "monospace", fontSize: 10, cursor: "pointer" }}>صفّر اللفل</button>
                        <button onClick={() => adminSet({ exp: state.expToNext - 1 })} style={{ flex: 1, padding: "7px", borderRadius: 6, border: "1px solid #fbbf2440", background: "rgba(251,191,36,0.08)", color: "#fbbf24", fontFamily: "monospace", fontSize: 10, cursor: "pointer" }}>EXP كامل</button>
                      </div>
                    </div>

                    {/* ── STAMINA & HP ── */}
                    <div style={{ background: "rgba(96,165,250,0.08)", border: "1px solid #60a5fa20", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#60a5fa", marginBottom: 10 }}>⚡ STAMINA & HP</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => adminSet({ stamina: maxStaminaForLevel(state.level || 1) })} style={{ flex: 1, padding: "7px", borderRadius: 6, border: "1px solid #60a5fa40", background: "rgba(96,165,250,0.12)", color: "#60a5fa", fontFamily: "monospace", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>⚡ ستامينا 700</button>
                        <button onClick={() => { const max = maxPlayerHp(effectiveStats(state)); adminSet({ playerHp: max }); }} style={{ flex: 1, padding: "7px", borderRadius: 6, border: "1px solid #10b98140", background: "rgba(16,185,129,0.12)", color: "#10b981", fontFamily: "monospace", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>❤️ HP كامل</button>
                      </div>
                      <button onClick={() => adminSet({ potions: (state.potions || 0) + 5 })} style={{ width: "100%", marginTop: 8, padding: "7px", borderRadius: 6, border: "1px solid #10b98140", background: "rgba(16,185,129,0.08)", color: "#10b981", fontFamily: "monospace", fontSize: 10, cursor: "pointer" }}>🧪 +5 جرعات شفاء</button>
                    </div>

                    {/* ── ALL LOOT ── */}
                    <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid #fbbf2420", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#fbbf24", marginBottom: 10 }}>🎁 ALL LOOT</div>
                      <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6b7280", marginBottom: 8 }}>
                        يضيف 99× من كل أيتم في كل التيرز (E → SSS)
                      </div>
                      <button
                        onClick={adminGiveAllLoot}
                        style={{ width: "100%", padding: "9px", borderRadius: 6, border: "1px solid #fbbf2460", background: "rgba(251,191,36,0.15)", color: "#fbbf24", fontFamily: "monospace", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}
                      >
                        ✦ أعطني كل اللوت ✦
                      </button>
                    </div>

                    {/* ── STAT POINTS ── */}
                    <div style={{ background: "rgba(34,211,238,0.06)", border: "1px solid #22d3ee20", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#22d3ee", marginBottom: 10 }}>◈ STAT POINTS</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[5, 10, 50].map((n) => (
                          <button key={n} onClick={() => adminSet({ statPoints: (state.statPoints || 0) + n })} style={{ flex: 1, padding: "7px", borderRadius: 6, border: "1px solid #22d3ee40", background: "rgba(34,211,238,0.1)", color: "#22d3ee", fontFamily: "monospace", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+{n}</button>
                        ))}
                      </div>
                    </div>

                    {/* ── GATE ATTACKS ── */}
                    <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid #fbbf2420", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#fbbf24", marginBottom: 10 }}>🗡️ GATE ATTACKS</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => adminSet({ gateAttacksToday: 0, lastGateAttackDate: null })} style={{ flex: 1, padding: "7px", borderRadius: 6, border: "1px solid #fbbf2440", background: "rgba(251,191,36,0.1)", color: "#fbbf24", fontFamily: "monospace", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>↺ صفّر الهجمات</button>
                        {[10, 29, 99].map((n) => (
                          <button key={n} onClick={() => adminSet({ maxGateAttacksPerDay: n })} style={{ flex: 1, padding: "7px", borderRadius: 6, border: "1px solid #fbbf2420", background: state.maxGateAttacksPerDay === n ? "rgba(251,191,36,0.2)" : "transparent", color: "#fbbf24", fontFamily: "monospace", fontSize: 10, cursor: "pointer" }}>{n}/يوم</button>
                        ))}
                      </div>
                    </div>

                    {/* ── WORLD BOSS ── */}
                    <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid #ef444420", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#ef4444", marginBottom: 10 }}>👹 WORLD BOSS</div>
                      <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6b7280", marginBottom: 4 }}>اسم البوس</div>
                      <input
                        type="text"
                        value={bossForm.name}
                        onChange={(e) => setBossForm((p) => ({ ...p, name: e.target.value }))}
                        style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid #ef444440", borderRadius: 6, padding: "8px 10px", color: "#fff", fontFamily: "monospace", fontSize: 12, marginBottom: 8, boxSizing: "border-box" }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6b7280", marginBottom: 4 }}>نقاط الحياة</div>
                          <input
                            type="number"
                            value={bossForm.max_hp}
                            onChange={(e) => setBossForm((p) => ({ ...p, max_hp: Number(e.target.value) }))}
                            style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid #ef444440", borderRadius: 6, padding: "8px 10px", color: "#fff", fontFamily: "monospace", fontSize: 12, boxSizing: "border-box" }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6b7280", marginBottom: 4 }}>مكافأة EXP</div>
                          <input
                            type="number"
                            value={bossForm.reward_exp}
                            onChange={(e) => setBossForm((p) => ({ ...p, reward_exp: Number(e.target.value) }))}
                            style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid #ef444440", borderRadius: 6, padding: "8px 10px", color: "#fff", fontFamily: "monospace", fontSize: 12, boxSizing: "border-box" }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={adminSpawnBoss}
                        disabled={bossSaving}
                        style={{ width: "100%", marginTop: 10, padding: "9px", borderRadius: 6, border: "1px solid #ef444460", background: bossSaving ? "rgba(239,68,68,0.05)" : "rgba(239,68,68,0.15)", color: "#ef4444", fontFamily: "monospace", fontSize: 11, fontWeight: 700, cursor: bossSaving ? "default" : "pointer" }}
                      >
                        {bossSaving ? "⏳ جاري الإطلاق..." : "🔴 إطلاق/تحديث البوس بهذا الاسم"}
                      </button>
                    </div>

                    {/* ── BROADCAST ── */}
                    <div style={{ background: "rgba(34,211,238,0.06)", border: "1px solid #22d3ee20", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#22d3ee", marginBottom: 10 }}>📢 BROADCAST</div>

                      {/* نوع الإعلان */}
                      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                        {[["info", "📢", "#22d3ee"], ["warning", "⚠️", "#fbbf24"], ["event", "🎉", "#a855f7"], ["boss", "👹", "#ef4444"]].map(([type, icon, color]) => (
                          <button key={type} onClick={() => setBroadcastForm((p) => ({ ...p, type }))}
                            style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${color}${broadcastForm.type === type ? "80" : "30"}`, background: broadcastForm.type === type ? `${color}20` : "transparent", color, fontFamily: "monospace", fontSize: 11, cursor: "pointer", transition: "all 0.15s" }}>
                            {icon}
                          </button>
                        ))}
                      </div>

                      {/* نص الإعلان */}
                      <textarea
                        value={broadcastForm.message}
                        onChange={(e) => setBroadcastForm((p) => ({ ...p, message: e.target.value }))}
                        placeholder="اكتب الإعلان هنا..."
                        rows={3}
                        style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid #22d3ee40", borderRadius: 6, padding: "8px 10px", color: "#fff", fontFamily: "monospace", fontSize: 12, resize: "vertical", boxSizing: "border-box", marginBottom: 8, direction: "rtl" }}
                      />

                      <button
                        onClick={adminSendBroadcast}
                        disabled={broadcastSending || !broadcastForm.message.trim()}
                        style={{ width: "100%", padding: "9px", borderRadius: 6, border: "1px solid #22d3ee60", background: broadcastSending ? "rgba(34,211,238,0.05)" : "rgba(34,211,238,0.15)", color: "#22d3ee", fontFamily: "monospace", fontSize: 11, fontWeight: 700, cursor: broadcastSending ? "default" : "pointer", letterSpacing: 1 }}
                      >
                        {broadcastSending ? "⏳ جاري الإرسال..." : "📢 أرسل لجميع اللاعبين"}
                      </button>
                    </div>

                    {/* ── FULLSCREEN VIDEO TAKEOVER ── */}
                    <div style={{ background: "rgba(168,85,247,0.06)", border: "1px solid #a855f720", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#a855f7", marginBottom: 6 }}>🖥️ فيديو شاشة كاملة (Takeover)</div>
                      <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6b7280", marginBottom: 10, lineHeight: 1.6 }}>
                        رابط فيديو يشتغل تلقائيًا ملء الشاشة لجميع اللاعبين بشفافية خفيفة (زي تنبيه دونيشن)، ويختفي تلقائيًا بعد انتهاءه.
                      </div>

                      <input
                        value={takeoverVideoUrl}
                        onChange={(e) => setTakeoverVideoUrl(e.target.value)}
                        placeholder="https://...  (رابط فيديو مباشر mp4)"
                        style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid #a855f740", borderRadius: 6, padding: "8px 10px", color: "#fff", fontFamily: "monospace", fontSize: 12, boxSizing: "border-box", marginBottom: 8, direction: "ltr", textAlign: "left" }}
                      />

                      <button
                        onClick={adminSendTakeover}
                        disabled={takeoverSending || !takeoverVideoUrl.trim()}
                        style={{ width: "100%", padding: "9px", borderRadius: 6, border: "1px solid #a855f760", background: takeoverSending ? "rgba(168,85,247,0.05)" : "rgba(168,85,247,0.15)", color: "#a855f7", fontFamily: "monospace", fontSize: 11, fontWeight: 700, cursor: takeoverSending ? "default" : "pointer", letterSpacing: 1 }}
                      >
                        {takeoverSending ? "⏳ جاري التشغيل..." : "🚀 شغّله لجميع اللاعبين"}
                      </button>
                    </div>

                    {/* ── تعديل لاعب آخر (Discord ID) ── */}
                    <div style={{ background: "rgba(168,85,247,0.06)", border: "1px solid #a855f720", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#a855f7", marginBottom: 10 }}>🎯 تعديل لاعب آخر</div>

                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <input
                          type="text"
                          placeholder="Discord ID للاعب"
                          value={targetIdInput}
                          onChange={(e) => setTargetIdInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") adminSearchPlayer(); }}
                          style={{ flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid #a855f740", borderRadius: 6, padding: "8px 10px", color: "#fff", fontFamily: "monospace", fontSize: 12, boxSizing: "border-box" }}
                        />
                        <button
                          onClick={adminSearchPlayer}
                          disabled={targetLoading}
                          style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #a855f760", background: "rgba(168,85,247,0.15)", color: "#a855f7", fontFamily: "monospace", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          {targetLoading ? "..." : "بحث"}
                        </button>
                      </div>

                      {targetNotFound && (
                        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#ef4444", marginBottom: 8 }}>⚠️ هذا اللاعب ما سجّل دخول بعد (ما عنده حساب بقاعدة البيانات)</div>
                      )}

                      {targetPlayer && (
                        <div>
                          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#fff", marginBottom: 10 }}>
                            👤 <span style={{ color: "#a855f7", fontWeight: 700 }}>{targetPlayer.username}</span> — القوة الحالية: <b>{targetPlayer.power}</b>
                          </div>

                          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6b7280", marginBottom: 4 }}>المستوى</div>
                              <input type="number" value={targetPlayer.level} onChange={(e) => updateTargetField("level", e.target.value)}
                                style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid #a855f740", borderRadius: 6, padding: "7px 10px", color: "#fff", fontFamily: "monospace", fontSize: 12, boxSizing: "border-box" }} />
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 10 }}>
                            {[["str", "STR"], ["agi", "AGI"], ["vit", "VIT"], ["intl", "INT"], ["sense", "SENSE"]].map(([key, label]) => (
                              <div key={key}>
                                <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6b7280", marginBottom: 4, textAlign: "center" }}>{label}</div>
                                <input type="number" value={targetPlayer[key]} onChange={(e) => updateTargetField(key, e.target.value)}
                                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid #a855f740", borderRadius: 6, padding: "6px 4px", color: "#fff", fontFamily: "monospace", fontSize: 11, textAlign: "center", boxSizing: "border-box" }} />
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={adminSaveTargetPlayer}
                            disabled={targetSaving}
                            style={{ width: "100%", padding: "9px", borderRadius: 6, border: "1px solid #a855f760", background: targetSaving ? "rgba(168,85,247,0.05)" : "rgba(168,85,247,0.15)", color: "#a855f7", fontFamily: "monospace", fontSize: 11, fontWeight: 700, cursor: targetSaving ? "default" : "pointer" }}
                          >
                            {targetSaving ? "⏳ جاري الحفظ..." : "💾 حفظ التعديلات على هذا اللاعب"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ── RESET ── */}
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button onClick={adminResetDaily} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #22d3ee40", background: "rgba(34,211,238,0.08)", color: "#22d3ee", fontFamily: "monospace", fontSize: 10, cursor: "pointer" }}>↺ ريست يومي</button>
                      <button onClick={adminResetWeekly} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #60a5fa40", background: "rgba(96,165,250,0.08)", color: "#60a5fa", fontFamily: "monospace", fontSize: 10, cursor: "pointer" }}>↺ ريست أسبوعي</button>
                      <button onClick={adminFullReset} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #ef444460", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontFamily: "monospace", fontSize: 10, cursor: "pointer" }}>🗑 مسح كل شي</button>
                    </div>

                    <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6b7280", textAlign: "center", marginTop: 4 }}>NYVORA ADMIN v1.0 · Ctrl+M للإغلاق</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {page === "CHAT" && (
            <ChatPage
              currentUser={user}
              fetchMessages={fetchMessages}
              sendMessage={sendMessage}
              deleteMessage={deleteMessage}
              addReaction={addReaction}
              fetchProfile={fetchProfile}
              state={state}
              isAdmin={user?.id === "YOUR_DISCORD_ID"}
            />
          )}
          {page === "BOSS" && (
            <WorldBossPage
              fetchBoss={fetchBoss}
              attackBoss={attackBoss}
              spawnBoss={spawnBoss}
              currentUser={user}
              state={state}
            />
          )}
        </div>
      )}
    </div>
  );
}
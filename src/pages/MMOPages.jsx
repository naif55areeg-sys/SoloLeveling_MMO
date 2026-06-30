import { useState, useEffect, useCallback, useRef } from "react";
import { T, glass } from "../constants/tokens";
import { rankFromLevel, ACHIEVEMENTS, ACHIEVEMENT_TIERS } from "../constants/gameData";

// ─── DISCORD AVATAR ───────────────────────────────────────────────────────────
function DiscordAvatar({ user, size = 36 }) {
  if (!user) return null;
  const src = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;
  return (
    <img src={src} alt={user.username}
      style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${T.purple}`, objectFit: "cover" }} />
  );
}

// ─── LOGIN BANNER ─────────────────────────────────────────────────────────────
export function DiscordLoginBanner({ user, onLogin, onLogout }) {
  if (user) {
    return (
      <div style={{
        position: "fixed", top: 12, right: 16, zIndex: 999,
        display: "flex", alignItems: "center", gap: 10,
        ...glass({ padding: "8px 14px" }),
        border: `1px solid ${T.purple}40`,
      }}>
        <DiscordAvatar user={user} size={28} />
        <span style={{ fontFamily: "monospace", fontSize: 11, color: T.text }}>{user.username}</span>
        {user.power != null && (
          <span style={{ fontFamily: "monospace", fontSize: 10, color: T.gold }}>⚡{user.power}</span>
        )}
        <button onClick={onLogout} style={{
          background: "none", border: `1px solid ${T.border}`, color: T.muted,
          fontFamily: "monospace", fontSize: 10, padding: "3px 8px", borderRadius: 6, cursor: "pointer"
        }}>خروج</button>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", top: 12, right: 16, zIndex: 999,
      ...glass({ padding: "8px 14px" }),
      border: `1px solid #5865F250`,
    }}>
      <button onClick={onLogin} style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#5865F2", border: "none", borderRadius: 8,
        color: "#fff", fontFamily: "monospace", fontSize: 12, fontWeight: 700,
        padding: "8px 16px", cursor: "pointer", letterSpacing: 1,
      }}>
        <svg width="18" height="14" viewBox="0 0 71 55" fill="white">
          <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a.2.2 0 0 0-.2.1 40.7 40.7 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A38 38 0 0 0 25.5.5a.2.2 0 0 0-.2-.1A58.3 58.3 0 0 0 10.7 4.9a.2.2 0 0 0-.1.1C1.6 18.1-.9 31 .3 43.7a.2.2 0 0 0 .1.2 58.8 58.8 0 0 0 17.7 9 .2.2 0 0 0 .2-.1 42 42 0 0 0 3.6-5.9.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4l1.1-.8a.2.2 0 0 1 .2 0c11.5 5.3 24 5.3 35.4 0a.2.2 0 0 1 .2 0l1.1.8a.2.2 0 0 1 0 .4 36 36 0 0 1-5.5 2.6.2.2 0 0 0-.1.3 47 47 0 0 0 3.6 5.9.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.7-9 .2.2 0 0 0 .1-.2C72.7 28.8 68.1 16 60.2 5a.2.2 0 0 0-.1-.1zM23.7 36.2c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.6 0 6.5 3.3 6.4 7.2 0 4-2.8 7.2-6.4 7.2zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.6 0 6.5 3.3 6.4 7.2 0 4-2.8 7.2-6.4 7.2z" />
        </svg>
        تسجيل الدخول بديسكورد
      </button>
    </div>
  );
}

// ─── TIER COLORS ─────────────────────────────────────────────────────────────
const TIER_COLOR_MAP = { E: "#ef4444", D: "#9ca3af", C: "#22d3ee", B: "#60a5fa", A: "#fbbf24", S: "#a855f7", SS: "#67e8f9", SSS: "#fbbf24" };

// ─── BROADCAST BANNER ────────────────────────────────────────────────────────
// ⚠️ ضع روابط الصوت هنا (mp3/ogg) — رابط مباشر للملف الصوتي لكل نوع إعلان.
// لو ما تبي صوت لنوع معيّن، خله "" وما راح يشتغل له صوت.
const BROADCAST_TYPES = {
  info: { color: "#22d3ee", icon: "📢", label: "إعلان", sound: "" },
  warning: { color: "#fbbf24", icon: "⚠️", label: "تحذير", sound: "" },
  event: { color: "#a855f7", icon: "🎉", label: "حدث", sound: "" },
  boss: { color: "#ef4444", icon: "👹", label: "بوس", sound: "" },
  takeover: { color: "#a855f7", icon: "🖥️", label: "نظام", sound: "" },
};

// ─── BROADCAST TAKEOVER ──────────────────────────────────────────────────────
function BroadcastTakeover({ videoUrl, overlayText, onDone }) {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (!overlayText) return;
    const t = setTimeout(() => setShowText(true), 3000);
    return () => clearTimeout(t);
  }, [overlayText]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", background: "rgba(4,4,8,0.55)",
      animation: "bctFadeIn 0.35s ease-out both",
    }}>
      <video
        src={videoUrl}
        autoPlay playsInline
        onEnded={onDone} onError={onDone}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%", objectFit: "cover",
          opacity: 1,
        }}
      />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)",
      }} />
      {overlayText && showText && (
        <div style={{
          position: "relative", zIndex: 10,
          textAlign: "center",
          padding: "0 40px",
          maxWidth: 700,
          animation: "takeoverTextIn 0.8s cubic-bezier(.22,1,.36,1) both",
        }}>
          <div style={{
            height: 1, width: "60%", margin: "0 auto 20px",
            background: "linear-gradient(to right, transparent, rgba(255,255,255,0.6), transparent)",
            animation: "takeoverLineExpand 0.6s ease-out 0.1s both",
          }} />
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: "clamp(22px, 4vw, 48px)",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "0.08em",
            lineHeight: 1.3,
            textShadow: "0 0 40px rgba(168,85,247,0.8), 0 0 80px rgba(168,85,247,0.4), 0 4px 20px rgba(0,0,0,0.9)",
            filter: "drop-shadow(0 0 24px rgba(168,85,247,0.6))",
            whiteSpace: "pre-wrap",
          }}>
            {overlayText}
          </div>
          <div style={{
            height: 1, width: "60%", margin: "20px auto 0",
            background: "linear-gradient(to right, transparent, rgba(255,255,255,0.6), transparent)",
            animation: "takeoverLineExpand 0.6s ease-out 0.2s both",
          }} />
        </div>
      )}
      <button onClick={onDone} style={{
        position: "absolute", top: 18, right: 18, zIndex: 20,
        background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)",
        color: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "6px 14px",
        fontFamily: "monospace", fontSize: 11, cursor: "pointer",
        backdropFilter: "blur(4px)",
      }}>تجاوز ✕</button>
      <style>{`
        @keyframes bctFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes takeoverTextIn {
          from { opacity: 0; transform: translateY(30px) scale(0.92); filter: blur(8px); }
          to   { opacity: 1; transform: translateY(0) scale(1);       filter: blur(0); }
        }
        @keyframes takeoverLineExpand {
          from { transform: scaleX(0); opacity: 0; }
          to   { transform: scaleX(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function BroadcastBanner({ fetchBroadcast }) {
  const [broadcast, setBroadcast] = useState(null);
  const [dismissedId, setDismissedId] = useState(null);
  const [closeHover, setCloseHover] = useState(false);
  const [muteHover, setMuteHover] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [muted, setMuted] = useState(false);
  const lastSoundIdRef = useRef(null);
  const audioRef = useRef(null);
  const [takeoverVisible, setTakeoverVisible] = useState(false);
  const lastTakeoverIdRef = useRef(null);
  const takeoverTimerRef = useRef(null);

  function makeBroadcastId(data) {
    if (!data?.message) return null;
    return `${data.type}||${data.message}||${data.updated_at || data.created_at || ""}`;
  }

  useEffect(() => {
    if (!fetchBroadcast) return;
    const load = async () => {
      try {
        const data = await fetchBroadcast();
        if (data?.message) {
          setBroadcast(prev => {
            if (makeBroadcastId(prev) !== makeBroadcastId(data)) {
              setLeaving(false);
              setDismissedId(null);
            }
            return data;
          });
        }
      } catch { }
    };
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [fetchBroadcast]);

  useEffect(() => {
    if (!broadcast?.message) return;
    const id = makeBroadcastId(broadcast);
    if (lastSoundIdRef.current === id) return;
    lastSoundIdRef.current = id;
    if (muted) return;
    const typeCfg = BROADCAST_TYPES[broadcast.type] || BROADCAST_TYPES.info;
    const soundUrl = broadcast.sound || typeCfg.sound;
    if (!soundUrl) return;
    try {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      const audio = new Audio(soundUrl);
      audio.volume = 0.55;
      audioRef.current = audio;
      audio.play().catch(() => {});
    } catch { }
  }, [broadcast?.message, broadcast?.type, broadcast?.sound, broadcast?.updated_at, broadcast?.created_at, muted]);

  useEffect(() => {
    if (broadcast?.type !== "takeover" || !broadcast?.message) return;
    const id = makeBroadcastId(broadcast);
    if (lastTakeoverIdRef.current === id) return;
    lastTakeoverIdRef.current = id;
    setTakeoverVisible(true);
    clearTimeout(takeoverTimerRef.current);
    takeoverTimerRef.current = setTimeout(() => setTakeoverVisible(false), 25000);
    return () => clearTimeout(takeoverTimerRef.current);
  }, [broadcast?.type, broadcast?.message, broadcast?.updated_at, broadcast?.created_at]);

  if (broadcast?.type === "takeover") {
    return takeoverVisible
      ? <BroadcastTakeover videoUrl={broadcast.videoUrl || broadcast.message} overlayText={broadcast.overlayText || ""} onDone={() => {
        setTakeoverVisible(false);
        clearTimeout(takeoverTimerRef.current);
      }} />
      : null;
  }

  if (!broadcast?.message) return null;

  const broadcastId = makeBroadcastId(broadcast);
  if (dismissedId === broadcastId) return null;

  const cfg = BROADCAST_TYPES[broadcast.type] || BROADCAST_TYPES.info;

  const handleClose = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setLeaving(true);
    setTimeout(() => setDismissedId(broadcastId), 260);
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      if (next && audioRef.current) audioRef.current.pause();
      return next;
    });
  };

  return (
    <div
      style={{
        position: "fixed", top: 54, left: "50%",
        zIndex: 800, width: "min(620px, 92vw)",
        animation: leaving
          ? "bcbOut 0.26s cubic-bezier(.4,0,.6,1) both"
          : "bcbIn 0.55s cubic-bezier(.2,1.1,.3,1) both",
        filter: `drop-shadow(0 12px 40px rgba(0,0,0,0.55))`,
      }}
    >
      <div style={{ position: "relative", borderRadius: 18, padding: 2, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute", inset: "-60%",
            background: `conic-gradient(from 0deg, ${cfg.color}, transparent 25%, transparent 50%, ${cfg.color} 70%, transparent 95%, ${cfg.color})`,
            animation: "bcbSpin 3.2s linear infinite",
          }}
        />
        <div
          style={{
            position: "relative", zIndex: 1, borderRadius: 16,
            background: `linear-gradient(135deg, ${cfg.color}1c, rgba(10,10,14,0.94) 45%, rgba(10,10,14,0.96))`,
            backdropFilter: "blur(18px)",
            boxShadow: `0 0 0 1px ${cfg.color}25 inset, 0 0 40px ${cfg.color}35`,
            padding: "16px 18px",
            display: "flex", alignItems: "center", gap: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute", top: "-40%", right: "-10%",
              width: 160, height: 160, borderRadius: "50%",
              background: `radial-gradient(circle, ${cfg.color}35, transparent 70%)`,
              filter: "blur(10px)", animation: "bcbFloat 5s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute", top: 0, bottom: 0, left: "-30%", width: "30%",
              background: `linear-gradient(100deg, transparent, ${cfg.color}1f, transparent)`,
              animation: "bcbShine 3.6s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0, zIndex: 1 }}>
            <div
              style={{
                position: "relative", width: 44, height: 44, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `radial-gradient(circle, ${cfg.color}2e, transparent 75%)`,
              }}
            >
              <div
                style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: `1.5px solid ${cfg.color}80`,
                  animation: "bcbPulseRing 2.2s ease-out infinite",
                }}
              />
              <span style={{ fontSize: 22, filter: `drop-shadow(0 0 10px ${cfg.color})`, position: "relative" }}>{cfg.icon}</span>
            </div>
            <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: cfg.color, fontWeight: 700, textShadow: `0 0 10px ${cfg.color}80` }}>
              {cfg.label}
            </span>
          </div>
          <div
            style={{
              position: "relative", zIndex: 1, flex: 1, fontFamily: "monospace", fontSize: 13.5,
              color: "#f3f4f6", lineHeight: 1.7, direction: "rtl", textAlign: "right",
              wordBreak: "break-word",
            }}
          >
            {broadcast.message}
          </div>
          <button
            onClick={toggleMute}
            onMouseEnter={() => setMuteHover(true)}
            onMouseLeave={() => setMuteHover(false)}
            title={muted ? "تشغيل الصوت" : "كتم الصوت"}
            style={{
              position: "relative", zIndex: 1,
              background: muteHover ? `${cfg.color}22` : "rgba(255,255,255,0.04)",
              border: `1px solid ${muteHover ? cfg.color + "90" : cfg.color + "35"}`,
              color: muteHover ? cfg.color : "#9ca3af",
              borderRadius: 9, width: 30, height: 30,
              cursor: "pointer", fontSize: 13, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.18s ease",
              transform: muteHover ? "scale(1.08)" : "scale(1)",
            }}
          >{muted ? "🔇" : "🔊"}</button>
          <button
            onClick={handleClose}
            onMouseEnter={() => setCloseHover(true)}
            onMouseLeave={() => setCloseHover(false)}
            style={{
              position: "relative", zIndex: 1,
              background: closeHover ? `${cfg.color}22` : "rgba(255,255,255,0.04)",
              border: `1px solid ${closeHover ? cfg.color + "90" : cfg.color + "35"}`,
              color: closeHover ? cfg.color : "#9ca3af",
              borderRadius: 9, width: 30, height: 30,
              cursor: "pointer", fontSize: 13, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.18s ease",
              transform: closeHover ? "scale(1.08) rotate(90deg)" : "scale(1) rotate(0deg)",
            }}
          >✕</button>
        </div>
      </div>
      <style>{`
        @keyframes bcbIn {
          0% { opacity: 0; transform: translate(-50%, -26px) scale(0.92); }
          60% { opacity: 1; transform: translate(-50%, 3px) scale(1.015); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        @keyframes bcbOut {
          0% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -14px) scale(0.95); }
        }
        @keyframes bcbSpin { to { transform: rotate(360deg); } }
        @keyframes bcbFloat {
          0%, 100% { transform: translate(0, 0); opacity: 0.7; }
          50% { transform: translate(-12px, 10px); opacity: 1; }
        }
        @keyframes bcbShine {
          0% { left: -30%; opacity: 0; }
          15% { opacity: 1; }
          50% { left: 110%; opacity: 0.6; }
          100% { left: 110%; opacity: 0; }
        }
        @keyframes bcbPulseRing {
          0% { transform: scale(0.85); opacity: 0.9; }
          70% { transform: scale(1.35); opacity: 0; }
          100% { transform: scale(1.35); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────
function ProfileModal({ player, profileData, loading, currentUser, onClose, onChallenge }) {
  const rank = rankFromLevel(player.level || 1);
  const isMe = currentUser && player.discord_id === currentUser.id;
  const equipped = profileData?.equipped || {};
  const inventory = profileData?.inventory || [];

  const SLOT_ICONS = { weapon: "⚔️", armor: "🛡️", helmet: "🪖", boots: "👢", gloves: "🧤", ring: "💍" };
  const SLOT_LABEL = { weapon: "سلاح", armor: "درع", helmet: "خوذة", boots: "حذاء", gloves: "قفازات", ring: "خاتم" };
  const SLOT_STAT = { weapon: "STR", armor: "VIT", helmet: "INT", boots: "AGI", gloves: "AGI", ring: "SENSE" };
  const SLOT_ORDER = ["weapon", "armor", "helmet", "boots", "gloves", "ring"];
  const STAT_COLORS = { STR: "#ef4444", AGI: "#22d3ee", VIT: "#10b981", INT: "#a855f7", SENSE: "#fbbf24" };

  const avatarSrc = player.avatar
    ? `https://cdn.discordapp.com/avatars/${player.discord_id}/${player.avatar}.png?size=128`
    : null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div style={{
        width: "100%", maxWidth: 500,
        background: "linear-gradient(160deg, #0e0025 0%, #04000f 100%)",
        border: `1px solid ${rank.color}50`,
        borderRadius: 24,
        boxShadow: `0 0 100px ${rank.color}30, 0 0 40px ${rank.color}15, 0 32px 80px rgba(0,0,0,0.8)`,
        animation: "popIn 0.35s cubic-bezier(.34,1.56,.64,1) both",
        maxHeight: "92vh", overflowY: "auto",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "relative", height: 140, overflow: "hidden",
          background: `linear-gradient(135deg, ${rank.color}35 0%, ${rank.color}10 50%, #04000f 100%)`
        }}>
          <div style={{
            position: "absolute", inset: 0, opacity: 0.06,
            backgroundImage: `linear-gradient(${rank.color} 1px, transparent 1px), linear-gradient(90deg, ${rank.color} 1px, transparent 1px)`,
            backgroundSize: "30px 30px"
          }} />
          <div style={{
            position: "absolute", inset: -60, opacity: 0.15, pointerEvents: "none",
            background: `conic-gradient(from 0deg, ${rank.color}, transparent 40%, ${rank.color} 60%, transparent)`,
            animation: "auraSpin 10s linear infinite"
          }} />
          {[8, 22, 40, 60, 78, 92].map((l, i) => (
            <div key={i} style={{
              position: "absolute", bottom: 0, left: `${l}%`,
              width: i % 2 === 0 ? 4 : 2, height: i % 2 === 0 ? 4 : 2, borderRadius: "50%",
              background: rank.color, opacity: 0.6,
              animation: `particleFloat ${2.5 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.25}s`
            }} />
          ))}
          <button onClick={onClose} style={{
            position: "absolute", top: 14, right: 14, width: 32, height: 32,
            borderRadius: "50%", border: `1px solid rgba(255,255,255,0.2)`,
            background: "rgba(0,0,0,0.5)", color: "#9ca3af", cursor: "pointer",
            fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10
          }}>✕</button>
          <div style={{
            position: "absolute", top: 16, left: 20, zIndex: 5,
            fontFamily: "'Orbitron',monospace", fontSize: 10, fontWeight: 700,
            color: rank.color, letterSpacing: 3, background: `${rank.color}20`,
            border: `1px solid ${rank.color}50`, borderRadius: 6, padding: "3px 10px"
          }}>
            {rank.title}
          </div>
          <div style={{ position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", zIndex: 5 }}>
            <div style={{ position: "relative", width: 84, height: 84 }}>
              <div style={{
                position: "absolute", inset: -6, borderRadius: "50%",
                boxShadow: `0 0 0 2px ${rank.color}, 0 0 20px ${rank.color}80`,
                borderRadius: "50%", animation: "pulse-ring 2.5s ease-in-out infinite"
              }} />
              {avatarSrc ? (
                <img src={avatarSrc} alt={player.username}
                  style={{
                    width: 84, height: 84, borderRadius: "50%",
                    border: `3px solid ${rank.color}`,
                    objectFit: "cover", display: "block", position: "relative", zIndex: 1,
                    boxShadow: `0 0 24px ${rank.color}60`
                  }} />
              ) : (
                <div style={{
                  width: 84, height: 84, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${rank.color}40, ${rank.color}15)`,
                  border: `3px solid ${rank.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Orbitron',monospace", fontSize: 30, fontWeight: 900,
                  color: rank.color, position: "relative", zIndex: 1,
                  boxShadow: `0 0 24px ${rank.color}60`
                }}>
                  {player.username?.[0]?.toUpperCase()}
                </div>
              )}
              <div style={{
                position: "absolute", bottom: 4, right: 4, width: 16, height: 16,
                borderRadius: "50%", background: "#23a55a",
                border: "3px solid #04000f", zIndex: 2,
                boxShadow: "0 0 8px #23a55a"
              }} />
            </div>
          </div>
        </div>

        <div style={{ padding: "56px 28px 28px", position: "relative", zIndex: 2 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{
              fontFamily: "'Orbitron',monospace", fontSize: 22, fontWeight: 900,
              color: "#e9d5ff", marginBottom: 6,
              textShadow: `0 0 20px ${rank.color}40`
            }}>
              {player.username}
              {isMe && <span style={{ fontSize: 11, color: "#fbbf24", marginLeft: 8 }}>(أنت)</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>LV. {player.level}</span>
              <span style={{ color: "#374151" }}>·</span>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#22d3ee", fontWeight: 700 }}>⚡ {(player.power || 0).toLocaleString()}</span>
              <span style={{ color: "#374151" }}>·</span>
              <span style={{ fontFamily: "monospace", fontSize: 10, color: "#fbbf24" }}>🏅 {player.season_points || 0}</span>
            </div>
          </div>

          <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${rank.color}40, transparent)`, marginBottom: 20 }} />

          {loading ? (
            <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 12, color: "#6b7280", padding: "32px 0" }}>
              <div style={{ animation: "pulseOpacity 1.2s ease-in-out infinite" }}>◈ جاري تحميل البيانات...</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#a855f7", marginBottom: 12 }}>◈ العتاد المجهّز</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {SLOT_ORDER.map((slot) => {
                    const key = equipped[slot];
                    const item = key ? inventory.find((it) => `${it.tier}-${it.name}` === key) : null;
                    const color = item ? (TIER_COLOR_MAP[item.tier] || "#a855f7") : "#374151";
                    return (
                      <div key={slot} style={{ background: item ? `radial-gradient(circle at 30% 30%, ${color}18, rgba(0,0,0,0.3))` : "rgba(255,255,255,0.03)", border: `1px solid ${item ? color + "50" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "10px 8px", textAlign: "center", transition: "all 0.2s", boxShadow: item ? `0 0 10px ${color}20` : "none" }}>
                        <div style={{ fontSize: 20, marginBottom: 5 }}>{SLOT_ICONS[slot]}</div>
                        {item ? (
                          <>
                            <div style={{ fontFamily: "monospace", fontSize: 9, color, fontWeight: 700, marginBottom: 2 }}>[{item.tier}]{item.level > 0 ? ` +${item.level}` : ""}</div>
                            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#e9d5ff", lineHeight: 1.3 }}>{item.name}</div>
                            <div style={{ fontFamily: "monospace", fontSize: 8, color: "#fbbf24", marginTop: 3 }}>{SLOT_STAT[slot]} +{(item.level || 0) * 2 + 3}</div>
                          </>
                        ) : (
                          <div style={{ fontFamily: "monospace", fontSize: 8, color: "#374151" }}>{SLOT_LABEL[slot]}<br />—</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {profileData?.stats && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#a855f7", marginBottom: 12 }}>◈ الإحصائيات</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
                    {Object.entries(profileData.stats).map(([k, v]) => (
                      <div key={k} style={{ textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 4px", border: `1px solid ${STAT_COLORS[k] || "#374151"}20` }}>
                        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 16, fontWeight: 900, color: STAT_COLORS[k] || "#a855f7" }}>{v}</div>
                        <div style={{ fontFamily: "monospace", fontSize: 7, color: "#6b7280", letterSpacing: 1, marginTop: 2 }}>{k}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${rank.color}30, transparent)`, margin: "4px 0 20px" }} />
              {(() => {
                let unlockedIds = [];
                try {
                  const raw = profileData?.unlocked_achievements;
                  if (Array.isArray(raw)) unlockedIds = raw;
                  else if (typeof raw === "string") unlockedIds = JSON.parse(raw);
                } catch { }

                const unlockedAchs = ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id));
                const TIER_ORDER = ["legendary", "gold", "silver", "bronze"];
                const sorted = [...unlockedAchs].sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
                const total = ACHIEVEMENTS.length;
                const pct = total > 0 ? Math.round((sorted.length / total) * 100) : 0;

                return (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, filter: `drop-shadow(0 0 6px ${T.gold})` }}>🏆</span>
                        <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: T.gold }}>ACHIEVEMENTS</span>
                      </div>
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: T.gold, fontWeight: 700 }}>
                        {sorted.length}/{total}
                      </span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: sorted.length > 0 ? 12 : 6 }}>
                      <div style={{
                        height: "100%", width: `${pct}%`,
                        background: `linear-gradient(90deg, ${T.gold}80, #fde68a, ${T.gold})`,
                        backgroundSize: "200% auto",
                        borderRadius: 99,
                        boxShadow: `0 0 8px ${T.gold}60`,
                        animation: "shimmerText 2.5s linear infinite",
                        transition: "width 0.6s ease",
                      }} />
                    </div>
                    {sorted.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {sorted.map((ach) => {
                          const tier = ACHIEVEMENT_TIERS[ach.tier] || ACHIEVEMENT_TIERS.bronze;
                          const color = tier.color;
                          const isLegendary = ach.tier === "legendary";
                          const isGold = ach.tier === "gold";
                          return (
                            <div
                              key={ach.id}
                              title={`${ach.title} — ${ach.desc} (${tier.label})`}
                              style={{
                                width: 46, height: 46, borderRadius: 12,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 24,
                                background: `${color}15`,
                                border: `1px solid ${color}55`,
                                boxShadow: (isLegendary || isGold)
                                  ? `0 0 16px ${color}60, inset 0 0 8px ${color}20`
                                  : `0 0 6px ${color}30`,
                                position: "relative", overflow: "hidden",
                                filter: `drop-shadow(0 0 ${isLegendary ? 10 : 5}px ${color}${isLegendary ? "cc" : "80"})`,
                                transition: "transform 0.15s",
                                cursor: "default",
                                flexShrink: 0,
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2) translateY(-2px)"}
                              onMouseLeave={(e) => e.currentTarget.style.transform = ""}
                            >
                              {(isLegendary || isGold) && (
                                <div style={{
                                  position: "absolute", inset: -6, opacity: 0.3, pointerEvents: "none",
                                  background: `conic-gradient(from 0deg, ${color}, transparent, ${color})`,
                                  animation: `auraSpin ${isLegendary ? 4 : 7}s linear infinite`,
                                }} />
                              )}
                              <span style={{ position: "relative", zIndex: 1 }}>{ach.icon}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{
                        textAlign: "center", fontFamily: "monospace", fontSize: 11,
                        color: "#374151", padding: "10px 0",
                      }}>
                        لا يوجد إنجازات بعد
                      </div>
                    )}
                  </div>
                );
              })()}

              {!isMe && currentUser && (
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button onClick={() => onChallenge(player.discord_id, player.username)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #a855f7", background: "rgba(168,85,247,0.15)", color: "#a855f7", fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 1, transition: "all 0.2s", boxShadow: "0 0 0 0 #a855f7" }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 20px #a855f750"; e.currentTarget.style.background = "rgba(168,85,247,0.25)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "rgba(168,85,247,0.15)"; }}>
                    ⚔️ تحدٍّ PvP
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LEADERBOARD PAGE ─────────────────────────────────────────────────────────
export function LeaderboardPage({ fetchLeaderboard, fetchProfile, currentUser, challengePvP, state }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pvpResult, setPvpResult] = useState(null);
  const [fighting, setFighting] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const openProfile = async (player) => {
    setSelectedPlayer(player);
    setProfileData(null);
    setProfileLoading(true);
    if (fetchProfile) {
      const data = await fetchProfile(player.discord_id);
      setProfileData(data);
    }
    setProfileLoading(false);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchLeaderboard(50);
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [fetchLeaderboard]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const handleChallenge = async (defender_id, defender_name) => {
    if (!challengePvP || !currentUser) return;
    setFighting(defender_id);
    const result = await challengePvP(defender_id);
    setFighting(null);
    if (result && result.winner_id) {
      setPvpResult({ ...result, defender_name });
    }
  };

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80, padding: "80px 24px 40px", maxWidth: 700, margin: "0 auto", animation: "pageInRight 0.4s ease-out both" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: T.purple, marginBottom: 8 }}>◈ WORLD RANKING</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: 24, fontWeight: 700, color: T.text }}>قائمة الصيادين</h2>
          <button onClick={load} style={{
            background: "none", border: `1px solid ${T.border}`, color: T.muted,
            fontFamily: "monospace", fontSize: 10, padding: "5px 12px", borderRadius: 6, cursor: "pointer"
          }}>↻ تحديث</button>
        </div>
        {!currentUser && (
          <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 11, color: T.gold }}>
            ⚠ سجّل دخولك بديسكورد لتظهر في القائمة وتتحدى الآخرين
          </div>
        )}
      </div>

      {pvpResult && (
        <div style={{
          ...glass({ padding: "16px 20px" }), marginBottom: 20,
          border: `1px solid ${pvpResult.winner_id === currentUser?.id ? T.gold : T.purple}`,
          animation: "fadeUp 0.3s ease-out",
        }}>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: T.muted, marginBottom: 4 }}>⚔️ نتيجة PvP</div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 16, color: pvpResult.winner_id === currentUser?.id ? T.gold : "#ef4444", fontWeight: 700 }}>
            {pvpResult.winner_id === currentUser?.id ? "🏆 انتصرت!" : "💀 خسرت"}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: T.muted, marginTop: 6 }}>
            قوتك: {pvpResult.challenger_score} | قوة {pvpResult.defender_name}: {pvpResult.defender_score}
            {pvpResult.winner_id === currentUser?.id && <span style={{ color: T.gold }}> | +10 نقطة موسم</span>}
          </div>
          <button onClick={() => setPvpResult(null)} style={{
            marginTop: 8, background: "none", border: `1px solid ${T.border}`,
            color: T.muted, fontFamily: "monospace", fontSize: 10, padding: "3px 10px", borderRadius: 6, cursor: "pointer"
          }}>إغلاق</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 12, color: T.muted, padding: 40 }}>
          LOADING RANKING DATA...
        </div>
      ) : rows.length === 0 ? (
        <div style={{
          ...glass({ padding: 32 }), textAlign: "center",
          fontFamily: "monospace", fontSize: 13, color: T.muted
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🌑</div>
          لا يوجد صيادون بعد
          <div style={{ fontSize: 11, marginTop: 8 }}>سجّل دخولك وكن أول من يظهر!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((p, i) => {
            const rank = rankFromLevel(p.level);
            const isMe = currentUser && p.discord_id === currentUser.id;
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <div key={p.discord_id} style={{
                ...glass({ padding: "14px 18px" }),
                display: "flex", alignItems: "center", gap: 14,
                border: isMe ? `1px solid ${T.gold}` : `1px solid ${T.border}`,
                boxShadow: isMe ? `0 0 16px ${T.gold}30` : undefined,
                animation: `fadeUp 0.3s ease-out ${i * 0.03}s both`,
              }}>
                <div style={{ width: 32, textAlign: "center", fontFamily: "'Orbitron', monospace", fontSize: i < 3 ? 20 : 13, color: i < 3 ? T.gold : T.muted }}>
                  {i < 3 ? medals[i] : `#${i + 1}`}
                </div>
                <div onClick={() => openProfile(p)} style={{ cursor: "pointer", position: "relative", flexShrink: 0 }}
                  title={`عرض بروفايل ${p.username}`}>
                  {p.avatar ? (
                    <img src={`https://cdn.discordapp.com/avatars/${p.discord_id}/${p.avatar}.png?size=40`}
                      style={{ width: 42, height: 42, borderRadius: "50%", border: `2px solid ${rank.color}`, display: "block", transition: "transform 0.2s, box-shadow 0.2s", boxShadow: `0 0 0 0 ${rank.color}` }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.12)"; e.currentTarget.style.boxShadow = `0 0 12px ${rank.color}80`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }} />
                  ) : (
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: `${rank.color}30`, border: `2px solid ${rank.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: 16, color: rank.color, transition: "transform 0.2s", cursor: "pointer" }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.12)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
                      {p.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: "50%", background: "#5865f2", border: "2px solid #04000f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="7" height="7" viewBox="0 0 10 10" fill="white"><circle cx="5" cy="5" r="4" /></svg>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 13, color: isMe ? T.gold : T.text, fontWeight: isMe ? 700 : 400 }}>
                      {p.username} {isMe && "(أنت)"}
                    </span>
                    <span style={{ fontFamily: "monospace", fontSize: 9, color: rank.color, letterSpacing: 1 }}>
                      {rank.title}
                    </span>
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: T.muted, marginTop: 2 }}>
                    Lv.{p.level} · {p.season_points || 0} نقطة موسم
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 14, color: T.cyan, fontWeight: 700 }}>
                    {(p.power ?? 0).toLocaleString()}
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: T.muted }}>POWER</div>
                </div>
                {currentUser && !isMe && (
                  <button
                    onClick={() => handleChallenge(p.discord_id, p.username)}
                    disabled={!!fighting}
                    style={{
                      background: fighting === p.discord_id ? `${T.purple}30` : "rgba(139,92,246,0.15)",
                      border: `1px solid ${T.purple}`,
                      color: T.purple, fontFamily: "monospace", fontSize: 10,
                      padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                      opacity: fighting && fighting !== p.discord_id ? 0.4 : 1,
                    }}
                  >
                    {fighting === p.discord_id ? "⚔️..." : "⚔️ تحدٍّ"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: "center", fontFamily: "monospace", fontSize: 10, color: T.muted }}>
        يتحدث تلقائياً كل 30 ثانية · {rows.length} لاعب مسجل
      </div>

      {selectedPlayer && (
        <ProfileModal
          player={selectedPlayer}
          profileData={profileData}
          loading={profileLoading}
          currentUser={currentUser}
          onClose={() => { setSelectedPlayer(null); setProfileData(null); }}
          onChallenge={(id, name) => { setSelectedPlayer(null); handleChallenge(id, name); }}
        />
      )}
    </div>
  );
}

// ─── BOSS THREAT TIER ─────────────────────────────────────────────────────────
function threatTier(maxHp = 0) {
  if (maxHp >= 1000000) return { label: "تهديد: مدمّر مطلق", color: "#ff0055" };
  if (maxHp >= 300000) return { label: "تهديد: كارثي", color: "#ef4444" };
  if (maxHp >= 50000) return { label: "تهديد: خطير جداً", color: "#f59e0b" };
  return { label: "تهديد: متوسط", color: T.gold };
}

// ─── DAILY ATTACK LIMIT ──────────────────────────────────────────────────────
const WB_ATTACKS_KEY = "wb_daily_attacks";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadDailyAttacks(userId) {
  try {
    const data = JSON.parse(localStorage.getItem(WB_ATTACKS_KEY) || "{}");
    const entry = data[userId || "guest"];
    return entry && entry.date === todayKey() ? entry.count : 0;
  } catch {
    return 0;
  }
}

function saveDailyAttacks(userId, count) {
  try {
    const data = JSON.parse(localStorage.getItem(WB_ATTACKS_KEY) || "{}");
    data[userId || "guest"] = { date: todayKey(), count };
    localStorage.setItem(WB_ATTACKS_KEY, JSON.stringify(data));
  } catch {}
}

// ─── TIMESTAMP HELPER ──────────────────────────────────────────────────────────
// Normalizes any timestamp shape coming from the API (number, numeric string,
// ISO date string, unix seconds, or unix milliseconds) into a valid epoch-ms
// number, or returns null when the value cannot be trusted. This is the single
// source of truth for parsing starts_at / ends_at so the timers can never
// render NaN.
function parseTimestampMs(value) {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    // Heuristic: unix-seconds values are ~10 digits, ms values are ~13 digits
    return value < 1e12 ? value * 1000 : value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Pure numeric string (epoch seconds or ms)
    if (/^\d+$/.test(trimmed)) {
      const n = Number(trimmed);
      if (!Number.isFinite(n)) return null;
      return trimmed.length <= 10 ? n * 1000 : n;
    }

    // ISO date string / anything Date can parse (Postgres/Supabase timestamps)
    const parsed = Date.parse(trimmed);
    if (Number.isFinite(parsed)) return parsed;

    return null;
  }

  return null;
}

// Formats a millisecond diff as "Hس Mد Sث", clamped at zero.
function formatCountdown(diffMs) {
  const safeDiff = Math.max(0, diffMs);
  const h = Math.floor(safeDiff / 3600000);
  const m = Math.floor((safeDiff % 3600000) / 60000);
  const s = Math.floor((safeDiff % 60000) / 1000);
  return `${h}س ${m}د ${s}ث`;
}

// ─── WORLD BOSS PAGE ──────────────────────────────────────────────────────────
export function WorldBossPage({ fetchBoss, attackBoss, currentUser, state }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attacking, setAttacking] = useState(false);
  const [lastHit, setLastHit] = useState(null);
  const [showCrit, setShowCrit] = useState(false);

  const DAILY_LIMIT = 10;
  const [attackCount, setAttackCount] = useState(() => loadDailyAttacks(currentUser?.id));
  const [notification, setNotification] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [respawnLeft, setRespawnLeft] = useState("");

  useEffect(() => {
    setAttackCount(loadDailyAttacks(currentUser?.id));
  }, [currentUser?.id]);

  const showNotification = (msg, color = T.gold) => {
    setNotification({ msg, color });
    setTimeout(() => setNotification(null), 3500);
  };

  const load = useCallback(async () => {
    const d = await fetchBoss();
    setData(d);
    setLoading(false);
  }, [fetchBoss]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const endsAt = parseTimestampMs(data?.boss?.ends_at);
    if (data?.boss?.status === "respawning") { setTimeLeft(""); return; }
    if (endsAt === null) {
      // No valid timestamp from the API — never render NaN, show a safe placeholder instead.
      setTimeLeft(data?.boss ? "Waiting for respawn..." : "");
      return;
    }
    const tick = () => {
      const diff = endsAt - Date.now();
      if (diff <= 0) { setTimeLeft("انتهت الجولة"); return; }
      setTimeLeft(formatCountdown(diff));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data?.boss?.ends_at, data?.boss?.status, data?.boss]);

  useEffect(() => {
    const startsAt = parseTimestampMs(data?.boss?.starts_at);
    if (data?.boss?.status !== "respawning") { setRespawnLeft(""); return; }
    if (startsAt === null) {
      // status says "respawning" but starts_at is missing/invalid — show a safe
      // placeholder instead of NaN while we wait for the API to send a real value.
      setRespawnLeft("Waiting for respawn...");
      return;
    }
    const tick = () => {
      const diff = startsAt - Date.now();
      if (diff <= 0) { setRespawnLeft("يعود الآن..."); load(); return; }
      setRespawnLeft(formatCountdown(diff));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data?.boss?.starts_at, data?.boss?.status, load]);

  const handleAttack = async () => {
    if (attackCount >= DAILY_LIMIT) {
      showNotification(`⚠️ استنفدت ضرباتك الـ${DAILY_LIMIT} لهذا اليوم! ترجع غداً.`, "#ef4444");
      return;
    }
    if (!currentUser || attacking) return;
    setAttacking(true);
    const str = state?.stats?.STR || 10;
    const level = state?.level || 1;

    const result = await attackBoss(str, level);
    setAttacking(false);

    if (result && result.damage) {
      setLastHit(result);
      if (result.is_crit) {
        setShowCrit(true);
        setTimeout(() => setShowCrit(false), 1200);
      }
      setAttackCount(prev => {
        const next = prev + 1;
        saveDailyAttacks(currentUser?.id, next);
        return next;
      });
      if (result.rewards) {
        const medals = ["🥇", "🥈", "🥉"];
        const lines = result.rewards.map((r, i) => `${medals[i] || ""} ${r.username}: +${Number(r.exp_reward).toLocaleString()} EXP`).join("  |  ");
        showNotification(`🏆 جوائز البوس — ${lines}`, T.gold);
      }
      if (result.is_dead) {
        showNotification("💀 البوس سقط! الجوائز تُوزَّع على أعلى 3 لاعبين بالضرر", "#22d3ee");
      }
      await load();
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: T.muted, fontFamily: "monospace", fontSize: 12 }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", border: `2px solid #ef444440`, borderTopColor: "#ef4444", animation: "rotateClockwise 0.9s linear infinite" }} />
        فتح البوابة...
      </div>
    );
  }

  const boss = data?.boss;
  const ranking = data?.ranking || [];
  const isRespawning = boss?.status === "respawning";
  const tier = boss ? threatTier(boss.max_hp) : { color: "#ef4444", label: "تهديد: قاتل" };
  const hpPct = boss && !isRespawning ? Math.max(0, Math.min(100, (boss.current_hp / boss.max_hp) * 100)) : 0;
  const isExhausted = attackCount >= DAILY_LIMIT;
  const isDisabled = attacking || (boss && !isRespawning && boss.is_dead) || isExhausted;

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80, padding: "80px 24px 40px", maxWidth: 700, margin: "0 auto", animation: "pageInRight 0.4s ease-out both" }}>
      <style>{`
        @keyframes bossGateGlow { 0%,100%{ opacity:.55; transform:scale(1); } 50%{ opacity:.85; transform:scale(1.03); } }
        @keyframes emberRiseBoss { 0%{ transform:translateY(0) scale(1); opacity:0; } 15%{ opacity:.9; } 100%{ transform:translateY(-200px) translateX(var(--ex,0)); opacity:0; scale:0.3; } }
        @keyframes hpShimmer { from{ transform:translateX(-130%); } to{ transform:translateX(280%); } }
        @keyframes nameFlicker { 0%,100%{ filter:drop-shadow(0 0 14px #ef4444aa); } 50%{ filter:drop-shadow(0 0 30px #ff0055ee); } }
        @keyframes critPop { 0%{ transform:scale(0.5) translateY(0); opacity:1; } 60%{ transform:scale(1.4) translateY(-30px); opacity:1; } 100%{ transform:scale(1) translateY(-60px); opacity:0; } }
        @keyframes portalPulse { 0%,100%{ box-shadow:0 0 40px #ef444455, 0 0 80px #ff005530; } 50%{ box-shadow:0 0 70px #ef4444aa, 0 0 140px #ff005560; } }
        @keyframes portalRing { 0%{ transform:rotate(0deg) scale(1); opacity:.7; } 50%{ transform:rotate(180deg) scale(1.08); opacity:1; } 100%{ transform:rotate(360deg) scale(1); opacity:.7; } }
        @keyframes respawnPulse { 0%,100%{ opacity:.6; } 50%{ opacity:1; } }
      `}</style>

      {notification && (
        <div style={{
          position: "fixed", top: 80, right: 20, left: 20, zIndex: 1000,
          ...glass({ padding: "14px 20px" }),
          border: `1px solid ${notification.color}`,
          color: notification.color,
          fontFamily: "monospace", fontSize: 12, textAlign: "center",
          animation: "fadeUp 0.3s ease-out",
        }}>
          {notification.msg}
        </div>
      )}

      {showCrit && (
        <div style={{
          position: "fixed", top: "38%", left: "50%", transform: "translateX(-50%)",
          zIndex: 2000, fontFamily: "'Orbitron', monospace", fontSize: 40, fontWeight: 900,
          color: "#fbbf24", textShadow: "0 0 30px #fbbf24, 0 0 60px #ff0055",
          animation: "critPop 1.2s ease-out forwards", pointerEvents: "none",
        }}>
          ✦ CRITICAL ✦
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e", animation: "pulseOpacity 1.4s infinite" }} />
          <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 4, color: "#ef4444" }}>◈ WORLD BOSS GATE — مفتوحة دائماً</span>
        </div>
        <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: 24, fontWeight: 700, color: T.text }}>الزنزانة المزدوجة</h2>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: T.muted, marginTop: 4 }}>
          الضربات اليومية: <span style={{ color: isExhausted ? "#ef4444" : T.gold, fontWeight: 700 }}>{attackCount} / {DAILY_LIMIT}</span>
          {isExhausted && <span style={{ color: "#ef4444", marginRight: 8 }}> — استنفدت حصتك اليوم</span>}
        </div>
      </div>

      {!boss ? (
        <div style={{ ...glass({ padding: "56px 28px" }), textAlign: "center", position: "relative", overflow: "hidden", border: `1px solid #ef444455`, animation: "portalPulse 3s ease-in-out infinite" }}>
          <div style={{ position: "absolute", inset: -60, opacity: 0.08, pointerEvents: "none", background: "conic-gradient(from 0deg, #ef4444, #ff0055, transparent 30%, #ef4444 60%, transparent)", animation: "auraSpin 10s linear infinite" }} />
          <div style={{ position: "relative" }}>
            <div style={{ width: 110, height: 110, margin: "0 auto 20px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #ef444480", animation: "portalRing 4s linear infinite" }} />
              <div style={{ position: "absolute", inset: 8, borderRadius: "50%", border: "1px dashed #ff005560", animation: "portalRing 6s linear infinite reverse" }} />
              <div style={{ position: "absolute", inset: 20, borderRadius: "50%", background: "radial-gradient(circle, #ef444440, transparent 70%)" }} />
              <span style={{ fontSize: 42, filter: "drop-shadow(0 0 16px #ef4444)" }}>🌀</span>
            </div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 18, color: "#ef4444", fontWeight: 700, letterSpacing: 1 }}>البوابة مفتوحة — لا يوجد بوس نشط</div>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: T.muted, marginTop: 10 }}>
              جولة جديدة قادمة. عُد بعد قليل لتكون أول من يضرب.
            </div>
          </div>
        </div>

      ) : isRespawning ? (
        <div style={{ ...glass({ padding: "56px 28px" }), textAlign: "center", position: "relative", overflow: "hidden", border: "1px solid #6b21a855" }}>
          <div style={{ position: "absolute", inset: -60, opacity: 0.06, pointerEvents: "none", background: "conic-gradient(from 0deg, #a855f7, transparent, #a855f7)", animation: "auraSpin 12s linear infinite" }} />
          <div style={{ position: "relative" }}>
            <div style={{ width: 110, height: 110, margin: "0 auto 20px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #a855f780", animation: "portalRing 5s linear infinite" }} />
              <div style={{ position: "absolute", inset: 10, borderRadius: "50%", border: "1px dashed #7c3aed60", animation: "portalRing 8s linear infinite reverse" }} />
              <div style={{ position: "absolute", inset: 22, borderRadius: "50%", background: "radial-gradient(circle, #7c3aed35, transparent 70%)" }} />
              <span style={{ fontSize: 42, filter: "drop-shadow(0 0 16px #a855f7)", animation: "respawnPulse 1.4s ease-in-out infinite" }}>💀</span>
            </div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 18, color: "#a855f7", fontWeight: 700, letterSpacing: 1 }}>البوس سقط — يعود من الظلام</div>
            {respawnLeft && (
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 32, color: "#ef4444", fontWeight: 900, margin: "18px 0 8px", textShadow: "0 0 20px #ef444490" }}>
                {respawnLeft}
              </div>
            )}
            <div style={{ fontFamily: "monospace", fontSize: 11, color: T.muted }}>
              استعدّ — بعد انتهاء العداد يعود البوس أقوى
            </div>
          </div>
        </div>

      ) : (
        <>
          <div style={{ ...glass({ padding: "30px" }), marginBottom: 20, border: `1px solid ${tier.color}70`, position: "relative", overflow: "hidden", boxShadow: `0 0 50px ${tier.color}30, 0 10px 40px rgba(0,0,0,0.5)`, animation: "portalPulse 4s ease-in-out infinite" }}>
            <div style={{ position: "absolute", inset: -60, opacity: 0.1, pointerEvents: "none", background: `conic-gradient(from 0deg, ${tier.color}, #ff0055, transparent 30%, ${tier.color} 65%, transparent)`, animation: "auraSpin 8s linear infinite" }} />
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 115%, ${tier.color}35, transparent 55%)`, pointerEvents: "none" }} />
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
              {[8, 22, 38, 55, 70, 84].map((left, i) => (
                <span key={i} style={{
                  position: "absolute", bottom: 0, left: `${left}%`, width: i % 2 ? 2 : 3, height: i % 2 ? 2 : 3, borderRadius: "50%",
                  background: i % 3 ? tier.color : "#ff0055", boxShadow: `0 0 8px ${tier.color}`,
                  animation: `emberRiseBoss ${3 + i * 0.45}s ease-in infinite`, animationDelay: `${i * 0.55}s`,
                  "--ex": `${(i % 2 ? 1 : -1) * (10 + i * 3)}px`,
                }} />
              ))}
            </div>

            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, letterSpacing: 2, color: tier.color, background: `${tier.color}1a`, border: `1px solid ${tier.color}55`, borderRadius: 5, padding: "3px 9px" }}>
                  {tier.label}
                </span>
                {timeLeft && (
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: T.muted }}>⏳ ينتهي خلال: {timeLeft}</span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
                <div style={{ width: 72, height: 72, flexShrink: 0, borderRadius: "50%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${tier.color}90`, animation: "portalRing 3.5s linear infinite" }} />
                  <div style={{ position: "absolute", inset: 8, borderRadius: "50%", border: `1px dashed ${tier.color}60`, animation: "portalRing 5s linear infinite reverse" }} />
                  <div style={{ position: "absolute", inset: 18, borderRadius: "50%", background: `radial-gradient(circle, ${tier.color}50, transparent 70%)` }} />
                  <span style={{ fontSize: 26, filter: `drop-shadow(0 0 12px ${tier.color})` }}>👹</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: T.muted, marginBottom: 4, letterSpacing: 2 }}>WORLD BOSS</div>
                  <div style={{
                    fontFamily: "'Orbitron', monospace", fontSize: 22, fontWeight: 900, letterSpacing: 1,
                    color: tier.color, animation: "nameFlicker 2.4s ease-in-out infinite", textShadow: `0 0 24px ${tier.color}90`,
                  }}>
                    {boss.name}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: T.muted }}>❤️ نقاط الحياة</span>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 12, color: tier.color, fontWeight: 700 }}>
                    {Number(boss.current_hp).toLocaleString()} / {Number(boss.max_hp).toLocaleString()} ({hpPct.toFixed(1)}%)
                  </span>
                </div>
                <div style={{ height: 18, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden", position: "relative", border: `1px solid ${tier.color}30` }}>
                  <div style={{
                    height: "100%", width: `${hpPct}%`,
                    background: hpPct > 50 ? `linear-gradient(90deg, ${tier.color}, #ff0055)` : hpPct > 20 ? "linear-gradient(90deg, #f59e0b, #ef4444)" : "linear-gradient(90deg, #ef4444, #7f1d1d)",
                    borderRadius: 99, transition: "width 0.6s ease",
                    boxShadow: `0 0 16px ${tier.color}90`, position: "relative", overflow: "hidden",
                  }}>
                    {hpPct > 0 && <div style={{ position: "absolute", top: 0, bottom: 0, width: "30%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)", animation: "hpShimmer 2s linear infinite" }} />}
                  </div>
                </div>
              </div>

              {lastHit && (
                <div style={{
                  ...glass({ padding: "10px 16px" }), marginBottom: 12,
                  border: `1px solid ${lastHit.is_crit ? "#fbbf2460" : `${T.cyan}40`}`,
                  animation: "fadeUp 0.3s ease-out",
                  background: lastHit.is_crit ? "rgba(251,191,36,0.08)" : undefined,
                }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: lastHit.is_crit ? "#fbbf24" : T.cyan }}>
                    {lastHit.is_crit ? "✦ CRITICAL HIT! " : "⚔️ "}
                    ضربتك: <strong style={{ color: lastHit.is_crit ? "#fbbf24" : T.gold, fontSize: lastHit.is_crit ? 15 : 12 }}>{Number(lastHit.damage).toLocaleString()}</strong> ضرر
                    {lastHit.daily_damage && <span style={{ color: T.muted, fontSize: 11 }}> | يومي: {Number(lastHit.daily_damage).toLocaleString()}</span>}
                    {lastHit.is_dead && <span style={{ color: T.gold }}> 💀 قتلت البوس!</span>}
                  </span>
                </div>
              )}

              {!currentUser ? (
                <div style={{ fontFamily: "monospace", fontSize: 12, color: T.gold, textAlign: "center", padding: 14, border: `1px solid ${T.gold}40`, borderRadius: 10 }}>
                  سجّل دخولك للهجوم على البوس
                </div>
              ) : (
                <button
                  onClick={handleAttack}
                  disabled={isDisabled}
                  style={{
                    width: "100%", padding: "17px 0",
                    background: isDisabled ? "rgba(0,0,0,0.3)" : attacking ? `${tier.color}30` : `linear-gradient(180deg, ${tier.color}35, ${tier.color}12)`,
                    border: `1px solid ${isDisabled ? T.border : tier.color}`,
                    color: isDisabled ? T.muted : tier.color,
                    fontFamily: "'Orbitron', monospace", fontSize: 15, fontWeight: 900,
                    borderRadius: 10, cursor: isDisabled ? "default" : "pointer",
                    letterSpacing: 2, transition: "all 0.2s",
                    boxShadow: isDisabled ? "none" : `0 0 22px ${tier.color}40`,
                  }}
                >
                  {boss.is_dead ? "✅ البوس سقط" : isExhausted ? `🚫 استنفدت ضرباتك اليوم (${DAILY_LIMIT}/${DAILY_LIMIT})` : attacking ? "⚔️ يهجم..." : `⚔️ هجوم (${DAILY_LIMIT - attackCount} متبقية)`}
                </button>
              )}
            </div>
          </div>

          {ranking.length > 0 && (
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, color: T.muted, marginBottom: 12 }}>🏆 ترتيب الضرر — أعلى 3 يحصلون على جوائز البوس</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ranking.map((r, i) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  const rewardLabels = ["5,000,000", "2,000,000", "800,000"];
                  const isMe = currentUser && r.discord_id === currentUser.id;
                  return (
                    <div key={r.discord_id} style={{
                      ...glass({ padding: "12px 16px" }),
                      display: "flex", alignItems: "center", gap: 12,
                      border: isMe ? `1px solid ${T.gold}` : i < 3 ? `1px solid ${tier.color}40` : `1px solid ${T.border}`,
                      animation: `fadeUp 0.3s ease-out ${i * 0.05}s both`,
                    }}>
                      <span style={{ width: 28, fontFamily: "monospace", fontSize: i < 3 ? 18 : 12, color: T.gold }}>{i < 3 ? medals[i] : `#${i + 1}`}</span>
                      <span style={{ flex: 1, fontFamily: "monospace", fontSize: 12, color: isMe ? T.gold : T.text }}>{r.username} {isMe && "(أنت)"}</span>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, color: tier.color, fontWeight: 700 }}>{Number(r.total_damage).toLocaleString()}</div>
                        {i < 3 && <div style={{ fontFamily: "monospace", fontSize: 10, color: "#22d3ee" }}>+{rewardLabels[i]} EXP</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── EMOJI PICKER DATA ────────────────────────────────────────────────────────
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "⚔️", "💀", "👑", "🎉", "💪", "🌟", "✨", "🏆", "💎", "🎯", "👊", "🤝"];

// ─── RANK COLORS (for chat badges) ───────────────────────────────────────────
function rankColor(level = 1) {
  if (level >= 90) return { color: "#fbbf24", title: "SSS" };
  if (level >= 70) return { color: "#a855f7", title: "SS" };
  if (level >= 50) return { color: "#22d3ee", title: "S" };
  if (level >= 35) return { color: "#60a5fa", title: "A" };
  if (level >= 20) return { color: "#fbbf24", title: "B" };
  if (level >= 10) return { color: "#22d3ee", title: "C" };
  if (level >= 5) return { color: "#9ca3af", title: "D" };
  return { color: "#ef4444", title: "E" };
}

// ─── CHAT AVATAR ─────────────────────────────────────────────────────────────
function ChatAvatar({ user, size = 36, level = 1 }) {
  const rank = rankColor(level);
  const src = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.discord_id || user.id}/${user.avatar}.png?size=64`
    : null;
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {src ? (
        <img src={src} alt={user.username}
          style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${rank.color}80`, objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{ width: size, height: size, borderRadius: "50%", background: `${rank.color}25`, border: `2px solid ${rank.color}80`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: size * 0.4, color: rank.color, fontWeight: 700 }}>
          {(user?.username || "?")[0].toUpperCase()}
        </div>
      )}
      <div style={{ position: "absolute", bottom: -2, right: -2, background: rank.color, borderRadius: 4, padding: "1px 4px", fontSize: 8, fontFamily: "monospace", fontWeight: 700, color: "#000", border: "1px solid rgba(0,0,0,0.4)", lineHeight: 1.4 }}>
        {rank.title}
      </div>
    </div>
  );
}

// ─── SINGLE MESSAGE ───────────────────────────────────────────────────────────
function ChatMessage({ msg, currentUser, onReply, onReact, onDelete, onProfile, isAdmin }) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const isMe = currentUser && (msg.discord_id === currentUser.id);
  const rank = rankColor(msg.level || 1);
  const timeStr = (() => {
    const d = new Date(msg.created_at);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "الآن";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}د`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}س`;
    return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
  })();

  const reactions = {};
  const reactionsRaw = msg.reactions || [];
  const reactionsArr = Array.isArray(reactionsRaw)
    ? reactionsRaw
    : Object.entries(reactionsRaw).flatMap(([emoji, val]) =>
      Array.isArray(val) ? val.map(v => ({ emoji, ...v }))
        : typeof val === 'number' ? Array(val).fill({ emoji })
          : [{ emoji, ...val }]
    );
  reactionsArr.forEach(r => {
    if (!reactions[r.emoji]) reactions[r.emoji] = { count: 0, mine: false };
    reactions[r.emoji].count++;
    if (currentUser && r.discord_id === currentUser.id) reactions[r.emoji].mine = true;
  });

  return (
    <div
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false); }}
      style={{ display: "flex", gap: 10, padding: "6px 16px", alignItems: "flex-start", position: "relative", transition: "background 0.15s", background: showActions ? "rgba(139,92,246,0.04)" : "transparent", borderRadius: 8 }}
    >
      <div onClick={() => onProfile && onProfile(msg)} style={{ cursor: "pointer", marginTop: 2 }}>
        <ChatAvatar user={{ username: msg.username, avatar: msg.avatar, id: msg.discord_id }} size={36} level={msg.level || 1} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
          <span
            onClick={() => onProfile && onProfile(msg)}
            style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: rank.color, cursor: "pointer" }}
          >
            {msg.username}
          </span>
          <span style={{ fontFamily: "monospace", fontSize: 10, color: "#374151" }}>{timeStr}</span>
          {msg.is_admin && (
            <span style={{ fontFamily: "monospace", fontSize: 9, color: "#fbbf24", background: "rgba(251,191,36,0.15)", border: "1px solid #fbbf2440", borderRadius: 4, padding: "1px 6px" }}>ADMIN</span>
          )}
          {isMe && (
            <span style={{ fontFamily: "monospace", fontSize: 9, color: "#6b7280" }}>أنت</span>
          )}
        </div>
        {msg.reply_to_content && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, padding: "4px 10px", background: "rgba(139,92,246,0.08)", borderLeft: "2px solid #a855f780", borderRadius: "0 6px 6px 0" }}>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#a855f7" }}>↩ {msg.reply_to_username}</span>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{msg.reply_to_content}</span>
          </div>
        )}
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#e9d5ff", lineHeight: 1.6, wordBreak: "break-word", direction: "rtl", textAlign: "right" }}>
          {msg.content}
        </div>
        {Object.keys(reactions).length > 0 && (
          <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
            {Object.entries(reactions).map(([emoji, { count, mine }]) => (
              <button key={emoji} onClick={() => onReact(msg.id, emoji)}
                style={{ display: "flex", alignItems: "center", gap: 4, background: mine ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${mine ? "#a855f780" : "rgba(255,255,255,0.1)"}`, borderRadius: 20, padding: "2px 9px", cursor: "pointer", fontSize: 13, fontFamily: "monospace", color: mine ? "#a855f7" : "#9ca3af", transition: "all 0.15s" }}>
                {emoji} <span style={{ fontSize: 11 }}>{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {showActions && currentUser && (
        <div style={{ position: "absolute", left: 16, top: 4, display: "flex", gap: 4, background: "rgba(10,4,32,0.95)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 10, padding: "4px 6px", zIndex: 10, backdropFilter: "blur(12px)" }}>
          <button onClick={() => onReply(msg)} title="رد"
            style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 15, padding: "3px 6px", borderRadius: 6, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(139,92,246,0.15)"; e.currentTarget.style.color = "#a855f7"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#6b7280"; }}>
            ↩
          </button>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowEmojiPicker(p => !p)} title="ريأكشن"
              style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 15, padding: "3px 6px", borderRadius: 6, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,211,238,0.15)"; e.currentTarget.style.color = "#22d3ee"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#6b7280"; }}>
              😄
            </button>
            {showEmojiPicker && (
              <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, background: "rgba(10,4,32,0.98)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 12, padding: 10, zIndex: 100, backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", display: "flex", flexWrap: "wrap", gap: 4, width: 220 }}>
                {QUICK_EMOJIS.map(e => (
                  <button key={e} onClick={() => { onReact(msg.id, e); setShowEmojiPicker(false); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 4, borderRadius: 6, transition: "background 0.1s" }}
                    onMouseEnter={el => el.currentTarget.style.background = "rgba(139,92,246,0.2)"}
                    onMouseLeave={el => el.currentTarget.style.background = "none"}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          {(isMe || isAdmin) && (
            <button onClick={() => onDelete(msg.id)} title="حذف"
              style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, padding: "3px 6px", borderRadius: 6, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#ef4444"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#6b7280"; }}>
              🗑
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CHAT PAGE ────────────────────────────────────────────────────────────────
export function ChatPage({ currentUser, fetchMessages, sendMessage, deleteMessage, addReaction, fetchProfile, state, isAdmin }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [profilePlayer, setProfilePlayer] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unread, setUnread] = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const messagesRef = useRef([]);

  const ROOM = "global";
  const MAX_CHARS = 500;

  useEffect(() => { isAtBottomRef.current = isAtBottom; }, [isAtBottom]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const load = useCallback(async (initial = false) => {
    if (!fetchMessages) return;
    let data;
    try {
      data = await fetchMessages(ROOM);
    } catch { return; }
    if (!Array.isArray(data)) return;

    if (initial) {
      setMessages(data);
      setLoading(false);
    } else {
      const ids = new Set(messagesRef.current.map(m => m.id));
      const fresh = data.filter(m => !ids.has(m.id));
      if (fresh.length) {
        setMessages(prev => [...prev, ...fresh]);
        if (!isAtBottomRef.current) setUnread(u => u + fresh.length);
      }
    }

    if (data.length) {
      const fiveMins = Date.now() - 5 * 60 * 1000;
      const unique = new Set(data.filter(m => new Date(m.created_at) > fiveMins).map(m => m.discord_id));
      setOnlineCount(unique.size || Math.min(data.length, 12));
    }
  }, [fetchMessages]);

  useEffect(() => { load(true); }, [load]);

  useEffect(() => {
    if (!fetchMessages) return;
    const id = setInterval(() => load(false), 3000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (isAtBottom) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAtBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBot = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setIsAtBottom(atBot);
    setShowScrollBtn(!atBot);
    if (atBot) setUnread(0);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnread(0);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !currentUser || sending) return;
    if (text.length > MAX_CHARS) return;
    const replyToId = replyTo?.id || null;

    const tempId = "temp_" + Date.now();
    const optimisticMsg = {
      id: tempId,
      content: text,
      username: currentUser.username,
      avatar: currentUser.avatar,
      discord_id: currentUser.id,
      level: state?.level || 1,
      created_at: new Date().toISOString(),
      reply_to: replyToId,
      reactions: {},
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setIsAtBottom(true);

    setSending(true);
    setInput("");
    setReplyTo(null);
    const result = await sendMessage(ROOM, text, replyToId);
    setSending(false);

    if (result) {
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempId);
        const ids = new Set(withoutTemp.map(m => m.id));
        return ids.has(result.id) ? withoutTemp : [...withoutTemp, result];
      });
    } else {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(text);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDelete = async (msgId) => {
    if (!window.confirm("حذف هذه الرسالة؟")) return;
    const ok = await deleteMessage(ROOM, msgId);
    if (ok) setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const handleReact = async (msgId, emoji) => {
    if (!currentUser) return;
    await addReaction(ROOM, msgId, emoji);
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const reactionsRaw2 = m.reactions || [];
      const reactions = Array.isArray(reactionsRaw2) ? [...reactionsRaw2] : [];
      const existing = reactions.findIndex(r => r.emoji === emoji && r.discord_id === currentUser.id);
      if (existing >= 0) reactions.splice(existing, 1);
      else reactions.push({ emoji, discord_id: currentUser.id });
      return { ...m, reactions };
    }));
  };

  const openProfile = async (msg) => {
    setProfilePlayer({ discord_id: msg.discord_id, username: msg.username, avatar: msg.avatar, level: msg.level || 1 });
    setProfileData(null);
    setProfileLoading(true);
    if (fetchProfile) {
      const data = await fetchProfile(msg.discord_id);
      setProfileData(data);
    }
    setProfileLoading(false);
  };

  const grouped = [];
  let lastDay = null;
  messages.forEach((msg, i) => {
    const day = new Date(msg.created_at).toDateString();
    if (day !== lastDay) {
      grouped.push({ type: "date", day, key: `date-${i}` });
      lastDay = day;
    }
    grouped.push({ type: "msg", msg, key: msg.id });
  });

  const canSend = !!currentUser && input.trim().length > 0 && input.trim().length <= MAX_CHARS;

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "radial-gradient(ellipse 70% 45% at 50% -8%, rgba(124,58,237,0.12), transparent 60%), #04000f",
      animation: "pageInRight 0.35s ease-out both",
    }}>
      <style>{`
        @keyframes chatMsgIn { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
        @keyframes typingDot { 0%,80%,100%{transform:translateY(0);opacity:.4;} 40%{transform:translateY(-5px);opacity:1;} }
        .chat-input::placeholder { color: #374151; }
        .chat-input:focus { border-color: rgba(168,85,247,0.5) !important; box-shadow: 0 0 0 2px rgba(168,85,247,0.12) !important; }
      `}</style>

      <div style={{
        flexShrink: 0, padding: "14px 20px",
        background: "rgba(10,4,32,0.85)",
        borderBottom: "1px solid rgba(139,92,246,0.2)",
        backdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingTop: 72,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💬</div>
            <div style={{ position: "absolute", bottom: -2, right: -2, width: 12, height: 12, borderRadius: "50%", background: "#22c55e", border: "2px solid #04000f", boxShadow: "0 0 8px #22c55e", animation: "pulseOpacity 2s infinite" }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 16, fontWeight: 700, color: "#e9d5ff" }}>شات الصيادين</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{onlineCount} نشط مؤخراً</span>
              <span style={{ color: "#374151", fontSize: 10 }}>·</span>
              <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, color: "#a855f7" }}>GLOBAL</span>
            </div>
          </div>
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#374151", textAlign: "left" }}>
          {messages.length} رسالة
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}
      >
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14, color: "#6b7280", fontFamily: "monospace", fontSize: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid #a855f740", borderTopColor: "#a855f7", animation: "auraSpin 0.9s linear infinite" }} />
            تحميل الرسائل...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "#374151", fontFamily: "monospace", padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 48, filter: "grayscale(0.4)" }}>💬</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>لا توجد رسائل بعد</div>
            <div style={{ fontSize: 11, color: "#374151" }}>كن أول من يبدأ المحادثة!</div>
            <div style={{ marginTop: 16, padding: "12px 20px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, fontSize: 11, color: "#fbbf24", lineHeight: 1.7, direction: "rtl" }}>
              <code style={{ color: "#22d3ee", background: "rgba(34,211,238,0.1)", padding: "1px 6px", borderRadius: 4 }}>l</code><br />
              <code style={{ color: "#22d3ee", background: "rgba(34,211,238,0.1)", padding: "1px 6px", borderRadius: 4 }}></code>
            </div>
          </div>
        ) : (
          <>
            {grouped.map((item) => {
              if (item.type === "date") {
                const label = (() => {
                  const d = new Date(item.day);
                  const now = new Date();
                  if (d.toDateString() === now.toDateString()) return "اليوم";
                  const y = new Date(now); y.setDate(now.getDate() - 1);
                  if (d.toDateString() === y.toDateString()) return "أمس";
                  return d.toLocaleDateString("ar-SA", { weekday: "long", month: "long", day: "numeric" });
                })();
                return (
                  <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", margin: "4px 0" }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(139,92,246,0.15)" }} />
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: "#374151", letterSpacing: 1 }}>{label}</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(139,92,246,0.15)" }} />
                  </div>
                );
              }
              return (
                <div key={item.key} style={{ animation: "chatMsgIn 0.2s ease-out both" }}>
                  <ChatMessage
                    msg={item.msg}
                    currentUser={currentUser}
                    onReply={setReplyTo}
                    onReact={handleReact}
                    onDelete={handleDelete}
                    onProfile={openProfile}
                    isAdmin={isAdmin}
                  />
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {showScrollBtn && (
        <div style={{ position: "absolute", bottom: 110, left: "50%", transform: "translateX(-50%)", zIndex: 50, animation: "fadeUp 0.2s ease-out" }}>
          <button onClick={scrollToBottom}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(10,4,32,0.95)", border: "1px solid rgba(168,85,247,0.5)", borderRadius: 20, padding: "7px 16px", cursor: "pointer", color: "#a855f7", fontFamily: "monospace", fontSize: 12, backdropFilter: "blur(12px)", boxShadow: "0 4px 20px rgba(0,0,0,0.6)" }}>
            {unread > 0 && <span style={{ background: "#a855f7", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{unread}</span>}
            ↓ رسائل جديدة
          </button>
        </div>
      )}

      <div style={{
        flexShrink: 0,
        background: "rgba(10,4,32,0.9)",
        borderTop: "1px solid rgba(139,92,246,0.15)",
        backdropFilter: "blur(20px)",
        padding: "10px 16px 16px",
      }}>
        {replyTo && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", marginBottom: 8, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 8 }}>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#a855f7" }}>↩ ردًا على {replyTo.username}</span>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#6b7280", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.content}</span>
            <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>✕</button>
          </div>
        )}

        {!currentUser ? (
          <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 13, color: "#6b7280", padding: "12px 0" }}>
            🔒 سجّل دخولك بديسكورد للمشاركة في الشات
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <ChatAvatar user={{ username: currentUser.username, avatar: currentUser.avatar, id: currentUser.id }} size={36} level={state?.level || 1} />
            <div style={{ flex: 1, position: "relative" }}>
              <textarea
                ref={inputRef}
                className="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`رسالة للصيادين... (Enter للإرسال)`}
                rows={1}
                maxLength={MAX_CHARS}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.25)",
                  borderRadius: 12, padding: "10px 14px", color: "#e9d5ff", fontFamily: "'Inter', sans-serif",
                  fontSize: 14, resize: "none", boxSizing: "border-box", lineHeight: 1.5,
                  direction: "rtl", transition: "border-color 0.2s, box-shadow 0.2s",
                  overflowY: "hidden",
                  maxHeight: 120, overflowY: "auto",
                }}
                onInput={e => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
              />
              {input.length > MAX_CHARS * 0.7 && (
                <div style={{ position: "absolute", bottom: 8, left: 10, fontFamily: "monospace", fontSize: 10, color: input.length >= MAX_CHARS ? "#ef4444" : "#6b7280" }}>
                  {input.length}/{MAX_CHARS}
                </div>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={!canSend || sending}
              style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: canSend ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${canSend ? "#a855f7" : "rgba(255,255,255,0.08)"}`,
                color: canSend ? "#fff" : "#374151",
                fontSize: 18, cursor: canSend ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
                boxShadow: canSend ? "0 0 16px rgba(168,85,247,0.4)" : "none",
                transform: sending ? "scale(0.92)" : "scale(1)",
              }}
            >
              {sending ? "⏳" : "↑"}
            </button>
          </div>
        )}
      </div>

      {profilePlayer && (
        <ProfileModal
          player={profilePlayer}
          profileData={profileData}
          loading={profileLoading}
          currentUser={currentUser}
          onClose={() => { setProfilePlayer(null); setProfileData(null); }}
          onChallenge={() => { }}
        />
      )}
    </div>
  );
}

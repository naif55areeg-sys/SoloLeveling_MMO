import { useState, useEffect, useRef } from "react";
import { T } from "../constants/tokens";
import { PAGES } from "../constants/gameData";

const RANKS = ["E", "D", "C", "B", "A", "S"];

export function Preloader({ onComplete }) {
  const [step, setStep] = useState("INTRO");
  const [hunterName, setHunterName] = useState("");
  const [powerLevel, setPowerLevel] = useState(0);
  const [currentRankIndex, setCurrentRankIndex] = useState(0);
  const [msg, setMsg] = useState("SYSTEM STATUS: DORMANT... AWAITING SOVEREIGN");
  const [shake, setShake] = useState(false);
  const [rankFlash, setRankFlash] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const audioGate = useRef(null);
  const audioScan = useRef(null);
  const audioRankUp = useRef(null);
  const audioAwakening = useRef(null);
  const videoRef = useRef(null);

  const playSound = (audioRef) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => console.log("Audio waiting for interaction."));
    }
  };

  useEffect(() => {
    if (step !== "SCANNING") return;
    playSound(audioScan);

    let currentPower = 0;
    const interval = setInterval(() => {
      currentPower += Math.floor(Math.random() * 800) + 300;

      if (currentPower >= 85000) {
        setPowerLevel(85420);
        clearInterval(interval);
        if (audioScan.current) audioScan.current.pause();

        setTimeout(() => {
          setStep("RANK_UP");
        }, 800);
      } else {
        setPowerLevel(currentPower);
        setMsg(`ANALYZING HUNTER SOUL CODE... POWER LEVEL: ${currentPower}`);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step !== "RANK_UP") return;

    let index = 0;
    const rankInterval = setInterval(() => {
      if (index < RANKS.length - 1) {
        index += 1;
        setCurrentRankIndex(index);
        setRankFlash(true);
        playSound(audioRankUp);
        setTimeout(() => setRankFlash(false), 80);
        setMsg(`EVOLVING COGNITIVE CORE... RANK [ ${RANKS[index]} ]`);
      } else {
        clearInterval(rankInterval);

        setTimeout(() => {
          setStep("MONARCH");
          setShake(true);
          playSound(audioAwakening);

          if (videoRef.current) {
            videoRef.current.volume = 1.0;
          }

          setMsg("⚠️ COGNITIVE LIMITERS DESTROYED. UNKNOWN SYSTEM AUTHORITY.");

          if (document.body.animate) {
            document.body.animate(
              [
                { transform: "scale(1)" },
                { transform: "scale(1.06)" },
                { transform: "scale(1)" }
              ],
              { duration: 500, easing: "ease-out" }
            );
          }

          setTimeout(() => {
            setShake(false);
            // 🛑 تعديل جوهري: شلنا الانتقال التلقائي لـ DONE وخليناه يثبت بمرحلة السيرفر المفتوح
            setStep("AWAITING_START");
            setMsg("SYSTEM INITIALIZATION COMPLETE. READY FOR SOVEREIGN ENTRY.");
          }, 3500);
        }, 800);
      }
    }, 450);

    return () => clearInterval(rankInterval);
  }, [step]);

  const handleStartAwakening = (e) => {
    e.preventDefault();
    if (!hunterName.trim()) return;

    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 0.6;
      videoRef.current.play()
        .then(() => setIsVideoPlaying(true))
        .catch((err) => console.log("Video play failed:", err));
    }

    playSound(audioGate);
    setStep("SCANNING");
  };

  // 🚀 الدالة النهائية التي يضغطها اللاعب بنفسه متى ما بغى يدخل الموقع
  const handleFinalEnter = () => {
    setStep("DONE");
    onComplete();
  };

  if (step === "DONE") return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: (step === "MONARCH" || step === "AWAITING_START")
        ? "radial-gradient(circle at 50% 50%, #17002e 0%, #000000 100%)"
        : "#020006",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      overflow: "hidden", fontFamily: "'Orbitron', monospace",
      transform: shake ? `translate(${(Math.random() - 0.5) * 15}px, ${(Math.random() - 0.5) * 15}px)` : "none",
      transition: "background 0.5s ease",
    }}>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulseOpacity {
          0% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.4); }
          100% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.8); }
        }
        .gate-portal {
          position: absolute; z-index: 2;
          width: 600px; height: 600px; border-radius: 50%;
          border: 2px solid #8b5cf6;
          box-shadow: 0 0 50px #8b5cf6, inset 0 0 50px #8b5cf6;
          animation: spin 20s linear infinite;
          opacity: 0.15; pointer-events: none;
        }
        .start-button {
          padding: 18px 45px;
          background: linear-gradient(90deg, #a855f7, #6d28d9);
          border: 2px solid #c084fc;
          border-radius: 14px;
          color: #fff;
          font-family: 'Orbitron', sans-serif;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 5px;
          cursor: pointer;
          animation: fadeIn 0.5s ease-out, pulseGlow 1.2s infinite alternate;
          transition: all 0.3s ease;
        }
        .start-button:hover {
          transform: scale(1.05);
          filter: brightness(1.2);
        }
      `}</style>

      <audio ref={audioGate} src="/assets/gate-open.mp3" preload="auto" />
      <audio ref={audioScan} src="/assets/scan.mp3" preload="auto" loop />
      <audio ref={audioRankUp} src="/assets/rank-up.mp3" preload="auto" />
      <audio ref={audioAwakening} src="/assets/awakening.mp3" preload="auto" />

      <video
        ref={videoRef}
        src="/assets/intro-gate.mp4"
        loop
        playsInline
        style={{
          position: "absolute",
          width: "100%", height: "100%",
          objectFit: "cover",
          zIndex: 0,
          pointerEvents: "none",
          // يبقى الفيديو منور بوضوح فخم طالما اللاعب يتفرج عليه في النهاية
          opacity: (step === "MONARCH" || step === "AWAITING_START") ? 0.75 : isVideoPlaying ? 0.85 : 0,
          filter: (step === "MONARCH" || step === "AWAITING_START") ? "brightness(1.3) blur(0px)" : "brightness(0.95) blur(0px)",
          transition: "opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1), filter 2.5s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      />

      {step === "INTRO" && <div className="gate-portal" />}

      <div style={{
        position: "relative", zIndex: 5, width: "90%", maxWidth: 460, padding: "50px 35px",
        background: "rgba(3, 1, 12, 0.45)",
        border: `1.5px solid ${(step === "MONARCH" || step === "AWAITING_START") ? "#a855f7" : step === "RANK_UP" ? "#00f0ff" : "rgba(139, 92, 246, 0.2)"}`,
        boxShadow: (step === "MONARCH" || step === "AWAITING_START") ? "0 0 60px rgba(168, 85, 247, 0.4)" : "0 20px 50px rgba(0,0,0,0.6)",
        borderRadius: 24,
        backdropFilter: "blur(25px)",
        WebkitBackdropFilter: "blur(25px)",
        textAlign: "center",
        transition: "all 0.5s ease",
        animation: "zoomIn 0.5s ease-out"
      }}>

        <div style={{ fontSize: 10, letterSpacing: 6, color: T.muted, marginBottom: 30 }}>
          {(step === "MONARCH" || step === "AWAITING_START") ? "⚠️ EVOLUTION COMPLETE" : "THE SYSTEM REGISTRY"}
        </div>

        {/* 1. واجهة إدخال الاسم */}
        {step === "INTRO" && (
          <form onSubmit={handleStartAwakening} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn 0.5s" }}>
            <input
              type="text" required maxLength={14} placeholder="IDENTIFY YOURSELF, HUNTER..."
              value={hunterName} onChange={(e) => setHunterName(e.target.value)}
              style={{
                width: "100%", padding: "18px", background: "rgba(0, 0, 0, 0.7)",
                border: `1px solid ${T.purple}60`, borderRadius: 12,
                color: "#fff", fontSize: 13, letterSpacing: 3, textAlign: "center", outline: "none"
              }}
            />
            <button
              type="submit"
              style={{
                padding: "18px", background: `linear-gradient(90deg, ${T.purple}, #6d28d9)`,
                border: "none", borderRadius: 12, color: "#fff", fontSize: 12, fontWeight: 950, letterSpacing: 4,
                cursor: "pointer", boxShadow: `0 0 30px ${T.purple}60`
              }}
            >
              APPROACH S-RANK GATE ▶
            </button>
          </form>
        )}

        {/* 2. قياس القوة الصاروخي */}
        {step === "SCANNING" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, animation: "fadeIn 0.3s" }}>
            <div style={{ fontSize: 14, color: "#00f0ff", letterSpacing: 3, textShadow: "0 0 10px #00f0ff" }}>
              ANALYZING HUNTER...
            </div>
            <div style={{ fontSize: 12, color: T.muted, letterSpacing: 2 }}>POWER LEVEL</div>
            <div style={{ fontSize: 48, fontWeight: 950, color: "#fff", textShadow: "0 0 20px rgba(255,255,255,0.6)" }}>
              {powerLevel}
            </div>
          </div>
        )}

        {/* 3. قفزات الرتب المتفجرة */}
        {step === "RANK_UP" && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 140,
            opacity: rankFlash ? 0.2 : 1, filter: rankFlash ? "brightness(3)" : "none", transition: "all 0.04s"
          }}>
            <div style={{ fontSize: 14, color: T.muted, letterSpacing: 4, marginBottom: 10 }}>CURRENT EVALUATION:</div>
            <div style={{
              fontSize: 72, fontWeight: 950,
              color: RANKS[currentRankIndex] === "S" ? "#ff0055" : "#00f0ff",
              textShadow: RANKS[currentRankIndex] === "S" ? "0 0 40px #ff0055" : "0 0 25px #00f0ff"
            }}>
              {RANKS[currentRankIndex]} RANK
            </div>
          </div>
        )}

        {/* 4. انفجار الـ Monarch */}
        {step === "MONARCH" && (
          <div style={{ animation: "zoomIn 0.4s ease-out", display: "flex", flexDirection: "column", gap: 15 }}>
            <div style={{ fontSize: 13, color: "#fff", letterSpacing: 5, textShadow: "0 0 15px rgba(255,255,255,0.8)" }}>
              THE SYSTEM HAS CHOSEN YOU
            </div>
            <div style={{
              fontSize: 38, fontWeight: 950, letterSpacing: 10,
              color: "#a855f7", textShadow: "0 0 35px #a855f7, 0 0 70px #a855f7",
              animation: "pulseOpacity 0.5s infinite alternate"
            }}>
              SHADOW MONARCH
            </div>
          </div>
        )}

        {/* 5. 👑 شاشة الانتظار النهائية مع زر START الأسطوري */}
        {step === "AWAITING_START" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <div style={{ fontSize: 24, fontWeight: 950, color: "#fff", letterSpacing: 4, textShadow: "0 0 15px #a855f7" }}>
              WELCOME, MONARCH {hunterName.toUpperCase()}
            </div>

            <button className="start-button" onClick={handleFinalEnter}>
              START GAME ▶
            </button>
          </div>
        )}

        <div style={{
          marginTop: 40, fontFamily: "monospace", fontSize: 10, letterSpacing: 2,
          color: (step === "MONARCH" || step === "AWAITING_START") ? "#a855f7" : step === "SCANNING" ? "#00f0ff" : T.muted,
          minHeight: 15, fontWeight: 700
        }}>
          {msg}
        </div>

      </div>
    </div>
  );
}

const NAV_PAGES = [
  { id: "HOME",   label: "HOME",   icon: "⌂" },
  { id: "QUESTS", label: "QUESTS", icon: "📋" },
  { id: "STATS",  label: "STATS",  icon: "📊" },
  { id: "GATES",  label: "GATES",  icon: "🌀" },
  { id: "RANK",   label: "RANK",   icon: "🏅" },
  { id: "LOOT",   label: "LOOT",   icon: "🎁" },
  { id: "MMO",    label: "RANKING", icon: "🌍", mmo: true },
  { id: "BOSS",   label: "BOSS",   icon: "💀", mmo: true, bossColor: true },
];

export function Nav({ activePage, onNavigate, level, statPoints }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(10,4,32,0.85)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: `1px solid rgba(139,92,246,0.18)`,
      boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
      padding: "0 16px", height: 56,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      animation: "navDrop 0.5s ease-out both",
    }}>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700, letterSpacing: 3, color: T.purple, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.purple, boxShadow: `0 0 8px ${T.purple}` }} />
        SL
      </div>

      <div style={{ display: "flex", gap: 2, overflowX: "auto", scrollbarWidth: "none" }}>
        {NAV_PAGES.map(({ id, label, icon, mmo, bossColor }) => {
          const active = activePage === id;
          const color = bossColor ? "#ef4444" : mmo ? T.cyan : T.purple;
          return (
            <button key={id} onClick={() => onNavigate(id)} style={{
              background: active ? `${color}18` : "none",
              border: active ? `1px solid ${color}60` : "1px solid transparent",
              cursor: "pointer", padding: "5px 10px", borderRadius: 6,
              fontFamily: "'Rajdhani', monospace", fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
              color: active ? color : T.muted,
              transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0,
            }}>
              <span style={{ marginRight: 4 }}>{icon}</span>
              {label}
              {id === "STATS" && statPoints > 0 && (
                <span style={{ marginLeft: 4, background: T.gold, color: "#000", borderRadius: 9, padding: "1px 5px", fontSize: 9, fontWeight: 900 }}>
                  {statPoints}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "monospace", fontSize: 10, color: T.muted, flexShrink: 0 }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
        LV.{level}
      </div>
    </nav>
  );
}
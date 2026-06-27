// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
export const T = {
  bg: "#04000f",
  surface: "rgba(10,4,32,0.72)",
  border: "rgba(139,92,246,0.18)",
  glow: "#7c3aed",
  glowBlue: "#1d4ed8",
  purple: "#a855f7",
  blue: "#60a5fa",
  cyan: "#22d3ee",
  text: "#e9d5ff",
  muted: "#6b7280",
  gold: "#fbbf24",
  red: "#ef4444",
  green: "#10b981",
};

export const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: radial-gradient(ellipse 70% 45% at 50% -8%, rgba(124,58,237,0.22), transparent 60%), radial-gradient(ellipse 50% 35% at 100% 100%, rgba(34,211,238,0.08), transparent 60%), ${T.bg}; color: ${T.text}; font-family: 'Inter', sans-serif; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.glow}; border-radius: 2px; }
  input, select { font-family: 'Inter', sans-serif; outline: none; }
  button { font-family: inherit; }

  @keyframes pulse-ring { 0%{transform:scale(0.85);opacity:.8;} 50%{transform:scale(1.08);opacity:.3;} 100%{transform:scale(0.85);opacity:.8;} }
  @keyframes scanline { 0%{transform:translateY(-100%);} 100%{transform:translateY(100vh);} }
  @keyframes flicker { 0%,100%{opacity:1;} 92%{opacity:1;} 93%{opacity:.4;} 94%{opacity:1;} 97%{opacity:.7;} 98%{opacity:1;} }
  @keyframes orbit { from{transform:rotate(0deg) translateX(90px) rotate(0deg);} to{transform:rotate(360deg) translateX(90px) rotate(-360deg);} }
  @keyframes counter-orbit { from{transform:rotate(0deg) translateX(70px) rotate(0deg);} to{transform:rotate(-360deg) translateX(70px) rotate(360deg);} }
  @keyframes float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
  @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
  @keyframes fadeOutShrink { from{opacity:1;transform:scale(1);} to{opacity:0;transform:scale(1.04);} }
  @keyframes navDrop { from{opacity:0;transform:translateY(-60px);} to{opacity:1;transform:translateY(0);} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
  @keyframes fadeUpSmall { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }
  @keyframes pageInRight { from{opacity:0;transform:translateX(40px);} to{opacity:1;transform:translateX(0);} }
  @keyframes popIn { from{opacity:0;transform:scale(0.85);} to{opacity:1;transform:scale(1);} }
  @keyframes pulseOpacity { 0%,100%{opacity:.4;} 50%{opacity:1;} }
  @keyframes levelPop { 0%{transform:scale(0.6);opacity:0;} 60%{transform:scale(1.2);opacity:1;} 100%{transform:scale(1);opacity:1;} }
  @keyframes barFill { from{width:0;} }
  @keyframes shimmerText { 0%{background-position:0% 50%;} 100%{background-position:200% 50%;} }
  @keyframes shimmerSweep { from{transform:translateX(-120%);} to{transform:translateX(280%);} }
  @keyframes particleFloat { 0%,100%{transform:translateY(0) translateX(0);opacity:.25;} 50%{transform:translateY(-22px) translateX(8px);opacity:.7;} }
  @keyframes toastIn { from{opacity:0;transform:translate(-50%,-24px) scale(.9);} to{opacity:1;transform:translate(-50%,0) scale(1);} }
  @keyframes toastOut { to{opacity:0;transform:translate(-50%,-14px) scale(.95);} }
  @keyframes burstRing { 0%{transform:scale(1);opacity:1;} 100%{transform:scale(1.9);opacity:0;} }
  @keyframes auraSpin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
  @keyframes floatUpFade { from{opacity:1;transform:translateY(0);} to{opacity:0;transform:translateY(-26px);} }
  @keyframes giftBounce { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(-8px) scale(1.04);} }
  @keyframes giftShake { 0%,100%{transform:rotate(0deg);} 25%{transform:rotate(-8deg);} 75%{transform:rotate(8deg);} }
  @keyframes giftFlash { from{opacity:1;transform:scale(0.5);} to{opacity:0;transform:scale(2.4);} }
  @keyframes itemPop { from{opacity:0;transform:scale(0.4);} to{opacity:1;transform:scale(1);} }
  @keyframes flyOut { from{transform:translate(0,0) scale(1);opacity:1;} to{transform:translate(var(--fx),var(--fy)) scale(0.2);opacity:0;} }
  @keyframes itemFloat { 0%,100%{transform:translateY(0) rotate(-3deg);} 50%{transform:translateY(-7px) rotate(3deg);} }
`;

export const glass = (extra = {}) => ({
  background: T.surface,
  backgroundImage: "linear-gradient(165deg, rgba(255,255,255,0.06), transparent 45%)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  boxShadow: "0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
  ...extra,
});

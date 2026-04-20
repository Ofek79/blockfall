import React, { useCallback, useEffect, useState } from "react";

interface Props {
  onStart: () => void;
}

const LETTERS = ["B", "L", "O", "C", "K", "F", "A", "L", "L"];
// Neon rainbow cycling through the 7 piece colors
const LETTER_COLORS = ["#00FFFF", "#FF00FF", "#FFE600", "#39FF14", "#FF6600", "#FF3131", "#1B88FF", "#00FFFF", "#FF00FF"];

const IntroScreen: React.FC<Props> = ({ onStart }) => {
  const [dropped, setDropped] = useState<boolean[]>(LETTERS.map(() => false));
  const [showPrompt, setShowPrompt] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    LETTERS.forEach((_, i) => {
      timers.push(
        setTimeout(
          () => setDropped((prev) => { const n = [...prev]; n[i] = true; return n; }),
          350 + i * 140
        )
      );
    });
    timers.push(setTimeout(() => setShowPrompt(true), 350 + LETTERS.length * 140 + 520));
    return () => timers.forEach(clearTimeout);
  }, []);

  const start = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setTimeout(onStart, 480);
  }, [exiting, onStart]);

  useEffect(() => {
    if (!showPrompt) return;
    const handler = (e: KeyboardEvent) => {
      e.stopImmediatePropagation();
      start();
    };
    window.addEventListener("keydown", handler, { once: true });
    return () => window.removeEventListener("keydown", handler);
  }, [showPrompt, start]);

  return (
    <div
      onClick={showPrompt ? start : undefined}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0e1117",
        zIndex: 1000,
        opacity: exiting ? 0 : 1,
        transition: "opacity 0.48s ease",
        cursor: showPrompt ? "pointer" : "default",
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          width: "min(90vw, 800px)",
          height: "min(90vw, 800px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,255,255,0.07) 0%, rgba(0,255,255,0.02) 45%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Scanline overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)",
          pointerEvents: "none",
        }}
      />

      {/* BLOCKFALL letters */}
      <div
        style={{
          display: "flex",
          gap: "clamp(2px, 0.8vw, 10px)",
          marginBottom: "clamp(40px, 6vh, 80px)",
          filter: "drop-shadow(0 0 2px rgba(0,0,0,0.9))",
        }}
      >
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontSize: "clamp(72px, 13vw, 152px)",
              fontWeight: 900,
              fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
              color: LETTER_COLORS[i],
              textShadow: dropped[i]
                ? `0 0 3px  #ffffff,
                   0 0 12px ${LETTER_COLORS[i]},
                   0 0 35px ${LETTER_COLORS[i]}ee,
                   0 0 80px ${LETTER_COLORS[i]}aa,
                   0 0 160px ${LETTER_COLORS[i]}44`
                : "none",
              transform: dropped[i]
                ? "translateY(0) scaleY(1)"
                : "translateY(-120vh) scaleY(1.4)",
              transition: dropped[i]
                ? `transform 0.7s cubic-bezier(0.18, 1.7, 0.4, 0.95)`
                : "none",
              lineHeight: 1,
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Decorative line */}
      <div
        style={{
          width: showPrompt ? "clamp(180px, 30vw, 340px)" : 0,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(0,255,255,0.7), transparent)",
          marginBottom: 24,
          transition: "width 0.7s ease 0.1s",
        }}
      />

      {/* Subtitle */}
      <div
        style={{
          fontSize: "clamp(9px, 0.95vw, 11px)",
          letterSpacing: 6,
          color: "rgba(255,255,255,0.4)",
          marginBottom: 36,
          opacity: showPrompt ? 1 : 0,
          transform: showPrompt ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s",
          textTransform: "uppercase",
        }}
      >
        Modern Edition
      </div>

      {/* Press any key */}
      <div
        style={{
          fontSize: "clamp(11px, 1.1vw, 14px)",
          letterSpacing: 4,
          color: "rgba(255,255,255,0.9)",
          opacity: showPrompt ? 1 : 0,
          transition: "opacity 0.6s ease 0.25s",
          animation: showPrompt ? "promptPulse 1.7s ease-in-out infinite" : "none",
          textTransform: "uppercase",
        }}
      >
        Press any key to start
      </div>
    </div>
  );
};

export default IntroScreen;

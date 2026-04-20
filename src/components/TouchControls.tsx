import React, { useCallback, useEffect, useRef, useState } from "react";
import type { GameAction } from "../types";

interface Props {
  dispatch: (action: GameAction) => void;
  visible: boolean;
}

const BTN: React.CSSProperties = {
  width: 66,
  height: 66,
  borderRadius: 14,
  border: "1px solid rgba(0,255,255,0.38)",
  background: "rgba(0,0,0,0.6)",
  color: "#00FFFF",
  fontSize: 26,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  userSelect: "none",
  WebkitUserSelect: "none",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  touchAction: "none",
  boxShadow: "0 0 10px rgba(0,255,255,0.15), inset 0 1px 0 rgba(0,255,255,0.1)",
  backdropFilter: "blur(4px)",
  flexShrink: 0,
};

const BTN_ACTIVE: React.CSSProperties = {
  ...BTN,
  background: "rgba(0,255,255,0.18)",
  boxShadow: "0 0 18px rgba(0,255,255,0.45), inset 0 1px 0 rgba(0,255,255,0.2)",
};

const BTN_DROP: React.CSSProperties = {
  ...BTN,
  width: 80,
  height: 66,
  border: "1px solid rgba(0,255,255,0.55)",
  background: "rgba(0,255,255,0.1)",
  fontSize: 14,
  letterSpacing: 1,
  flexDirection: "column",
  gap: 2,
};

const TouchControls: React.FC<Props> = ({ dispatch, visible }) => {
  const [isTouch, setIsTouch] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    setIsTouch(
      "ontouchstart" in window ||
      window.matchMedia("(hover: none) and (pointer: coarse)").matches
    );
  }, []);

  // Repeat timers for held buttons
  const dasTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arrTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRepeat = useCallback(() => {
    if (dasTimerRef.current)  { clearTimeout(dasTimerRef.current);   dasTimerRef.current  = null; }
    if (arrTimerRef.current)  { clearInterval(arrTimerRef.current);  arrTimerRef.current  = null; }
    setActive(null);
  }, []);

  const startRepeat = useCallback((action: GameAction, id: string) => {
    stopRepeat();
    setActive(id);
    dispatch(action);
    dasTimerRef.current = setTimeout(() => {
      arrTimerRef.current = setInterval(() => dispatch(action), 50);
    }, 150);
  }, [dispatch, stopRepeat]);

  const tap = useCallback((action: GameAction, id: string) => (e: React.TouchEvent) => {
    e.preventDefault();
    setActive(id);
    dispatch(action);
    setTimeout(() => setActive((cur) => cur === id ? null : cur), 120);
  }, [dispatch]);

  if (!isTouch || !visible) return null;

  const repeatBtn = (action: GameAction, id: string, label: React.ReactNode) => (
    <div
      role="button"
      style={active === id ? BTN_ACTIVE : BTN}
      onTouchStart={(e) => { e.preventDefault(); startRepeat(action, id); }}
      onTouchEnd={(e)   => { e.preventDefault(); stopRepeat(); }}
      onTouchCancel={stopRepeat}
    >
      {label}
    </div>
  );

  const tapBtn = (action: GameAction, id: string, label: React.ReactNode, style = BTN) => (
    <div
      role="button"
      style={active === id ? { ...style, background: "rgba(0,255,255,0.2)", boxShadow: "0 0 18px rgba(0,255,255,0.5)" } : style}
      onTouchStart={tap(action, id)}
      onTouchEnd={(e) => e.preventDefault()}
    >
      {label}
    </div>
  );

  return (
    <div
      style={{
        position:   "fixed",
        bottom:      0,
        left:        0,
        right:       0,
        display:    "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        padding:    "12px 20px 28px",
        zIndex:      500,
        background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
        pointerEvents: "none",
      }}
    >
      {/* Left cluster: movement */}
      <div style={{ display: "flex", gap: 10, pointerEvents: "auto" }}>
        {repeatBtn("MOVE_LEFT",  "left",  "←")}
        {repeatBtn("MOVE_DOWN",  "down",  "↓")}
        {repeatBtn("MOVE_RIGHT", "right", "→")}
      </div>

      {/* Right cluster: hold + rotate + drop */}
      <div style={{ display: "flex", gap: 10, pointerEvents: "auto" }}>
        {tapBtn("HOLD",      "hold", <><span style={{ fontSize: 12, letterSpacing: 0.5 }}>HOLD</span></>, { ...BTN, fontSize: 12, letterSpacing: 1 })}
        {tapBtn("ROTATE_CW", "rot",  "↻")}
        {tapBtn("HARD_DROP", "drop",
          <><div style={{ fontSize: 22 }}>⬇</div><div style={{ fontSize: 11, letterSpacing: 0.5 }}>DROP</div></>,
          BTN_DROP
        )}
      </div>
    </div>
  );
};

export default TouchControls;

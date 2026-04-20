import React, { useCallback, useEffect, useRef, useState } from "react";
import type { GameAction } from "../types";

interface Props {
  dispatch: (action: GameAction) => void;
  visible: boolean;
}

// All sizing is viewport-relative so buttons always fit any screen width.
// clamp(min, preferred, max) — preferred uses 13vw so 6 buttons + gaps fit
// even on a 360 px phone while capping at 66 px on tablets/desktops.
const BTN_SIZE  = "clamp(44px, 13vw, 66px)";
const ICON_SIZE = "clamp(18px, 5vw, 26px)";
const LBL_SIZE  = "clamp(8px, 2.2vw, 11px)";
const BTN_GAP   = "clamp(4px, 2vw, 10px)";
const PAD_H     = "clamp(8px, 2vw, 20px)";   // left/right padding
const PAD_BOT   = "clamp(16px, 5vw, 28px)";  // bottom padding (safe area)

function btn(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    width:                    BTN_SIZE,
    height:                   BTN_SIZE,
    borderRadius:             "14px",
    border:                   "1px solid rgba(0,255,255,0.38)",
    background:               "rgba(0,0,0,0.6)",
    color:                    "#00FFFF",
    fontWeight:               700,
    display:                  "flex",
    flexDirection:            "column",
    alignItems:               "center",
    justifyContent:           "center",
    gap:                      "2px",
    userSelect:               "none",
    WebkitUserSelect:         "none",
    cursor:                   "pointer",
    WebkitTapHighlightColor:  "transparent",
    touchAction:              "none",
    boxShadow:                "0 0 10px rgba(0,255,255,0.15), inset 0 1px 0 rgba(0,255,255,0.1)",
    backdropFilter:           "blur(4px)",
    flexShrink:               0,
    ...extra,
  };
}

function activeBtn(base: React.CSSProperties): React.CSSProperties {
  return {
    ...base,
    background: "rgba(0,255,255,0.2)",
    boxShadow:  "0 0 18px rgba(0,255,255,0.5), inset 0 1px 0 rgba(0,255,255,0.2)",
  };
}

const BTN_BASE  = btn();
const BTN_DROP  = btn({ border: "1px solid rgba(0,255,255,0.55)", background: "rgba(0,255,255,0.1)" });

const TouchControls: React.FC<Props> = ({ dispatch, visible }) => {
  const [isTouch, setIsTouch] = useState(false);
  const [active, setActive]   = useState<string | null>(null);

  useEffect(() => {
    setIsTouch(
      "ontouchstart" in window ||
      window.matchMedia("(hover: none) and (pointer: coarse)").matches
    );
  }, []);

  const dasTimerRef = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const arrTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRepeat = useCallback(() => {
    if (dasTimerRef.current) { clearTimeout(dasTimerRef.current);  dasTimerRef.current = null; }
    if (arrTimerRef.current) { clearInterval(arrTimerRef.current); arrTimerRef.current = null; }
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

  const icon = (ch: string) => (
    <span style={{ fontSize: ICON_SIZE, lineHeight: 1 }}>{ch}</span>
  );
  const lbl = (text: string) => (
    <span style={{ fontSize: LBL_SIZE, letterSpacing: "0.5px", lineHeight: 1 }}>{text}</span>
  );

  const repeatBtn = (action: GameAction, id: string, icon_: React.ReactNode, label: React.ReactNode) => (
    <div
      role="button"
      style={active === id ? activeBtn(BTN_BASE) : BTN_BASE}
      onTouchStart={(e) => { e.preventDefault(); startRepeat(action, id); }}
      onTouchEnd={(e)   => { e.preventDefault(); stopRepeat(); }}
      onTouchCancel={stopRepeat}
    >
      {icon_}
      {label}
    </div>
  );

  const tapBtn = (
    action: GameAction,
    id: string,
    icon_: React.ReactNode,
    label: React.ReactNode,
    base = BTN_BASE,
  ) => (
    <div
      role="button"
      style={active === id ? activeBtn(base) : base}
      onTouchStart={tap(action, id)}
      onTouchEnd={(e) => e.preventDefault()}
    >
      {icon_}
      {label}
    </div>
  );

  return (
    <div
      style={{
        position:       "fixed",
        bottom:          0,
        left:            0,
        right:           0,
        display:        "flex",
        justifyContent: "space-between",
        alignItems:     "flex-end",
        padding:        `12px ${PAD_H} ${PAD_BOT}`,
        zIndex:          500,
        background:     "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
        pointerEvents:  "none",
        boxSizing:      "border-box",
      }}
    >
      {/* Left cluster: move left / soft drop / move right */}
      <div style={{ display: "flex", gap: BTN_GAP, pointerEvents: "auto" }}>
        {repeatBtn("MOVE_LEFT",  "left",  icon("←"), lbl("LEFT"))}
        {repeatBtn("MOVE_DOWN",  "down",  icon("↓"), lbl("DOWN"))}
        {repeatBtn("MOVE_RIGHT", "right", icon("→"), lbl("RIGHT"))}
      </div>

      {/* Right cluster: hold / rotate / hard drop */}
      <div style={{ display: "flex", gap: BTN_GAP, pointerEvents: "auto" }}>
        {tapBtn("HOLD",      "hold", icon("⊙"),  lbl("HOLD"))}
        {tapBtn("ROTATE_CW", "rot",  icon("↻"),  lbl("ROTATE"))}
        {tapBtn("HARD_DROP", "drop", icon("⬇"),  lbl("DROP"), BTN_DROP)}
      </div>
    </div>
  );
};

export default TouchControls;

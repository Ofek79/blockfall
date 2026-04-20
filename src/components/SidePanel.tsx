// ============================================================
// SidePanel.tsx — exports LeftPanel, RightPanel, MobileTopBar
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import type { GameState } from "../types";
import { ACCENT } from "../constants";
import MiniBoard from "./MiniBoard";

interface Props {
  state: GameState;
}

const PANEL_W = 136;

// ---- Shared primitives ------------------------------------------------

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <div style={{
      fontSize: 9,
      letterSpacing: 3,
      color: "rgba(255,255,255,0.35)",
      marginBottom: 8,
      fontWeight: 700,
      textTransform: "uppercase",
    }}>
      {label}
    </div>
    {children}
  </div>
);

const Divider = () => (
  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "2px 0" }} />
);

// ---- Mobile top bar: score / level / lines ---------------------------

export const MobileTopBar: React.FC<Props> = ({ state }) => {
  const { score, lines, level } = state;
  return (
    <div style={{
      display:        "flex",
      justifyContent: "space-around",
      alignItems:     "center",
      padding:        "0 16px",
      height:         48,
      flexShrink:     0,
      background:     "rgba(0,0,0,0.5)",
      borderBottom:   "1px solid rgba(0,255,255,0.08)",
    }}>
      <MobileStat label="SCORE" value={score.toLocaleString()} accent={false} />
      <MobileStat label="LEVEL" value={String(level)} accent />
      <MobileStat label="LINES" value={String(lines)} accent={false} />
    </div>
  );
};

const MobileStat: React.FC<{ label: string; value: string; accent: boolean }> = ({ label, value, accent }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{
      fontSize:      8,
      letterSpacing: 2,
      color:         "rgba(255,255,255,0.35)",
      fontWeight:    700,
      textTransform: "uppercase",
    }}>
      {label}
    </div>
    <div style={{
      fontSize:   18,
      fontWeight: 700,
      color:      accent ? ACCENT : "#fff",
      lineHeight: 1.1,
    }}>
      {value}
    </div>
  </div>
);

// ---- Left panel: score + hold ----------------------------------------

export const LeftPanel: React.FC<Props> = ({ state }) => {
  const { score, lines, level, heldPiece, canHold } = state;

  const prevScore = useRef(score);
  const [scorePop, setScorePop] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const prevLevel = useRef(level);

  useEffect(() => {
    if (score !== prevScore.current) {
      prevScore.current = score;
      setScorePop(true);
      setTimeout(() => setScorePop(false), 350);
    }
  }, [score]);

  useEffect(() => {
    if (level > prevLevel.current) {
      setLevelUp(true);
      setTimeout(() => setLevelUp(false), 1500);
    }
    prevLevel.current = level;
  }, [level]);

  return (
    <div style={{ width: PANEL_W, display: "flex", flexDirection: "column", gap: 20 }}>
      {levelUp && <div className="level-up-banner">LEVEL UP!</div>}

      <Section label="Score">
        <div
          className={scorePop ? "score-pop" : ""}
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {score.toLocaleString()}
        </div>
      </Section>

      <Divider />

      <Section label="Lines">
        <StatRow label="Cleared" value={lines} />
      </Section>

      <Section label="Level">
        <div style={{
          fontSize: 28,
          fontWeight: 800,
          color: ACCENT,
          lineHeight: 1,
        }}>
          {level}
        </div>
      </Section>

      <Divider />

      <Section label="Hold">
        <MiniBoard type={heldPiece} dim={!canHold} />
      </Section>
    </div>
  );
};

// ---- Right panel: next queue + controls ------------------------------

export const RightPanel: React.FC<Props> = ({ state }) => {
  const { nextQueue } = state;

  return (
    <div style={{ width: PANEL_W, display: "flex", flexDirection: "column", gap: 20 }}>
      <Section label="Next">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {nextQueue.map((type, i) => (
            <MiniBoard key={i} type={type} />
          ))}
        </div>
      </Section>

      <Divider />

      <Section label="Controls">
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <ControlRow keys="← →" action="Move" />
          <ControlRow keys="↑ / X" action="Rotate CW" />
          <ControlRow keys="Z" action="Rotate CCW" />
          <ControlRow keys="↓" action="Soft drop" />
          <ControlRow keys="Space" action="Hard drop" />
          <ControlRow keys="C / ⇧" action="Hold" />
          <ControlRow keys="P" action="Pause" />
          <ControlRow keys="R" action="Restart" />
        </div>
      </Section>
    </div>
  );
};

// ---- Subcomponents ---------------------------------------------------

const StatRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div style={{
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "baseline",
    fontSize:       13,
    color:          "rgba(255,255,255,0.7)",
    marginBottom:   2,
  }}>
    <span>{label}</span>
    <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{value}</span>
  </div>
);

const ControlRow: React.FC<{ keys: string; action: string }> = ({ keys, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4 }}>
    <span style={{
      background:    "rgba(0,255,255,0.08)",
      color:         ACCENT,
      fontWeight:    600,
      fontSize:      10,
      padding:       "2px 5px",
      borderRadius:  4,
      border:        "1px solid rgba(0,255,255,0.25)",
      whiteSpace:    "nowrap",
      letterSpacing: 0.3,
    }}>
      {keys}
    </span>
    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textAlign: "right" }}>
      {action}
    </span>
  </div>
);

// Default export for backward-compat
const SidePanel: React.FC<Props> = ({ state }) => <LeftPanel state={state} />;
export default SidePanel;

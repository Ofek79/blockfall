// ============================================================
// Game.tsx — top-level layout: left panel | board | right panel
// ============================================================

import React, { useCallback, useRef, useState } from "react";
import GameBoard from "./GameBoard";
import { LeftPanel, RightPanel } from "./SidePanel";
import IntroScreen from "./IntroScreen";
import TouchControls from "./TouchControls";
import { useGameLoop } from "../hooks/useGameLoop";
import { useKeyboard } from "../hooks/useKeyboard";
import { useCellSize } from "../hooks/useCellSize";
import type { GameAction } from "../types";

const Game: React.FC = () => {
  const [started, setStarted] = useState(false);
  const startedRef = useRef(false);

  const { state, dispatch } = useGameLoop();
  const cellSize = useCellSize();

  const typedDispatch = useCallback(
    (action: GameAction) => { if (startedRef.current) dispatch(action); },
    [dispatch]
  );
  useKeyboard(typedDispatch);

  const handleStart = () => { startedRef.current = true; setStarted(true); };

  return (
    <>
      {!started && <IntroScreen onStart={handleStart} />}

      {/* Full-viewport centered 3-column layout */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          gap: 28,
          visibility: started ? "visible" : "hidden",
        }}
      >
        <LeftPanel state={state} />

        {/* Board column: title + play-field */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              letterSpacing: 10,
              fontSize: 17,
              fontWeight: 800,
              color: "rgba(255,255,255,0.75)",
              textTransform: "uppercase",
            }}
          >
            BLOCKFALL
          </div>
          <GameBoard state={state} cellSize={cellSize} />
        </div>

        <RightPanel state={state} />
      </div>

      <TouchControls dispatch={typedDispatch} visible={started} />
    </>
  );
};

export default Game;

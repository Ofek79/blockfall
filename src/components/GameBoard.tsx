// ============================================================
// GameBoard.tsx — renders the 20×12 play-field
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Board, GameState } from "../types";
import { BOARD_COLS, BOARD_ROWS } from "../constants";
import { boardWithPiece } from "../game/Board";
import LineClearParticles from "./LineClearParticles";

interface Props {
  state: GameState;
  cellSize?: number;
}

const GAP = 1; // px

const CLEAR_WORDS = [
  null,
  { text: "Nice!",      color: "#e2e8f0" },
  { text: "Great!",     color: "#60a5fa" },
  { text: "Awesome!",   color: "#fb923c" },
  { text: "BLOCKFALL!", color: "#f59e0b" },
] as const;

const GameBoard: React.FC<Props> = ({ state, cellSize: cellSizeProp }) => {
  const cs = cellSizeProp ?? 30;
  const { board, currentPiece, ghostY, animatingLines, clearedRowsSnapshot, isGameOver } = state;

  // ── Screen shake ───────────────────────────────────────────────────────
  const wrapperRef = useRef<HTMLDivElement>(null);
  const animKey    = animatingLines.join(",");

  // ── Encouraging word overlay ───────────────────────────────────────────
  type ClearWord = { text: string; color: string; key: number };
  const [clearWord, setClearWord] = useState<ClearWord | null>(null);
  const clearWordKeyRef = useRef(0);
  const clearWordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const count = animatingLines.length;
    if (count === 0) return;
    const entry = CLEAR_WORDS[Math.min(count, 4)];
    if (!entry) return;
    if (clearWordTimerRef.current) clearTimeout(clearWordTimerRef.current);
    clearWordKeyRef.current += 1;
    setClearWord({ ...entry, key: clearWordKeyRef.current });
    clearWordTimerRef.current = setTimeout(() => setClearWord(null), 1050);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animKey]);

  useEffect(() => {
    if (!animKey || !wrapperRef.current) return;
    const el = wrapperRef.current;
    el.classList.remove("board-shake");
    void el.offsetWidth; // force reflow so the animation restarts cleanly
    el.classList.add("board-shake");
  }, [animKey]);

  // ── Derived display state ──────────────────────────────────────────────
  const displayBoard: Board = useMemo(() => {
    if (!currentPiece) return board.map((r) => [...r]);
    return boardWithPiece(board, currentPiece);
  }, [board, currentPiece]);

  const ghostCells = useMemo(() => {
    if (!currentPiece) return new Set<string>();
    const cells = new Set<string>();
    const { matrix, x } = currentPiece;
    for (let r = 0; r < matrix.length; r++)
      for (let c = 0; c < matrix[r].length; c++)
        if (matrix[r][c]) {
          const br = ghostY + r, bc = x + c;
          if (br >= 0 && br < BOARD_ROWS && bc >= 0 && bc < BOARD_COLS)
            cells.add(`${br},${bc}`);
        }
    return cells;
  }, [currentPiece, ghostY]);

  const activeCells = useMemo(() => {
    if (!currentPiece) return new Set<string>();
    const cells = new Set<string>();
    const { matrix, x, y } = currentPiece;
    for (let r = 0; r < matrix.length; r++)
      for (let c = 0; c < matrix[r].length; c++)
        if (matrix[r][c]) cells.add(`${y + r},${x + c}`);
    return cells;
  }, [currentPiece]);

  const animatingSet = useMemo(() => new Set(animatingLines), [animatingLines]);

  const boardW = BOARD_COLS * cs + (BOARD_COLS - 1) * GAP;
  const boardH = BOARD_ROWS * cs + (BOARD_ROWS - 1) * GAP;

  return (
    // ── Outer wrapper: receives shake animation, no overflow clipping ──
    <div ref={wrapperRef} style={{ position: "relative", display: "inline-block" }}>

      {/* ── Inner board: overflow:hidden for clean cell edges ── */}
      <div
        style={{
          position:     "relative",
          width:         boardW,
          height:        boardH,
          background:   "#000000",
          border:       "1px solid rgba(0,255,255,0.18)",
          borderRadius:  6,
          overflow:     "hidden",
          boxShadow:    "0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        {/* Subtle grid lines */}
        <svg
          style={{ position: "absolute", inset: 0, opacity: 0.05 }}
          width={boardW}
          height={boardH}
        >
          {Array.from({ length: BOARD_COLS + 1 }, (_, i) => (
            <line key={`v${i}`}
              x1={i * (cs + GAP)} y1={0} x2={i * (cs + GAP)} y2={boardH}
              stroke="white" strokeWidth={1}
            />
          ))}
          {Array.from({ length: BOARD_ROWS + 1 }, (_, i) => (
            <line key={`h${i}`}
              x1={0} y1={i * (cs + GAP)} x2={boardW} y2={i * (cs + GAP)}
              stroke="white" strokeWidth={1}
            />
          ))}
        </svg>

        {/* Cells */}
        {displayBoard.map((row, r) =>
          row.map((cell, c) => {
            const key       = `${r},${c}`;
            const isActive  = activeCells.has(key);
            const isGhost   = !isActive && ghostCells.has(key) && !cell;
            const isAnimating = animatingSet.has(r);

            // Canvas handles the visual for dissolving rows — hide DOM cells
            // to avoid shifted-board artifacts showing through.
            if (isAnimating) return null;
            if (isGhost) return (
              <div key={key} style={cellStyle(r, c, currentPiece?.color ?? "#fff", true, cs)} />
            );
            if (!cell) return null;
            return <div key={key} style={cellStyle(r, c, cell, false, cs)} />;
          })
        )}

        {/* Line-clear encouraging word */}
        {clearWord && (
          <div
            key={clearWord.key}
            className="line-clear-word"
            style={{
              position:   "absolute",
              top:        "50%",
              left:       "50%",
              transform:  "translate(-50%, -50%)",
              zIndex:     30,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              color:      clearWord.color,
              textShadow: `0 0 24px ${clearWord.color}cc, 0 2px 8px rgba(0,0,0,0.7)`,
            }}
          >
            {clearWord.text}
          </div>
        )}

        {/* Game Over overlay */}
        {isGameOver && (
          <div
            className="game-over-overlay"
            style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: "rgba(14,17,23,0.88)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div className="game-over-text">GAME OVER</div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 10, letterSpacing: 2 }}>
              PRESS R TO RESTART
            </div>
          </div>
        )}

        {/* Paused overlay */}
        {state.isPaused && !isGameOver && (
          <div
            style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(3px)",
            }}
          >
            <div style={{ color: "#fff", fontSize: 28, fontWeight: 700, letterSpacing: 6 }}>
              PAUSED
            </div>
          </div>
        )}
      </div>

      {/* ── Particle canvas: sibling of inner board, can overflow edges ── */}
      <LineClearParticles
        animatingLines={animatingLines}
        clearedRowsSnapshot={clearedRowsSnapshot}
        boardWidth={boardW}
        boardHeight={boardH}
        cellSize={cs}
      />
    </div>
  );
};

function cellStyle(
  r: number,
  c: number,
  color: string,
  isGhost: boolean,
  cs: number
): React.CSSProperties {
  return {
    position:     "absolute",
    left:          c * (cs + GAP),
    top:           r * (cs + GAP),
    width:         cs,
    height:        cs,
    borderRadius:  Math.max(2, cs * 0.09),
    background:    isGhost ? "transparent" : color,
    border:        isGhost ? `1px solid ${color}50` : "none",
    boxShadow:     isGhost
      ? "none"
      : `inset 0 1px 0 rgba(255,255,255,0.15), 0 0 ${cs * 0.35}px ${color}bb, 0 0 ${cs * 0.8}px ${color}33`,
  };
}

export default GameBoard;

import { useEffect, useState } from "react";
import { BOARD_COLS, BOARD_ROWS } from "../constants";

// Layout constants that must match Game.tsx
const PANEL_W = 136;  // each side panel width
const GAP = 28;       // gap between panel and board (both sides)
const TITLE_H = 42;   // BLOCKFALL title + margin above board

function compute(): number {
  // Available board width: viewport minus both panels and their gaps
  const availW = window.innerWidth - 2 * (PANEL_W + GAP);
  // Available board height: viewport minus title row
  const availH = window.innerHeight - TITLE_H;

  const fromW = Math.floor((availW - (BOARD_COLS - 1)) / BOARD_COLS);
  const fromH = Math.floor((availH - (BOARD_ROWS - 1)) / BOARD_ROWS);
  return Math.max(20, Math.min(40, Math.min(fromW, fromH)));
}

export function useCellSize(): number {
  const [cellSize, setCellSize] = useState(compute);
  useEffect(() => {
    const handler = () => setCellSize(compute());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return cellSize;
}

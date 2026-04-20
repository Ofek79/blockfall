import { useEffect, useState } from "react";
import { BOARD_COLS, BOARD_ROWS } from "../constants";

// Must match Game.tsx desktop layout constants
const PANEL_W   = 136;
const GAP       = 28;
const TITLE_H   = 42;   // title + margin above board (desktop)
const TOP_BAR_H = 48;   // compact score bar (mobile)
const TOUCH_H   = 110;  // touch controls zone at bottom (mobile)
const SIDE_PAD  = 8;    // horizontal padding each side (mobile)

export interface Layout {
  cellSize: number;
  isMobile: boolean;
}

function compute(): Layout {
  const isMobile = window.innerWidth < 600;

  if (isMobile) {
    const availW = window.innerWidth  - 2 * SIDE_PAD;
    const availH = window.innerHeight - TOP_BAR_H - TOUCH_H;
    const fromW  = Math.floor((availW - (BOARD_COLS - 1)) / BOARD_COLS);
    const fromH  = Math.floor((availH - (BOARD_ROWS - 1)) / BOARD_ROWS);
    return { cellSize: Math.max(8, Math.min(42, Math.min(fromW, fromH))), isMobile: true };
  }

  const availW = window.innerWidth  - 2 * (PANEL_W + GAP);
  const availH = window.innerHeight - TITLE_H;
  const fromW  = Math.floor((availW - (BOARD_COLS - 1)) / BOARD_COLS);
  const fromH  = Math.floor((availH - (BOARD_ROWS - 1)) / BOARD_ROWS);
  return { cellSize: Math.max(20, Math.min(40, Math.min(fromW, fromH))), isMobile: false };
}

export function useCellSize(): Layout {
  const [layout, setLayout] = useState<Layout>(compute);
  useEffect(() => {
    const handler = () => setLayout(compute());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return layout;
}

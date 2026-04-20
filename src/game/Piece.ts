// ============================================================
// Piece.ts — Tetromino definitions, rotation, and wall-kicks
//
// Data structure: each piece is a 2-D matrix (array-of-arrays)
// storing 1 (filled) or 0 (empty).  Rotating CW = transpose then
// reverse each row; CCW = reverse then transpose.
// Time complexity of rotate: O(k²) where k is matrix side (2-4).
// ============================================================

import type { Piece, TetrominoMatrix, TetrominoType } from "../types";
import { PIECE_COLORS, SPAWN_COL } from "../constants";

// ---------------------------------------------------------------------------
// Tetromino shape definitions (rotation state 0)
// ---------------------------------------------------------------------------
const SHAPES: Record<TetrominoType, TetrominoMatrix> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

// ---------------------------------------------------------------------------
// SRS wall-kick offset tables
// Index = [fromRotation][kickIndex] → {dx, dy}
// Two tables: one for J/L/S/T/Z (3×3), one for I (4×4).
// ---------------------------------------------------------------------------
type Offset = { dx: number; dy: number };

const KICKS_JLSTZ: Offset[][] = [
  // 0→1
  [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: 2 },
    { dx: -1, dy: 2 },
  ],
  // 1→2
  [
    { dx: 0, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 1, dy: 1 },
    { dx: 0, dy: -2 },
    { dx: 1, dy: -2 },
  ],
  // 2→3
  [
    { dx: 0, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 1, dy: -1 },
    { dx: 0, dy: 2 },
    { dx: 1, dy: 2 },
  ],
  // 3→0
  [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: 1 },
    { dx: 0, dy: -2 },
    { dx: -1, dy: -2 },
  ],
];

const KICKS_I: Offset[][] = [
  // 0→1
  [
    { dx: 0, dy: 0 },
    { dx: -2, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: -2, dy: 1 },
    { dx: 1, dy: -2 },
  ],
  // 1→2
  [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 2, dy: 0 },
    { dx: -1, dy: -2 },
    { dx: 2, dy: 1 },
  ],
  // 2→3
  [
    { dx: 0, dy: 0 },
    { dx: 2, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 2, dy: -1 },
    { dx: -1, dy: 2 },
  ],
  // 3→0
  [
    { dx: 0, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: -2, dy: 0 },
    { dx: 1, dy: 2 },
    { dx: -2, dy: -1 },
  ],
];

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/** Deep-copy a matrix (O(k²)) */
export function cloneMatrix(m: TetrominoMatrix): TetrominoMatrix {
  return m.map((row) => [...row]);
}

/** Rotate a matrix 90° clockwise (O(k²)) */
export function rotateCW(matrix: TetrominoMatrix): TetrominoMatrix {
  const n = matrix.length;
  const result: TetrominoMatrix = Array.from({ length: n }, () =>
    Array(n).fill(0)
  );
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      result[c][n - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

/** Rotate a matrix 90° counter-clockwise (O(k²)) */
export function rotateCCW(matrix: TetrominoMatrix): TetrominoMatrix {
  const n = matrix.length;
  const result: TetrominoMatrix = Array.from({ length: n }, () =>
    Array(n).fill(0)
  );
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      result[n - 1 - c][r] = matrix[r][c];
    }
  }
  return result;
}

/** Create a fresh Piece at spawn position */
export function createPiece(type: TetrominoType): Piece {
  return {
    type,
    matrix: cloneMatrix(SHAPES[type]),
    x: SPAWN_COL,
    y: type === "I" ? -1 : 0, // I spawns one row higher
    color: PIECE_COLORS[type],
  };
}

/**
 * Return wall-kick offsets to try when rotating fromRot → toRot.
 * We track rotation state (0-3) on the piece externally; this function
 * only needs the from-rotation index.
 */
export function getKicks(type: TetrominoType, fromRot: number): Offset[] {
  const table = type === "I" ? KICKS_I : KICKS_JLSTZ;
  return table[fromRot % 4];
}

/** All tetromino types as an array (used for random bag generation) */
export const ALL_TYPES: TetrominoType[] = ["I", "O", "T", "S", "Z", "J", "L"];

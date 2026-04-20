// ============================================================
// Board.ts — board creation, collision detection, locking,
//            line-clear detection, and ghost-piece calculation.
//
// Data structure: the board is a 2-D array  Board[row][col].
//   • Rows run top-to-bottom (row 0 = top of play-field).
//   • Columns run left-to-right (col 0 = left wall).
//   • Each cell is null (empty) or a CSS colour string (filled).
//
// Why a 2-D array?
//   O(1) random access by (row, col) — perfect for collision checks
//   and rendering.  Insertion/deletion of rows is O(n) which is fine
//   since it only happens on line-clears (at most 4 per frame).
// ============================================================

import type { Board, Cell, Piece } from "../types";
import { BOARD_COLS, BOARD_ROWS } from "../constants";

/** Create an empty board filled with null cells — O(rows × cols) */
export function createEmptyBoard(): Board {
  // Array.from avoids reference-sharing bugs that plague new Array(n).fill([])
  return Array.from({ length: BOARD_ROWS }, () =>
    Array<Cell>(BOARD_COLS).fill(null)
  );
}

/** Deep-copy the board — O(rows × cols) */
export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/**
 * Test whether `piece` in its current position overlaps a filled cell
 * or lies outside the board boundaries.
 * O(k²) where k = piece matrix side (at most 4).
 */
export function hasCollision(board: Board, piece: Piece): boolean {
  const { matrix, x, y } = piece;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue; // empty cell in the matrix
      const boardRow = y + r;
      const boardCol = x + c;
      // Out-of-bounds check
      if (boardCol < 0 || boardCol >= BOARD_COLS || boardRow >= BOARD_ROWS) {
        return true;
      }
      // Allow pieces to spawn above the visible board (boardRow < 0)
      if (boardRow < 0) continue;
      // Overlap with a locked cell
      if (board[boardRow][boardCol] !== null) return true;
    }
  }
  return false;
}

/**
 * Lock the current piece into the board in-place.
 * O(k²)
 */
export function lockPiece(board: Board, piece: Piece): void {
  const { matrix, x, y, color } = piece;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue;
      const boardRow = y + r;
      const boardCol = x + c;
      if (boardRow >= 0 && boardRow < BOARD_ROWS) {
        board[boardRow][boardCol] = color;
      }
    }
  }
}

/**
 * Find and remove all full rows; drop remaining rows down.
 * Returns the indices of the cleared rows (before removal).
 * O(rows × cols)
 */
export function clearLines(board: Board): number[] {
  const clearedIndices: number[] = [];

  // Scan from bottom to top — O(rows)
  for (let r = BOARD_ROWS - 1; r >= 0; r--) {
    if (board[r].every((cell) => cell !== null)) {
      clearedIndices.push(r);
    }
  }

  // Remove cleared rows and prepend empty rows — O(rows × cols)
  for (const r of clearedIndices) {
    board.splice(r, 1);
    board.unshift(Array<Cell>(BOARD_COLS).fill(null));
  }

  return clearedIndices;
}

/**
 * Calculate the lowest y-position the piece can reach (ghost piece).
 * O(drop-distance × k²) — typically O(rows × k²) worst case.
 */
export function getGhostY(board: Board, piece: Piece): number {
  let ghostY = piece.y;
  while (!hasCollision(board, { ...piece, y: ghostY + 1 })) {
    ghostY++;
  }
  return ghostY;
}

/**
 * Returns a copy of the board with the piece rendered into it.
 * Used only for display — does not mutate the game board.
 * O(rows × cols + k²)
 */
export function boardWithPiece(board: Board, piece: Piece): Board {
  const copy = cloneBoard(board);
  const { matrix, x, y, color } = piece;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue;
      const br = y + r;
      const bc = x + c;
      if (br >= 0 && br < BOARD_ROWS && bc >= 0 && bc < BOARD_COLS) {
        copy[br][bc] = color;
      }
    }
  }
  return copy;
}

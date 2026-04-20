// ============================================================
// GameEngine.ts — pure game-logic state machine
//
// This class owns the authoritative game state and exposes
// mutation methods that React hooks call. It is deliberately
// framework-agnostic (no React imports).
//
// Data structures used internally:
//   • board: Board (2-D array) — O(1) cell access
//   • nextQueue: array acting as a Queue (7-bag randomiser) —
//     O(1) dequeue from front, O(7) refill once per bag
//   • heldPiece: TetrominoType | null — simple scalar
//
// Lock-delay is intentionally managed by useGameLoop (not here)
// so the rAF loop can reset it on moves/rotations without
// fighting with setTimeout drift.
// ============================================================

import type { Board, GameState, Piece, TetrominoType } from "../types";
import {
  BASE_GRAVITY_MS,
  BOARD_ROWS,
  GRAVITY_STEP_MS,
  LINE_CLEAR_ANIM_MS,
  LINE_SCORES,
  LINES_PER_LEVEL,
  MIN_GRAVITY_MS,
  NEXT_PREVIEW_COUNT,
} from "../constants";
import {
  ALL_TYPES,
  cloneMatrix,
  createPiece,
  getKicks,
  rotateCCW,
  rotateCW,
} from "./Piece";
import {
  clearLines,
  cloneBoard,
  createEmptyBoard,
  getGhostY,
  hasCollision,
  lockPiece,
} from "./Board";

// ---------------------------------------------------------------------------
// 7-bag randomiser
// ---------------------------------------------------------------------------

/** Fisher-Yates shuffle — O(n) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Fill `queue` until it has at least `minSize` entries.
 * O(n) where n = bags added × 7
 */
function refillQueue(queue: TetrominoType[], minSize: number): void {
  while (queue.length < minSize) {
    queue.push(...shuffle(ALL_TYPES));
  }
}

// ---------------------------------------------------------------------------
// GameEngine class
// ---------------------------------------------------------------------------

export class GameEngine {
  private board: Board = createEmptyBoard();
  private currentPiece: Piece | null = null;
  private heldPiece: TetrominoType | null = null;
  private canHold = true;
  // nextQueue acts as a Queue: dequeue from index 0, enqueue at the back
  private nextQueue: TetrominoType[] = [];
  private score = 0;
  private lines = 0;
  private level = 1;
  private isGameOver = false;
  private isPaused = false;
  private lastClearedLines = 0;
  private animatingLines: number[] = [];
  // Track rotation state (0–3) for SRS wall-kicks
  private rotationState = 0;
  // Line-clear animation timer (engine owns this, not the hook)
  private lineClearTimer: ReturnType<typeof setTimeout> | null = null;
  // Snapshot of cleared row colors captured before clearLines mutates the board
  private clearedRowsSnapshot: import("../types").Cell[][] | null = null;

  constructor() {
    this.reset();
  }

  // -------------------------------------------------------------------------
  // Public state snapshot (immutable copy for React)
  // -------------------------------------------------------------------------

  getState(): GameState {
    return {
      board: cloneBoard(this.board),
      currentPiece: this.currentPiece
        ? { ...this.currentPiece, matrix: cloneMatrix(this.currentPiece.matrix) }
        : null,
      ghostY: this.currentPiece
        ? getGhostY(this.board, this.currentPiece)
        : 0,
      heldPiece: this.heldPiece,
      canHold: this.canHold,
      nextQueue: [...this.nextQueue.slice(0, NEXT_PREVIEW_COUNT)],
      score: this.score,
      lines: this.lines,
      level: this.level,
      isGameOver: this.isGameOver,
      isPaused: this.isPaused,
      lastClearedLines: this.lastClearedLines,
      animatingLines: [...this.animatingLines],
      clearedRowsSnapshot: this.clearedRowsSnapshot
        ? this.clearedRowsSnapshot.map((r) => [...r])
        : null,
    };
  }

  // -------------------------------------------------------------------------
  // Query helpers (used by useGameLoop)
  // -------------------------------------------------------------------------

  getGravityMs(): number {
    return Math.max(
      MIN_GRAVITY_MS,
      BASE_GRAVITY_MS - (this.level - 1) * GRAVITY_STEP_MS
    );
  }

  /**
   * Returns true when the current piece cannot move down —
   * i.e. it is resting on the floor or a locked cell.
   * useGameLoop uses this to drive the lock-delay timer.
   */
  isPieceGrounded(): boolean {
    if (!this.currentPiece || this.isPaused || this.isGameOver) return false;
    return hasCollision(this.board, {
      ...this.currentPiece,
      y: this.currentPiece.y + 1,
    });
  }

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  reset(): void {
    this.clearLineClearTimer();
    this.board = createEmptyBoard();
    this.heldPiece = null;
    this.canHold = true;
    this.nextQueue = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.isGameOver = false;
    this.isPaused = false;
    this.lastClearedLines = 0;
    this.animatingLines = [];
    this.clearedRowsSnapshot = null;
    this.rotationState = 0;
    refillQueue(this.nextQueue, NEXT_PREVIEW_COUNT + 1);
    this.spawnPiece();
  }

  togglePause(): void {
    if (!this.isGameOver) this.isPaused = !this.isPaused;
  }

  /** Gravity step: attempt to move the piece down by one row */
  tick(): void {
    if (this.isPaused || this.isGameOver || this.animatingLines.length > 0) return;
    this.tryMove(0, 1); // if blocked, hook's lock-delay timer fires lockCurrentPiece
  }

  moveLeft(): void {
    if (!this.canAct()) return;
    this.tryMove(-1, 0);
  }

  moveRight(): void {
    if (!this.canAct()) return;
    this.tryMove(1, 0);
  }

  moveDown(): void {
    if (!this.canAct()) return;
    this.tryMove(0, 1);
  }

  hardDrop(): void {
    if (!this.canAct()) return;
    const p = this.currentPiece!;
    const ghostY = getGhostY(this.board, p);
    this.score += (ghostY - p.y) * 2; // hard drop bonus
    this.currentPiece = { ...p, y: ghostY };
    this.lockCurrentPiece();
  }

  rotateCW(): void {
    if (!this.canAct()) return;
    this.tryRotate("CW");
  }

  rotateCCW(): void {
    if (!this.canAct()) return;
    this.tryRotate("CCW");
  }

  hold(): void {
    if (!this.canAct() || !this.canHold) return;
    const current = this.currentPiece!.type;
    if (this.heldPiece === null) {
      this.heldPiece = current;
      this.spawnPiece();
    } else {
      const swap = this.heldPiece;
      this.heldPiece = current;
      this.currentPiece = createPiece(swap);
      this.rotationState = 0;
    }
    this.canHold = false;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private canAct(): boolean {
    return (
      !this.isPaused &&
      !this.isGameOver &&
      this.currentPiece !== null &&
      this.animatingLines.length === 0
    );
  }

  /**
   * Attempt to shift the piece by (dx, dy).
   * Returns true if the move succeeded.
   */
  private tryMove(dx: number, dy: number): boolean {
    if (!this.currentPiece) return false;
    const moved: Piece = {
      ...this.currentPiece,
      x: this.currentPiece.x + dx,
      y: this.currentPiece.y + dy,
    };
    if (hasCollision(this.board, moved)) return false;
    this.currentPiece = moved;
    return true;
  }

  /**
   * SRS rotation with wall-kicks.
   * Tries up to 5 offsets; applies first that fits.
   * O(5 × k²)
   */
  private tryRotate(dir: "CW" | "CCW"): void {
    if (!this.currentPiece) return;
    const newMatrix =
      dir === "CW"
        ? rotateCW(this.currentPiece.matrix)
        : rotateCCW(this.currentPiece.matrix);
    const fromRot = this.rotationState;
    const kicks = getKicks(this.currentPiece.type, fromRot);

    for (const { dx, dy } of kicks) {
      const candidate: Piece = {
        ...this.currentPiece,
        matrix: newMatrix,
        x: this.currentPiece.x + dx,
        y: this.currentPiece.y + dy,
      };
      if (!hasCollision(this.board, candidate)) {
        this.currentPiece = candidate;
        this.rotationState =
          dir === "CW" ? (fromRot + 1) % 4 : (fromRot + 3) % 4;
        return;
      }
    }
  }

  private clearLineClearTimer(): void {
    if (this.lineClearTimer !== null) {
      clearTimeout(this.lineClearTimer);
      this.lineClearTimer = null;
    }
  }

  /** Lock the current piece and spawn the next */
  lockCurrentPiece(): void {
    if (!this.currentPiece || this.isGameOver) return;
    lockPiece(this.board, this.currentPiece);
    this.currentPiece = null;

    // Capture colors of full rows BEFORE clearLines removes them (for particle animation)
    const snapshot: import("../types").Cell[][] = [];
    for (let r = BOARD_ROWS - 1; r >= 0; r--) {
      if (this.board[r].every((cell) => cell !== null)) {
        snapshot.push([...this.board[r]]);
      }
    }
    this.clearedRowsSnapshot = snapshot.length > 0 ? snapshot : null;

    // Scan for full rows — O(rows × cols)
    const clearedRows = clearLines(this.board);
    const count = clearedRows.length;

    if (count > 0) {
      this.lastClearedLines = count;
      this.animatingLines = clearedRows;
      this.addScore(count);
      this.lines += count;
      this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;

      // Pause for animation, then spawn next piece
      this.lineClearTimer = setTimeout(() => {
        this.lineClearTimer = null;
        this.animatingLines = [];
        this.clearedRowsSnapshot = null;
        this.spawnPiece();
      }, LINE_CLEAR_ANIM_MS);
    } else {
      this.lastClearedLines = 0;
      this.spawnPiece();
    }
  }

  private addScore(linesCleared: number): void {
    this.score += (LINE_SCORES[linesCleared] ?? 0) * this.level;
  }

  private spawnPiece(): void {
    refillQueue(this.nextQueue, NEXT_PREVIEW_COUNT + 1);
    // Dequeue from front — O(n) shift; n ≤ 14 so this is O(1) in practice
    const type = this.nextQueue.shift()!;
    this.currentPiece = createPiece(type);
    this.rotationState = 0;
    this.canHold = true;

    // Game-over: new piece spawns into an occupied cell
    if (hasCollision(this.board, this.currentPiece)) {
      this.isGameOver = true;
      this.currentPiece = null;
    }
  }
}

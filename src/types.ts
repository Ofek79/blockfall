// ============================================================
// types.ts — all shared TypeScript interfaces and types
// Centralised here so every module imports from one place.
// ============================================================

/** A single cell on the board. null = empty, string = colour token */
export type Cell = string | null;

/** The 2-D board represented as rows × cols (see Board.ts) */
export type Board = Cell[][];

/** All seven standard Tetromino types */
export type TetrominoType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

/** A rotation is stored as a 2-D matrix of 0/1 */
export type TetrominoMatrix = number[][];

/** Live piece on the board */
export interface Piece {
  type: TetrominoType;
  matrix: TetrominoMatrix; // current rotation state
  x: number; // column offset (0-based, can be negative)
  y: number; // row offset (0-based, can be negative during spawn)
  color: string; // CSS colour token used for rendering
}

/** Snapshot returned from GameEngine each frame */
export interface GameState {
  board: Board;
  currentPiece: Piece | null;
  ghostY: number; // y-position of the ghost piece
  heldPiece: TetrominoType | null;
  canHold: boolean; // false until piece is placed after last hold
  nextQueue: TetrominoType[]; // front = next piece; length = NEXT_PREVIEW_COUNT
  score: number;
  lines: number;
  level: number;
  isGameOver: boolean;
  isPaused: boolean;
  lastClearedLines: number; // 0-4, used for animation triggers
  animatingLines: number[]; // row indices currently in clear animation
  clearedRowsSnapshot: Cell[][] | null; // cell colors captured just before line-clear (for particles)
}

/** Input actions emitted from useKeyboard */
export type GameAction =
  | "MOVE_LEFT"
  | "MOVE_RIGHT"
  | "MOVE_DOWN"
  | "HARD_DROP"
  | "ROTATE_CW"
  | "ROTATE_CCW"
  | "HOLD"
  | "PAUSE"
  | "RESTART";

// ============================================================
// constants.ts — all magic numbers in one place
// ============================================================

/** Board dimensions */
export const BOARD_COLS = 12;
export const BOARD_ROWS = 16;

/** How many "next" pieces to show in the preview panel */
export const NEXT_PREVIEW_COUNT = 3;

/** Milliseconds between automatic down-drops at level 1 */
export const BASE_GRAVITY_MS = 850;

/** Each level shaves this many ms off the gravity interval */
export const GRAVITY_STEP_MS = 75;

/** Minimum gravity interval regardless of level */
export const MIN_GRAVITY_MS = 80;

/** DAS (Delayed Auto-Shift) delay in ms before key-repeat kicks in */
export const DAS_DELAY_MS = 170;

/** Auto-repeat rate in ms while key is held */
export const ARR_MS = 50;

/** Lock-delay in ms: piece locks this long after touching the floor */
export const LOCK_DELAY_MS = 500;

/** Line-clear dissolve animation duration in ms */
export const LINE_CLEAR_ANIM_MS = 500;

/** Scoring table: index = lines cleared (1-4) */
export const LINE_SCORES = [0, 100, 300, 500, 800];

/** Lines needed to advance each level */
export const LINES_PER_LEVEL = 5;

/**
 * Piece colours — classic neon palette designed for a black background.
 * Every hue is maximally saturated so pieces glow distinctly.
 */
export const PIECE_COLORS: Record<string, string> = {
  I: "#00FFFF", // neon cyan
  O: "#FFE600", // neon yellow
  T: "#FF00FF", // neon magenta
  S: "#39FF14", // neon lime
  Z: "#FF3131", // neon red
  J: "#1B88FF", // neon blue
  L: "#FF6600", // neon orange
};

/** UI accent colour — neon cyan, consistent with the I piece */
export const ACCENT = "#00FFFF";

/** Spawn column offset (centres the piece horizontally on a 12-col board) */
export const SPAWN_COL = 4;

/** Number of wall-kick candidates tried for SRS rotation */
export const WALL_KICK_ATTEMPTS = 5;

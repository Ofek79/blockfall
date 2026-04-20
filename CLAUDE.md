# Modern Tetris — CLAUDE.md

This file documents the architecture, design decisions, and data structures used in this project so that AI assistants (and future contributors) have the full context.

---

## Project Overview

A modern Tetris clone built with **React + TypeScript + Vite**, wrapped in **Electron** for desktop use, and deployable to **Google Cloud Run** via Docker. Built as a portfolio project demonstrating clean architecture, well-chosen data structures, and professional development practices.

---

## How to Run

```bash
# Install dependencies
npm install

# Web development mode (hot reload)
npm run dev

# Desktop (Electron) mode — starts Vite + Electron in parallel
npm run electron

# Production build (outputs to dist/)
npm run build

# Preview production build locally
npm run preview
```

---

## Architecture

### File Structure

```
src/
├── types.ts          ← All TypeScript interfaces and type aliases
├── constants.ts      ← All magic numbers and configuration
├── game/
│   ├── Piece.ts      ← Tetromino shapes, rotation, wall-kicks
│   ├── Board.ts      ← Board creation, collision, locking, line-clear
│   └── GameEngine.ts ← Pure game-state machine (no React)
├── hooks/
│   ├── useGameLoop.ts ← requestAnimationFrame loop + gravity
│   └── useKeyboard.ts ← DAS/ARR keyboard input handling
└── components/
    ├── Game.tsx       ← Top-level layout, wires hooks → components
    ├── GameBoard.tsx  ← Renders the 20×10 play-field
    ├── SidePanel.tsx  ← Score, level, hold, next panels
    └── MiniBoard.tsx  ← Reusable mini tetromino renderer
electron/
├── main.cjs          ← Electron main process
└── preload.cjs       ← contextBridge (sandboxed)
```

### Why This Separation?

| Layer | Reason |
|---|---|
| `types.ts` | Single source of truth for types — avoids import cycles |
| `constants.ts` | All tuning parameters in one place — easy to adjust gameplay feel |
| `game/` (pure TS) | Framework-agnostic game logic is fully unit-testable without React |
| `hooks/` | Bridges pure logic → React lifecycle without mixing concerns |
| `components/` | Pure rendering — receive state, emit actions |

---

## Data Structures

### Board — 2-D Array `Cell[][]`

```
Board[row][col]  →  null | "#00f5ff"
```

**Why a 2-D array?**
- O(1) random access by (row, col) for collision checks and rendering
- O(n) row operations (insert/delete) are only needed on line-clears (max 4 rows per frame) — acceptable cost
- Maps naturally to the visual grid of the game

### Next Queue — Array used as a Queue

```
nextQueue: TetrominoType[]  (dequeue from index 0, refill in 7-bag batches)
```

**Why a Queue?**
- FIFO semantics perfectly match "next piece" behaviour
- `Array.shift()` is O(n) for n = queue length, but n ≤ 14 (2 bags max) — constant time in practice
- The **7-bag randomiser** fills the queue with complete shuffled bags, guaranteeing piece diversity

### Piece — 2-D Matrix `number[][]`

```
matrix[row][col]  →  0 | 1
```

**Why a matrix for piece shape?**
- Rotation is a pure matrix operation (transpose + reverse) — O(k²) where k ≤ 4
- SRS wall-kick offsets map to (row, col) deltas — trivial to apply
- Avoids enumerating 4×7=28 pre-baked rotation states

### Rotation State — Integer (0–3)

Tracked separately from the matrix to drive SRS wall-kick offset table lookups without needing to compare matrices.

---

## Key Algorithms

| Algorithm | Location | Complexity |
|---|---|---|
| Collision detection | `Board.ts:hasCollision` | O(k²) |
| Line-clear scan | `Board.ts:clearLines` | O(rows × cols) |
| Ghost piece drop | `Board.ts:getGhostY` | O(rows × k²) |
| SRS rotation + wall-kicks | `GameEngine.ts:tryRotate` | O(5 × k²) |
| 7-bag shuffle | `GameEngine.ts:shuffle` | O(7) Fisher-Yates |
| DAS/ARR repeat | `useKeyboard.ts` | O(1) per keydown/keyup |

---

## Electron Integration

Electron runs in two files to avoid the ESM/CJS conflict:
- `electron/main.cjs` — CommonJS, loads Vite dev server in dev or `dist/index.html` in production
- `electron/preload.cjs` — sandboxed context bridge

The Vite build outputs to `dist/` which Electron points at in production.

---

## Scoring

| Clear | Base points |
|---|---|
| Single | 100 |
| Double | 300 |
| Triple | 500 |
| Tetris | 800 |

All values are multiplied by the current **level**. Hard drop adds 2 points per cell dropped.

---

## Deployment

See `README.md` for the full Cloud Run deployment walkthrough.

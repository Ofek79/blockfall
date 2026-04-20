// ============================================================
// useGameLoop.ts — drives the gravity tick and exposes state
//
// Uses requestAnimationFrame for smooth rendering.
// Gravity and lock-delay are accumulated in the rAF loop so
// they stay in sync with the frame clock (no drift).
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { GameEngine } from "../game/GameEngine";
import type { GameState } from "../types";
import { LOCK_DELAY_MS } from "../constants";

export function useGameLoop() {
  // Single engine instance — survives re-renders via ref
  const engineRef = useRef<GameEngine>(new GameEngine());
  const [state, setState] = useState<GameState>(() =>
    engineRef.current.getState()
  );

  // Refs for mutable loop state (avoids stale closures)
  const gravityAccRef = useRef(0);       // ms since last gravity step
  const lockAccRef = useRef(0);          // ms piece has been grounded
  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  const sync = useCallback(() => {
    setState(engineRef.current.getState());
  }, []);

  // ---- rAF game loop ----
  const loop = useCallback(
    (timestamp: number) => {
      rafRef.current = requestAnimationFrame(loop);

      const engine = engineRef.current;
      const s = engine.getState();

      if (s.isPaused || s.isGameOver || s.animatingLines.length > 0) {
        lastTimeRef.current = null;
        gravityAccRef.current = 0;
        lockAccRef.current = 0;
        sync();
        return;
      }

      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
        return;
      }

      const dt = Math.min(timestamp - lastTimeRef.current, 100); // cap at 100ms
      lastTimeRef.current = timestamp;

      // ---- gravity ----
      gravityAccRef.current += dt;
      if (gravityAccRef.current >= engine.getGravityMs()) {
        gravityAccRef.current -= engine.getGravityMs();
        engine.tick();
      }

      // ---- lock delay ----
      // If piece is grounded (canMoveDown returns false), accumulate lock timer
      if (engine.isPieceGrounded()) {
        lockAccRef.current += dt;
        if (lockAccRef.current >= LOCK_DELAY_MS) {
          lockAccRef.current = 0;
          engine.lockCurrentPiece();
        }
      } else {
        lockAccRef.current = 0;
      }

      sync();
    },
    [sync]
  );

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  // ---- actions ----
  const dispatch = useCallback(
    (action: string) => {
      const engine = engineRef.current;
      switch (action) {
        case "MOVE_LEFT":
          engine.moveLeft();
          lockAccRef.current = 0;
          break;
        case "MOVE_RIGHT":
          engine.moveRight();
          lockAccRef.current = 0;
          break;
        case "MOVE_DOWN":
          engine.moveDown();
          lockAccRef.current = 0;
          break;
        case "HARD_DROP":
          engine.hardDrop();
          lockAccRef.current = 0;
          break;
        case "ROTATE_CW":
          engine.rotateCW();
          lockAccRef.current = 0;
          break;
        case "ROTATE_CCW":
          engine.rotateCCW();
          lockAccRef.current = 0;
          break;
        case "HOLD":
          engine.hold();
          lockAccRef.current = 0;
          break;
        case "PAUSE":
          engine.togglePause();
          break;
        case "RESTART":
          engine.reset();
          gravityAccRef.current = 0;
          lockAccRef.current = 0;
          lastTimeRef.current = null;
          break;
      }
      sync();
    },
    [sync]
  );

  return { state, dispatch };
}

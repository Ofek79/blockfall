// ============================================================
// useKeyboard.ts — maps keyboard events to GameActions
//
// Implements DAS (Delayed Auto-Shift) for left/right:
//   1. First keydown fires immediately.
//   2. After DAS_DELAY_MS the key starts repeating at ARR_MS rate.
// This matches the feel of modern block-falling games.
// ============================================================

import { useEffect, useRef } from "react";
import type { GameAction } from "../types";
import { ARR_MS, DAS_DELAY_MS } from "../constants";

type DispatchFn = (action: GameAction) => void;

const KEY_MAP: Record<string, GameAction> = {
  ArrowLeft: "MOVE_LEFT",
  ArrowRight: "MOVE_RIGHT",
  ArrowDown: "MOVE_DOWN",
  ArrowUp: "ROTATE_CW",
  KeyZ: "ROTATE_CCW",
  KeyX: "ROTATE_CW",
  Space: "HARD_DROP",
  KeyC: "HOLD",
  ShiftLeft: "HOLD",
  KeyP: "PAUSE",
  Escape: "PAUSE",
  KeyR: "RESTART",
};

// Actions that use DAS (held-key repeat)
const DAS_ACTIONS = new Set<GameAction>(["MOVE_LEFT", "MOVE_RIGHT", "MOVE_DOWN"]);

export function useKeyboard(dispatch: DispatchFn, disabled = false) {
  const heldRef = useRef<Map<GameAction, { dasTimer: ReturnType<typeof setTimeout> | null; arrTimer: ReturnType<typeof setInterval> | null }>>(new Map());

  useEffect(() => {
    const held = heldRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      // Prevent browser scroll on arrow keys / space
      if (
        ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space"].includes(
          e.code
        )
      ) {
        e.preventDefault();
      }

      const action = KEY_MAP[e.code];
      if (!action) return;
      if (held.has(action)) return; // already tracking this key

      // Fire immediately
      dispatch(action);

      if (DAS_ACTIONS.has(action)) {
        // Start DAS: after delay, begin auto-repeat at ARR rate
        const dasTimer = setTimeout(() => {
          const arrTimer = setInterval(() => dispatch(action), ARR_MS);
          const entry = held.get(action);
          if (entry) entry.arrTimer = arrTimer;
        }, DAS_DELAY_MS);

        held.set(action, { dasTimer, arrTimer: null });
      } else {
        held.set(action, { dasTimer: null, arrTimer: null });
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const action = KEY_MAP[e.code];
      if (!action) return;
      const entry = held.get(action);
      if (!entry) return;

      if (entry.dasTimer !== null) clearTimeout(entry.dasTimer);
      if (entry.arrTimer !== null) clearInterval(entry.arrTimer);
      held.delete(action);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      // Clean up any live timers
      held.forEach((entry) => {
        if (entry.dasTimer !== null) clearTimeout(entry.dasTimer);
        if (entry.arrTimer !== null) clearInterval(entry.arrTimer);
      });
      held.clear();
    };
  }, [dispatch, disabled]);
}

/**
 * Line-clear dissolve effect.
 *
 * Cells in cleared rows glow with their own colour, then fade out smoothly.
 * Total duration: ~480 ms. No flash, no flying particles.
 */

import React, { useEffect, useRef } from "react";
import type { Cell } from "../types";

export const CANVAS_OVERFLOW = 0; // no overflow needed — effect stays inside rows

interface Props {
  animatingLines: number[];
  clearedRowsSnapshot: Cell[][] | null;
  boardWidth: number;
  boardHeight: number;
  cellSize: number;
}

const GAP = 1;
const DURATION_MS = 480;

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [160, 160, 160];
}

function smoothstep(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

const LineClearParticles: React.FC<Props> = ({
  animatingLines,
  clearedRowsSnapshot,
  boardWidth,
  boardHeight,
  cellSize,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    if (!animatingLines.length || !clearedRowsSnapshot?.length) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const startTime = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - startTime) / DURATION_MS, 1);
      ctx.clearRect(0, 0, boardWidth, boardHeight);
      if (t >= 1) return;

      // Cell body: full opacity until t=0.15, then smooth fade to 0
      const cellAlpha = t < 0.15 ? 1.0 : 1.0 - smoothstep((t - 0.15) / 0.85);

      // Glow: ramp up 0→0.35, peak 0.35→0.5, ramp down 0.5→1
      const glowT =
        t < 0.35 ? smoothstep(t / 0.35)
        : t < 0.5 ? 1.0
        : 1.0 - smoothstep((t - 0.5) / 0.5);

      animatingLines.forEach((rowIdx, snapIdx) => {
        const rowColors = clearedRowsSnapshot![snapIdx];
        if (!rowColors) return;

        for (let col = 0; col < rowColors.length; col++) {
          const color = (rowColors[col] as string) ?? "#aaaaaa";
          const [r, g, b] = hexToRgb(color);

          const cx = col * (cellSize + GAP);
          const cy = rowIdx * (cellSize + GAP);
          const cs = cellSize;

          // Glow bloom layer
          if (glowT > 0.02) {
            ctx.save();
            ctx.globalAlpha = glowT * 0.65;
            ctx.shadowBlur  = cs * 2.8 * glowT;
            ctx.shadowColor = `rgb(${r},${g},${b})`;
            ctx.fillStyle   = `rgb(${r},${g},${b})`;
            ctx.fillRect(cx + cs * 0.15, cy + cs * 0.15, cs * 0.7, cs * 0.7);
            ctx.restore();
          }

          // Cell body, slightly brightened at peak glow
          if (cellAlpha > 0.01) {
            const lift = Math.round(glowT * 55);
            const fr = Math.min(255, r + lift);
            const fg = Math.min(255, g + lift);
            const fb = Math.min(255, b + lift);

            ctx.save();
            ctx.globalAlpha = cellAlpha;
            if (glowT > 0.02) {
              ctx.shadowBlur  = cs * 0.6 * glowT;
              ctx.shadowColor = `rgb(${r},${g},${b})`;
            }
            ctx.fillStyle = `rgb(${fr},${fg},${fb})`;
            ctx.fillRect(cx, cy, cs, cs);
            ctx.restore();
          }
        }
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (canvas) ctx.clearRect(0, 0, boardWidth, boardHeight);
    };
  // Intentionally omit clearedRowsSnapshot: getState() creates a new array
  // reference every rAF frame while animating, which would cancel+restart this
  // effect every frame. animatingLines.join(",") is the stable trigger.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animatingLines.join(",")]);

  return (
    <canvas
      ref={canvasRef}
      width={boardWidth}
      height={boardHeight}
      style={{
        position:      "absolute",
        left:           0,
        top:            0,
        pointerEvents: "none",
        zIndex:         20,
      }}
    />
  );
};

export default LineClearParticles;

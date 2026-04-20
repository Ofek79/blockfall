// ============================================================
// MiniBoard.tsx — renders a small tetromino preview (hold / next)
// ============================================================

import React from "react";
import type { TetrominoType } from "../types";
import { PIECE_COLORS } from "../constants";
import { createPiece } from "../game/Piece";

interface Props {
  type: TetrominoType | null;
  dim?: boolean;
}

const MiniBoard: React.FC<Props> = ({ type, dim = false }) => {
  if (!type) {
    return (
      <div
        style={{
          width: 72,
          height: 52,
          background: "rgba(255,255,255,0.02)",
          borderRadius: 5,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      />
    );
  }

  const piece = createPiece(type);
  const matrix = piece.matrix;
  const color = PIECE_COLORS[type];

  let minR = matrix.length, maxR = 0, minC = matrix[0].length, maxC = 0;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }

  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  const cellSize = type === "I" ? 12 : 14;
  const gap = 1;

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap,
        opacity: dim ? 0.28 : 1,
        transition: "opacity 0.2s",
        padding: 8,
        background: "rgba(255,255,255,0.03)",
        borderRadius: 5,
        border: "1px solid rgba(255,255,255,0.07)",
        minWidth: 72,
        minHeight: 52,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} style={{ display: "flex", gap }}>
          {Array.from({ length: cols }, (_, c) => {
            const filled = matrix[minR + r][minC + c];
            return (
              <div
                key={c}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 2,
                  background: filled ? color : "transparent",
                  boxShadow: filled
                    ? `inset 0 1px 0 rgba(255,255,255,0.2), 0 0 ${cellSize * 0.6}px ${color}44`
                    : "none",
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default MiniBoard;

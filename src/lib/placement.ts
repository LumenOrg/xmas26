import type { Piece, PieceKind } from '../types';
import { zoneForKind } from '../types';

export interface Position {
  x: number;
  y: number;
}

const treeSlots: Position[] = [
  { x: 0.5, y: 0.19 },
  { x: 0.4, y: 0.39 },
  { x: 0.61, y: 0.42 },
  { x: 0.29, y: 0.64 },
  { x: 0.5, y: 0.62 },
  { x: 0.72, y: 0.68 },
  { x: 0.39, y: 0.77 },
  { x: 0.62, y: 0.79 },
];

const groundSlots: Position[] = [
  { x: 0.2, y: 0.49 },
  { x: 0.39, y: 0.54 },
  { x: 0.6, y: 0.5 },
  { x: 0.79, y: 0.55 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function clampPosition(kind: PieceKind, position: Position): Position {
  const zone = zoneForKind(kind);
  if (zone === 'ground') {
    return { x: clamp(position.x, 0.12, 0.88), y: clamp(position.y, 0.34, 0.72) };
  }

  const minimumY = kind === 'star' ? 0.04 : 0.16;
  const y = clamp(position.y, minimumY, 0.82);
  const halfWidth = 0.08 + ((Math.max(y, 0.16) - 0.16) / 0.66) * 0.34;
  return { x: clamp(position.x, 0.5 - halfWidth, 0.5 + halfWidth), y };
}

export function nextSlot(kind: PieceKind, pieces: Piece[]): Position {
  if (kind === 'star' && !pieces.some((piece) => piece.kind === 'star')) {
    return { x: 0.5, y: 0.04 };
  }
  const zone = zoneForKind(kind);
  const slots = zone === 'tree' ? treeSlots : groundSlots;
  const count = pieces.filter((piece) => piece.zone === zone).length;
  const slot = slots[count % slots.length];
  const cycle = Math.floor(count / slots.length);
  return clampPosition(kind, {
    x: slot.x + (cycle % 2 === 0 ? 0 : 0.045),
    y: slot.y + Math.min(cycle, 2) * 0.025,
  });
}

export function positionInElement(
  point: Position,
  element: HTMLElement,
  kind: PieceKind,
): Position {
  const bounds = element.getBoundingClientRect();
  return clampPosition(kind, {
    x: (point.x - bounds.left) / bounds.width,
    y: (point.y - bounds.top) / bounds.height,
  });
}

import { describe, expect, it } from 'vitest';
import { clampPosition, nextSlot } from './placement';
import type { Piece } from '../types';

describe('postcard placement', () => {
  it('keeps ornaments inside the tree silhouette and presents on the ground', () => {
    expect(clampPosition('red-bauble', { x: 0, y: 0.16 })).toEqual({ x: 0.42, y: 0.16 });
    expect(clampPosition('red-bauble', { x: 1, y: 0.82 }).x).toBeCloseTo(0.92);
    expect(clampPosition('red-gift', { x: -1, y: 2 })).toEqual({ x: 0.12, y: 0.72 });
    expect(clampPosition('star', { x: 0.5, y: 0 })).toEqual({ x: 0.5, y: 0.04 });
  });

  it('offers a different starting spot as children add more items', () => {
    const first = nextSlot('star', []);
    expect(first).toEqual({ x: 0.5, y: 0.04 });
    const pieces: Piece[] = [{ id: '1', kind: 'star', zone: 'tree', ...first }];
    expect(nextSlot('star', pieces)).not.toEqual(first);
    expect(nextSlot('red-gift', pieces)).toEqual({ x: 0.2, y: 0.49 });
    expect(nextSlot('star', [{ id: '2', kind: 'red-bauble', zone: 'tree', x: 0.5, y: 0.4 }])).toEqual(first);
  });
});

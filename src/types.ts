export const ornamentKinds = [
  'red-bauble',
  'gold-bauble',
  'blue-bauble',
  'star',
  'snowflake',
  'candy-cane',
] as const;

export const presentKinds = ['red-gift', 'blue-gift', 'gold-gift'] as const;

export type OrnamentKind = (typeof ornamentKinds)[number];
export type PresentKind = (typeof presentKinds)[number];
export type PieceKind = OrnamentKind | PresentKind;
export type Zone = 'tree' | 'ground';

export interface Piece {
  id: string;
  kind: PieceKind;
  zone: Zone;
  x: number;
  y: number;
}

export const labels: Record<PieceKind, string> = {
  'red-bauble': 'Piros gömb',
  'gold-bauble': 'Arany gömb',
  'blue-bauble': 'Kék gömb',
  star: 'Csillag',
  snowflake: 'Hópehely',
  'candy-cane': 'Cukorpálca',
  'red-gift': 'Piros ajándék',
  'blue-gift': 'Kék ajándék',
  'gold-gift': 'Arany ajándék',
};

export function zoneForKind(kind: PieceKind): Zone {
  return kind === 'red-gift' || kind === 'blue-gift' || kind === 'gold-gift' ? 'ground' : 'tree';
}

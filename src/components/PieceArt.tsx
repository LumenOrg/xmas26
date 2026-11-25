import type { PieceKind } from '../types';

interface PieceArtProps {
  kind: PieceKind;
}

const baubleColors: Partial<Record<PieceKind, string>> = {
  'red-bauble': '#dc5653',
  'gold-bauble': '#edbf54',
  'blue-bauble': '#6c9fc4',
};

export function PieceArt({ kind }: PieceArtProps) {
  const baubleColor = baubleColors[kind];
  if (baubleColor) {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <path d="M50 7v12" stroke="#6b5a3b" strokeWidth="5" strokeLinecap="round" />
        <rect x="40" y="19" width="20" height="10" rx="3" fill="#b88b4a" />
        <circle cx="50" cy="59" r="34" fill={baubleColor} stroke="#fff6d6" strokeWidth="3" />
        <ellipse cx="39" cy="46" rx="8" ry="13" fill="#fff" opacity=".46" transform="rotate(30 39 46)" />
        <circle cx="61" cy="72" r="5" fill="#fff" opacity=".18" />
      </svg>
    );
  }

  if (kind === 'star') {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <path d="M50 7 62 35 93 38 69 59 76 90 50 74 24 90 31 59 7 38 38 35Z" fill="#f5ce65" stroke="#fff1b6" strokeWidth="4" strokeLinejoin="round" />
        <path d="M50 21 56 39 75 41" fill="none" stroke="#fff9d9" strokeWidth="4" strokeLinecap="round" opacity=".8" />
      </svg>
    );
  }

  if (kind === 'snowflake') {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <g fill="none" stroke="#dceff4" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M50 8v84M14 29l72 42M14 71l72-42" />
          <path d="m39 19 11 10 11-10M39 81l11-10 11 10M18 43l15 1-3-14M82 57l-15-1 3 14M30 70l3-14-15 1M70 30l-3 14 15-1" strokeWidth="4" />
        </g>
        <circle cx="50" cy="50" r="7" fill="#fff" />
      </svg>
    );
  }

  if (kind === 'candy-cane') {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <path d="M36 89V34a19 19 0 0 1 38 0v7" fill="none" stroke="#fff8e8" strokeWidth="22" strokeLinecap="round" />
        <path d="M36 89V34a19 19 0 0 1 38 0v7" fill="none" stroke="#cf5455" strokeWidth="17" strokeDasharray="13 14" strokeLinecap="round" />
      </svg>
    );
  }

  const giftColor = kind === 'red-gift' ? '#d95355' : kind === 'blue-gift' ? '#5c93bb' : '#e8ad4d';
  const ribbonColor = kind === 'gold-gift' ? '#fff1bd' : '#f6d67b';
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d="M12 34h76v56H12z" fill={giftColor} stroke="#fff2dc" strokeWidth="3" />
      <path d="M8 27h84v18H8z" fill={giftColor} stroke="#fff2dc" strokeWidth="3" />
      <path d="M43 27h14v63H43z" fill={ribbonColor} />
      <path d="M8 32h84v10H8z" fill={ribbonColor} />
      <path d="M49 26C31 21 27 12 34 9c9-5 17 9 16 17Zm2 0c18-5 22-14 15-17-9-5-17 9-16 17Z" fill="none" stroke={ribbonColor} strokeWidth="7" strokeLinejoin="round" />
    </svg>
  );
}

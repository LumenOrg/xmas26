import { useDraggable, useDroppable } from '@dnd-kit/react';
import type { RefObject } from 'react';
import { labels, zoneForKind, type Piece, type PieceKind } from '../types';
import { PieceArt } from './PieceArt';

interface CardSceneProps {
  cardRef: RefObject<HTMLDivElement | null>;
  pieces: Piece[];
  name: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

interface PlacedPieceProps {
  piece: Piece;
  selected: boolean;
  onSelect: (id: string) => void;
}

function PlacedPiece({ piece, selected, onSelect }: PlacedPieceProps) {
  const { ref, isDragging } = useDraggable({ id: piece.id, type: piece.zone });
  return (
    <button
      ref={ref}
      type="button"
      className={`placed-piece ${piece.zone === 'ground' ? 'placed-gift' : ''} ${selected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{ left: `${piece.x * 100}%`, top: `${piece.y * 100}%` }}
      onClick={() => onSelect(piece.id)}
      aria-label={`${labels[piece.kind]} a képeslapon. Koppints a kiválasztáshoz, vagy húzd arrébb.`}
      aria-pressed={selected}
    >
      <PieceArt kind={piece.kind} />
    </button>
  );
}

interface PaletteItemProps {
  kind: PieceKind;
  onAdd: (kind: PieceKind) => void;
}

export function PaletteItem({ kind, onAdd }: PaletteItemProps) {
  const zone = zoneForKind(kind);
  const { ref, isDragging } = useDraggable({ id: `palette:${kind}`, type: zone });
  return (
    <button
      ref={ref}
      type="button"
      className={`palette-item ${isDragging ? 'dragging' : ''}`}
      onClick={() => {
        if (!isDragging) onAdd(kind);
      }}
      aria-label={`${labels[kind]} hozzáadása. Koppints, vagy húzd a képeslapra.`}
    >
      <span className="palette-art"><PieceArt kind={kind} /></span>
      <span className="palette-label">{labels[kind]}</span>
    </button>
  );
}

export function CardScene({ cardRef, pieces, name, selectedId, onSelect }: CardSceneProps) {
  const { ref: treeRef, isDropTarget: treeActive } = useDroppable({ id: 'tree', accept: 'tree' });
  const { ref: groundRef, isDropTarget: groundActive } = useDroppable({ id: 'ground', accept: 'ground' });
  const trimmedName = name.trim();

  return (
    <div className="postcard" ref={cardRef} role="group" aria-label="A készülő karácsonyi képeslap">
      <svg className="card-sky" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <circle cx="105" cy="110" r="5" /><circle cx="220" cy="75" r="4" /><circle cx="530" cy="82" r="5" />
        <circle cx="775" cy="110" r="4" /><circle cx="1040" cy="88" r="5" /><circle cx="1110" cy="260" r="3" />
        <path d="M120 275v28m-14-14h28M762 275v23m-11-11h22M1080 440v26m-13-13h26" strokeWidth="3" />
      </svg>
      <div className="card-moon" aria-hidden="true" />
      <div className="card-hill" aria-hidden="true" />

      <div ref={treeRef} className={`tree-zone ${treeActive ? 'drop-active' : ''}`} role="group" aria-label="Karácsonyfa, ide kerülnek a díszek">
        <svg className="tree-art" viewBox="0 0 600 560" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M278 451h44v102h-44z" fill="#835947" />
          <path d="M300 10 188 177h37L125 337h54L44 525h512L421 337h54L375 177h37Z" fill="#20745f" stroke="#155944" strokeWidth="8" strokeLinejoin="round" />
          <path d="M300 10 188 177h37L125 337h54L44 525h256Z" fill="#2c896d" opacity=".76" />
          <path d="M188 177c39 18 72 22 112 19m75-19c-30 16-52 19-75 19M125 337c66 27 117 30 175 27m175-27c-68 26-120 29-175 27" fill="none" stroke="#b6d5b9" strokeWidth="8" strokeLinecap="round" opacity=".7" />
          <path d="M80 525c77-25 139-25 220-22m220 22c-77-25-139-25-220-22" fill="none" stroke="#b6d5b9" strokeWidth="8" strokeLinecap="round" opacity=".58" />
        </svg>
        {pieces.filter((piece) => piece.zone === 'tree').map((piece) => (
          <PlacedPiece key={piece.id} piece={piece} selected={piece.id === selectedId} onSelect={onSelect} />
        ))}
      </div>

      <div ref={groundRef} className={`ground-zone ${groundActive ? 'drop-active' : ''}`} role="group" aria-label="A fa alja, ide kerülnek az ajándékok">
        {pieces.filter((piece) => piece.zone === 'ground').map((piece) => (
          <PlacedPiece key={piece.id} piece={piece} selected={piece.id === selectedId} onSelect={onSelect} />
        ))}
      </div>

      <div className="card-copy">
        <p className="card-kicker">Lumen adventi műhely</p>
        <p className="card-greeting">Boldog<br />karácsonyt!</p>
        <p className="card-signature">{trimmedName ? `Szeretettel: ${trimmedName}` : 'Szeretettel: …'}</p>
        <div className="card-brand">
          <img src={`${import.meta.env.BASE_URL}lumen-mark.svg`} alt="" />
          <span>Lumen Egyesület</span>
        </div>
      </div>
    </div>
  );
}

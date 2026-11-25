import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { domToBlob } from 'modern-screenshot';
import { useEffect, useReducer, useRef, useState, type ComponentProps } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { CardScene, PaletteItem } from './components/CardScene';
import { PieceArt } from './components/PieceArt';
import { clampPosition, nextSlot, positionInElement, type Position } from './lib/placement';
import { labels, ornamentKinds, presentKinds, zoneForKind, type Piece, type PieceKind } from './types';

interface EditorState {
  pieces: Piece[];
  history: Piece[][];
  selectedId: string | null;
}

type EditorAction =
  | { type: 'add'; kind: PieceKind; position?: Position }
  | { type: 'move'; id: string; position: Position }
  | { type: 'nudge'; id: string; dx: number; dy: number }
  | { type: 'remove'; id: string }
  | { type: 'select'; id: string | null }
  | { type: 'undo' }
  | { type: 'reset' };

const initialState: EditorState = { pieces: [], history: [], selectedId: null };

function remember(state: EditorState, pieces: Piece[], selectedId: string | null): EditorState {
  return {
    pieces,
    selectedId,
    history: [...state.history.slice(-19), state.pieces],
  };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'add': {
      const zone = zoneForKind(action.kind);
      const position = action.position ?? nextSlot(action.kind, state.pieces);
      const piece: Piece = {
        id: crypto.randomUUID(),
        kind: action.kind,
        zone,
        ...clampPosition(action.kind, position),
      };
      return remember(state, [...state.pieces, piece], piece.id);
    }
    case 'move':
    case 'nudge': {
      const piece = state.pieces.find((item) => item.id === action.id);
      if (!piece) return state;
      const position = action.type === 'move'
        ? clampPosition(piece.kind, action.position)
        : clampPosition(piece.kind, { x: piece.x + action.dx, y: piece.y + action.dy });
      if (Math.abs(position.x - piece.x) < 0.001 && Math.abs(position.y - piece.y) < 0.001) return state;
      return remember(
        state,
        state.pieces.map((item) => item.id === piece.id ? { ...item, ...position } : item),
        piece.id,
      );
    }
    case 'remove':
      if (!state.pieces.some((piece) => piece.id === action.id)) return state;
      return remember(state, state.pieces.filter((piece) => piece.id !== action.id), null);
    case 'select':
      return { ...state, selectedId: action.id };
    case 'undo': {
      const previous = state.history.at(-1);
      if (!previous) return state;
      return { pieces: previous, history: state.history.slice(0, -1), selectedId: null };
    }
    case 'reset':
      return initialState;
  }
}

interface ExportedImage {
  blob: Blob;
  url: string;
  signature: string;
}

function isPieceKind(value: string): value is PieceKind {
  return [...ornamentKinds, ...presentKinds].some((kind) => kind === value);
}

function imageFile(blob: Blob): File {
  return new File([blob], 'lumen-adventi-kepeslap.png', { type: 'image/png' });
}

function App() {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const [name, setName] = useState('');
  const [exported, setExported] = useState<ExportedImage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const signature = JSON.stringify([state.pieces, name.trim()]);
  const currentExport = exported?.signature === signature ? exported : null;
  const selected = state.pieces.find((piece) => piece.id === state.selectedId);
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  // Keep the image URL alive for the adult's open/share action, then release it.
  const exportUrlRef = useRef<string | null>(null);
  useEffect(() => () => {
    if (exportUrlRef.current) URL.revokeObjectURL(exportUrlRef.current);
  }, []);
  function replaceExport(next: ExportedImage | null) {
    if (exportUrlRef.current) URL.revokeObjectURL(exportUrlRef.current);
    exportUrlRef.current = next?.url ?? null;
    setExported(next);
  }

  function addPiece(kind: PieceKind) {
    dispatch({ type: 'add', kind });
    setMessage(`${labels[kind]} a képeslapra került.`);
  }

  function handleDragEnd(event: Parameters<NonNullable<ComponentProps<typeof DragDropProvider>['onDragEnd']>>[0]) {
    if (event.canceled) return;
    const { source, target, position } = event.operation;
    if (!source || !target) return;
    const sourceId = String(source.id);
    const zone = String(target.id);
    if (zone !== 'tree' && zone !== 'ground') return;
    const paletteKind = sourceId.startsWith('palette:') ? sourceId.slice('palette:'.length) : null;
    const piece = paletteKind === null ? state.pieces.find((item) => item.id === sourceId) : undefined;
    const kind = paletteKind !== null && isPieceKind(paletteKind) ? paletteKind : piece?.kind;
    if (!kind || zoneForKind(kind) !== zone) return;
    const zoneElement = cardRef.current?.querySelector<HTMLElement>(`.${zone}-zone`);
    if (!zoneElement) return;

    const nativeEvent = event.nativeEvent;
    const point = nativeEvent instanceof PointerEvent
      ? { x: nativeEvent.clientX, y: nativeEvent.clientY }
      : position.current;
    const placedAt = positionInElement(point, zoneElement, kind);

    if (paletteKind !== null) {
      dispatch({ type: 'add', kind, position: placedAt });
      setMessage(`${labels[kind]} a képeslapra került.`);
      return;
    }

    if (piece) {
      dispatch({ type: 'move', id: sourceId, position: placedAt });
      setMessage(`${labels[piece.kind]} áthelyezve.`);
    }
  }

  async function makeImage() {
    if (!name.trim()) {
      setMessage('Előbb írd be a neved!');
      nameRef.current?.focus();
      return;
    }
    const card = cardRef.current;
    if (!card || isSaving) return;

    setIsSaving(true);
    setMessage('Készül a képeslap képe…');
    card.dataset.exporting = 'true';
    try {
      await document.fonts.ready;
      await Promise.all(Array.from(card.querySelectorAll('img')).map((image) => image.decode()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const width = card.getBoundingClientRect().width;
      if (width <= 0) throw new Error('A képeslap nem látható.');
      const blob = await domToBlob(card, {
        type: 'image/png',
        backgroundColor: '#fff8e8',
        scale: 1800 / width,
      });
      if (!blob) throw new Error('Nem sikerült elkészíteni a képet.');
      const url = URL.createObjectURL(blob);
      replaceExport({ blob, url, signature });
      setMessage('Elkészült! Most megnyithatod vagy megoszthatod a képet.');
    } catch (error) {
      setMessage(error instanceof Error ? `Nem sikerült menteni: ${error.message}` : 'Nem sikerült menteni. Próbáld újra!');
    } finally {
      delete card.dataset.exporting;
      setIsSaving(false);
    }
  }

  async function shareImage() {
    if (!currentExport || !navigator.share) return;
    try {
      await navigator.share({ files: [imageFile(currentExport.blob)], title: 'Lumen adventi képeslap' });
      setMessage('A képeslap átadva a megosztáshoz.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMessage('A megosztás most nem sikerült. A képet megnyithatod vagy letöltheted.');
    }
  }

  function startNewCard() {
    if ((state.pieces.length > 0 || name.trim()) && !window.confirm('Új képeslapot kezdtek? A mostani díszítés törlődik.')) return;
    dispatch({ type: 'reset' });
    setName('');
    replaceExport(null);
    setMessage('Új képeslap kezdődött.');
    nameRef.current?.blur();
  }

  const canShare = currentExport && typeof navigator.canShare === 'function'
    ? navigator.canShare({ files: [imageFile(currentExport.blob)] })
    : false;
  const hasDraft = state.pieces.length > 0 || Boolean(name.trim());

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <div className="app-shell">
        <header className="app-header">
          <div className="header-mark"><img src={`${import.meta.env.BASE_URL}lumen-mark.svg`} alt="" /></div>
          <div>
            <p className="eyebrow">Lumen adventi műhely</p>
            <h1>Az én karácsonyi képeslapom</h1>
          </div>
        </header>

        <main className="workspace">
          <section className="stage" aria-labelledby="stage-title">
            <div className="stage-heading">
              <h2 id="stage-title">Díszítsd fel a fát!</h2>
              <p>Koppints egy díszre, vagy húzd a képeslapra.</p>
            </div>
            <CardScene cardRef={cardRef} pieces={state.pieces} name={name} selectedId={state.selectedId} onSelect={(id) => dispatch({ type: 'select', id })} />
            <div className="stage-actions">
              <button type="button" className="small-action" onClick={() => dispatch({ type: 'undo' })} disabled={state.history.length === 0}>Visszavonás</button>
              {selected && (
                <div className="selected-actions" aria-label="Kiválasztott dísz szerkesztése">
                  <span>{labels[selected.kind]}</span>
                  <button type="button" className="small-action" onClick={() => dispatch({ type: 'nudge', id: selected.id, dx: -0.04, dy: 0 })}>Balra</button>
                  <button type="button" className="small-action" onClick={() => dispatch({ type: 'nudge', id: selected.id, dx: 0.04, dy: 0 })}>Jobbra</button>
                  <button type="button" className="small-action" onClick={() => dispatch({ type: 'nudge', id: selected.id, dx: 0, dy: -0.04 })}>Fel</button>
                  <button type="button" className="small-action" onClick={() => dispatch({ type: 'nudge', id: selected.id, dx: 0, dy: 0.04 })}>Le</button>
                  <button type="button" className="small-action remove-action" onClick={() => dispatch({ type: 'remove', id: selected.id })}>Levétel</button>
                </div>
              )}
            </div>
          </section>

          <aside className="control-panel" aria-label="Díszek és mentés">
            <section className="palette-section" aria-labelledby="ornaments-title">
              <h2 id="ornaments-title">Díszek a fára</h2>
              <div className="palette-grid">
                {ornamentKinds.map((kind) => <PaletteItem key={kind} kind={kind} onAdd={addPiece} />)}
              </div>
            </section>

            <section className="palette-section" aria-labelledby="presents-title">
              <h2 id="presents-title">Ajándékok a fa alá</h2>
              <div className="palette-grid">
                {presentKinds.map((kind) => <PaletteItem key={kind} kind={kind} onAdd={addPiece} />)}
              </div>
            </section>

            <section className="finish-section" aria-labelledby="finish-title">
              <h2 id="finish-title">Ki készítette?</h2>
              <label htmlFor="child-name">Írd ide a neved</label>
              <input
                ref={nameRef}
                id="child-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={28}
                autoComplete="off"
                placeholder="A neved"
              />
              <button type="button" className="save-button" onClick={makeImage} disabled={isSaving}>
                {isSaving ? 'Kép készül…' : 'Kész a képeslap!'}
              </button>
              <p className="save-hint">A kész képet egy felnőtt tudja menteni vagy megosztani.</p>
              {message && <p className="save-feedback" role="status" aria-live="polite">{message}</p>}
            </section>

            {currentExport && (
              <section className="export-section" aria-label="Elkészült kép">
                <h2>Elkészült!</h2>
                <img src={currentExport.url} alt="Az elkészült karácsonyi képeslap előnézete" />
                <a className="export-button" href={currentExport.url} target="_blank" rel="noopener noreferrer">Kép megnyitása</a>
                {canShare && <button type="button" className="small-action" onClick={shareImage}>Megosztás vagy mentés</button>}
                <a className="download-link" href={currentExport.url} download="lumen-adventi-kepeslap.png">Kép letöltése</a>
              </section>
            )}

            <div className="adult-actions">
              <button type="button" className="new-card-button" onClick={startNewCard}>Új képeslap</button>
              <p>Új gyerek előtt ezzel ürítheted a képeslapot.</p>
            </div>
          </aside>
        </main>

        <footer className="app-footer">
          {offlineReady && <p>Offline használatra kész. <button type="button" onClick={() => setOfflineReady(false)}>Rendben</button></p>}
          {needRefresh && (
            <p>
              Új verzió érhető el. {hasDraft ? 'Előbb fejezzétek be ezt a képeslapot.' : <button type="button" onClick={() => updateServiceWorker(true)}>Frissítés</button>}
              <button type="button" onClick={() => setNeedRefresh(false)}>Később</button>
            </p>
          )}
        </footer>
      </div>
      <DragOverlay dropAnimation={null}>
        {(source) => {
          const id = String(source.id);
          const kind = id.startsWith('palette:') ? id.slice('palette:'.length) : state.pieces.find((piece) => piece.id === id)?.kind;
          return kind && isPieceKind(kind) ? <span className="drag-preview"><PieceArt kind={kind} /></span> : null;
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}

export default App;

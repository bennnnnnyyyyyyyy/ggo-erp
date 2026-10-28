import { useState, type ReactNode } from 'react';

// The shared Board view: records in columns (deals by stage; later tasks, tickets, candidates).
// Drag a card to another column to move it; `onMove` saves the change.

export type BoardColumn = { id: string; title: string; footer?: ReactNode; tone?: 'won' | 'lost' };

export function BoardView<T>({
  columns,
  items,
  columnOf,
  itemKey,
  renderCard,
  onMove,
  canMove,
}: {
  columns: BoardColumn[];
  items: T[];
  columnOf: (item: T) => string;
  itemKey: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  onMove: (item: T, columnId: string) => void;
  canMove: boolean;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  return (
    <div className="board">
      {columns.map((col) => {
        const cards = items.filter((i) => columnOf(i) === col.id);
        return (
          <section
            key={col.id}
            className={`board-col${over === col.id ? ' over' : ''}${col.tone ? ` tone-${col.tone}` : ''}`}
            onDragOver={(e) => {
              if (!dragging) return;
              e.preventDefault();
              setOver(col.id);
            }}
            onDragLeave={() => setOver((o) => (o === col.id ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              const item = items.find((i) => itemKey(i) === dragging);
              setDragging(null);
              setOver(null);
              if (item && columnOf(item) !== col.id) onMove(item, col.id);
            }}
          >
            <header className="board-col-head">
              <span>{col.title}</span>
              <span className="muted small">{cards.length}</span>
            </header>
            {col.footer && <div className="board-col-sum muted small">{col.footer}</div>}
            <div className="board-cards">
              {cards.map((item) => (
                <div
                  key={itemKey(item)}
                  className={`board-card${dragging === itemKey(item) ? ' dragging' : ''}`}
                  draggable={canMove}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    setDragging(itemKey(item));
                  }}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                >
                  {renderCard(item)}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

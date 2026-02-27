"use client";

import { Dispatch, forwardRef, SetStateAction, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { UseFieldArrayMove, UseFieldArrayRemove } from "react-hook-form";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "../../../../_components/confirm-dialog";
import { Delete02Icon, DragDropVerticalIcon, PlusSignIcon } from "hugeicons-react";
import { CardForm } from "@/types/spreads";

gsap.registerPlugin(Draggable);

const TILE_HEIGHT = 38;
const TILE_GAP = 5;
const SLOT_SIZE = TILE_HEIGHT + TILE_GAP;

interface CardOverviewProps {
  cardCount: number;
  selectedCardIndex: number | null;
  setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
  move: UseFieldArrayMove;
  remove: UseFieldArrayRemove;
  addCard: () => void;
  maxCards?: number;
}

function CardTileName({ index, isHovering = false }: { index: number; isHovering?: boolean }) {
  const { control } = useFormContext<{ positions: CardForm[] }>();
  const name = useWatch({ control, name: `positions.${index}.name` });
  const doubleDigitIndex = index >= 9

  return (
    <div className={`relative truncate text-sm mx-1 ${doubleDigitIndex ? "pl-6" : "pl-4"}`}>
      <DragDropVerticalIcon size={20} color="var(--muted-foreground)" strokeWidth={2.5} className={`absolute ${doubleDigitIndex ? "-left-0.5" : "-left-1.5"} ${isHovering ? "scale-100" : "scale-0"} duration-150`} />  
      <span className={`absolute left-0 text-muted-foreground/80 font-medium font-mono mr-1.5 ${isHovering ? "scale-0" : "scale-100"} duration-150`}>{index + 1}</span>
      {name || <span className="text-muted-foreground/40 italic">Untitled</span>}
    </div>
  );
}

interface CardTileProps {
  index: number;
  isSelected: boolean;
  variant?: "readonly" | "editable";
  onClick?: () => void;
  rightSlot?: React.ReactNode;
}

const CardTile = forwardRef<HTMLDivElement, CardTileProps>(
  ({ index, isSelected, variant = "editable", onClick, rightSlot }, ref) => {
    const [isHovering, setIsHovering] = useState(false)

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`flex items-center justify-between rounded-lg border px-3 cursor-pointer transition-all duration-200 !overflow-visible ${
          isSelected ? "border-gold/80 bg-gold/10 shadow-md !-translate-y-0.5" : "border-border/80 bg-surface/50 hover:bg-surface hover:border-border !-translate-y-0"
        }`}
        style={{ height: `${TILE_HEIGHT}px` }}
        onMouseOver={() => setIsHovering(true)} 
        onMouseOut={() => setIsHovering(false)}
      >
        <CardTileName index={index} isHovering={variant === "editable" ? isHovering : false} />
        {rightSlot && <div className="flex items-center shrink-0">{rightSlot}</div>}
      </div>
    );
  }
);
CardTile.displayName = "CardTile";

// ------------ Read-Only Card Overview ------------ //

interface CardOverviewReadOnlyProps {
  cardCount: number;
  selectedCardIndex: number | null;
  setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
}

export function CardOverviewReadOnly({
  cardCount,
  selectedCardIndex,
  setSelectedCardIndex,
}: CardOverviewReadOnlyProps) {
  const indices = Array.from({ length: cardCount }, (_, i) => i);

  return (
    <div className="flex flex-col gap-1.5 group">
      <div className="flex justify-between items-center px-1">
        <span className="font-display text-sm font-bold tracking-tight">Positions</span>
        <span className="text-[10px] text-muted-foreground/40 italic opacity-0 group-hover:opacity-100 duration-300">Click to view</span>
      </div>
      <div className="relative flex flex-col" style={{ gap: `${TILE_GAP}px` }}>
        {indices.map((index) => (
          <CardTile
            key={index}
            index={index}
            isSelected={index === selectedCardIndex}
            variant="readonly"
            onClick={() => setSelectedCardIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}

// ------------ Editable Card Overview ------------ //

export default function CardOverview({
  cardCount,
  selectedCardIndex,
  setSelectedCardIndex,
  move,
  remove,
  addCard,
  maxCards = 78,
}: CardOverviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const draggablesRef = useRef<Draggable[]>([]);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [moveVersion, setMoveVersion] = useState(0);

  const indices = Array.from({ length: cardCount }, (_, i) => i);

  const cleanupDraggables = useCallback(() => {
    draggablesRef.current.forEach((d) => d.kill());
    draggablesRef.current = [];
  }, []);

  // Runs synchronously after React commits (before browser paint) so tiles are
  // reset to their natural positions at the same time the content updates —
  // preventing the animated "revert" that made drops look like they failed.
  useLayoutEffect(() => {
    if (moveVersion === 0) return;
    const tiles = tileRefs.current.slice(0, cardCount).filter(Boolean) as HTMLDivElement[];
    tiles.forEach((t) => {
      t.style.transition = "none";
      gsap.set(t, { y: 0, zIndex: "", scale: 1 });
    });
    requestAnimationFrame(() => {
      tiles.forEach((t) => { t.style.transition = ""; });
    });
  }, [moveVersion, cardCount]);

  useEffect(() => {
    cleanupDraggables();

    const tiles = tileRefs.current.slice(0, cardCount).filter(Boolean) as HTMLDivElement[];
    if (tiles.length === 0) return;

    const newDraggables: Draggable[] = [];

    tiles.forEach((tile, i) => {
      gsap.set(tile, { y: 0 });

      const [instance] = Draggable.create(tile, {
        type: "y",
        bounds: containerRef.current!,
        cursor: "pointer",
        activeCursor: "grabbing",
        zIndexBoost: true,
        onDragStart() {
          // Disable CSS transition so the tile follows the cursor instantly
          // instead of lagging by the transition duration on every transform update.
          tile.style.transition = "none";
          gsap.set(tile, { zIndex: 50, scale: 1.02 });
        },
        onDrag() {
          const dragY = this.y;
          const fromSlot = i;
          const currentSlot = Math.round(dragY / SLOT_SIZE) + fromSlot;
          const clampedSlot = Math.max(0, Math.min(tiles.length - 1, currentSlot));

          tiles.forEach((otherTile, j) => {
            if (j === i) return;
            let shift = 0;
            if (fromSlot < clampedSlot && j > fromSlot && j <= clampedSlot) {
              shift = -SLOT_SIZE;
            } else if (fromSlot > clampedSlot && j >= clampedSlot && j < fromSlot) {
              shift = SLOT_SIZE;
            }
            gsap.set(otherTile, { y: shift });
          });
        },
        onDragEnd() {
          const dragY = this.y;
          const fromSlot = i;
          const currentSlot = Math.round(dragY / SLOT_SIZE) + fromSlot;
          const toSlot = Math.max(0, Math.min(tiles.length - 1, currentSlot));

          if (fromSlot !== toSlot) {
            // Don't reset transforms here. useLayoutEffect will reset them after
            // React commits the move so the reset is invisible (happens before paint).
            setSelectedCardIndex((prev) => {
              if (prev === null) return null;
              if (prev === fromSlot) return toSlot;
              if (fromSlot < toSlot && prev > fromSlot && prev <= toSlot) return prev - 1;
              if (fromSlot > toSlot && prev >= toSlot && prev < fromSlot) return prev + 1;
              return prev;
            });
            move(fromSlot, toSlot);
            setMoveVersion((v) => v + 1);
          } else {
            // No positional change — reset everything instantly without CSS transitions.
            tiles.forEach((t) => {
              t.style.transition = "none";
              gsap.set(t, { y: 0, zIndex: "", scale: 1 });
            });
            requestAnimationFrame(() => {
              tiles.forEach((t) => { t.style.transition = ""; });
            });
          }
        },
        onClick() {
          setSelectedCardIndex(i);
        },
      });
      newDraggables.push(instance);
    });

    draggablesRef.current = newDraggables;

    return cleanupDraggables;
  }, [cardCount, move, setSelectedCardIndex, cleanupDraggables, moveVersion]);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteIndex === null) return;

    if (selectedCardIndex !== null) {
      if (selectedCardIndex === deleteIndex) {
        setSelectedCardIndex(null);
      } else if (selectedCardIndex > deleteIndex) {
        setSelectedCardIndex(selectedCardIndex - 1);
      }
    }

    remove(deleteIndex);
    setDeleteIndex(null);
  }, [deleteIndex, selectedCardIndex, setSelectedCardIndex, remove]);

  return (
    <div className="flex flex-col gap-1.5 mb-24 group">
      <div className="flex justify-between items-center px-1">
        <span className="font-display text-sm font-bold tracking-tight">Positions</span>
        <span className="text-[10px] text-muted-foreground/40 italic opacity-0 group-hover:opacity-100 duration-300">Drag to reorder</span>
      </div>
      <div
        ref={containerRef}
        className="relative flex flex-col"
        style={{ gap: `${TILE_GAP}px` }}
      >
        {indices.map((index) => (
          <CardTile
            key={index}
            ref={(el) => { tileRefs.current[index] = el; }}
            index={index}
            isSelected={index === selectedCardIndex}
            rightSlot={
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground/40 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteIndex(index);
                }}
              >
                <Delete02Icon />
              </Button>
            }
          />
        ))}
      </div>

      {/* New Position button */}
      <button
        type="button"
        onClick={addCard}
        disabled={cardCount >= maxCards}
        className="flex items-center justify-center rounded-lg border border-dashed border-border/50 text-muted-foreground/50 hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        style={{ height: `${TILE_HEIGHT}px` }}
      >
        <PlusSignIcon className="size-3.5 mr-1.5" />
        <span className="text-sm">Add Position</span>
      </button>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteIndex !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteIndex(null);
        }}
        title={deleteIndex !== null ? `Remove Position ${deleteIndex + 1}?` : ""}
        description="This position will be removed from the spread. This cannot be undone."
        cancelLabel="Keep it"
        confirmLabel="Remove"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

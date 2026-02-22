"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { UseFieldArrayMove, UseFieldArrayRemove } from "react-hook-form";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Delete02Icon, PlusSignIcon } from "hugeicons-react";
import { CardForm } from "@/types/spreads";

gsap.registerPlugin(Draggable);

const TILE_HEIGHT = 38;
const TILE_GAP = 4;
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

function CardTileName({ index }: { index: number }) {
  const { control } = useFormContext<{ positions: CardForm[] }>();
  const name = useWatch({ control, name: `positions.${index}.name` });
  return (
    <span className="truncate text-sm">
      <span className="text-muted-foreground/50 font-medium mr-1.5">{index + 1}.</span>
      {name || <span className="text-muted-foreground/40 italic">Untitled</span>}
    </span>
  );
}

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
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center px-1">
        <span className="font-display text-sm font-bold tracking-tight">Positions</span>
        <span className="text-[10px] text-muted-foreground/40 italic">Click to view</span>
      </div>
      <div className="relative flex flex-col" style={{ gap: `${TILE_GAP}px` }}>
        {indices.map((index) => (
          <div
            key={index}
            onClick={() => setSelectedCardIndex(index)}
            className={`flex items-center rounded-lg border px-3 cursor-pointer select-none transition-all duration-200 ${
              index === selectedCardIndex
                ? "border-gold/40 bg-gold/8 shadow-sm"
                : "border-border/50 bg-surface/50 hover:bg-surface hover:border-border"
            }`}
            style={{ height: `${TILE_HEIGHT}px` }}
          >
            <CardTileName index={index} />
          </div>
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

  const indices = Array.from({ length: cardCount }, (_, i) => i);

  const cleanupDraggables = useCallback(() => {
    draggablesRef.current.forEach((d) => d.kill());
    draggablesRef.current = [];
  }, []);

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

          tiles.forEach((t) => {
            gsap.set(t, { y: 0, zIndex: "", scale: 1 });
          });

          if (fromSlot !== toSlot) {
            setSelectedCardIndex((prev) => {
              if (prev === null) return null;
              if (prev === fromSlot) return toSlot;
              if (fromSlot < toSlot && prev > fromSlot && prev <= toSlot) return prev - 1;
              if (fromSlot > toSlot && prev >= toSlot && prev < fromSlot) return prev + 1;
              return prev;
            });
            move(fromSlot, toSlot);
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
  }, [cardCount, move, setSelectedCardIndex, cleanupDraggables]);

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
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center px-1">
        <span className="font-display text-sm font-bold tracking-tight">Positions</span>
        <span className="text-[10px] text-muted-foreground/40 italic">Drag to reorder</span>
      </div>
      <div
        ref={containerRef}
        className="relative flex flex-col"
        style={{ gap: `${TILE_GAP}px` }}
      >
        {indices.map((index) => (
          <div
            key={index}
            ref={(el) => { tileRefs.current[index] = el; }}
            className={`flex items-center justify-between rounded-lg border px-3 cursor-pointer select-none transition-all duration-200 ${
              index === selectedCardIndex
                ? "border-gold/40 bg-gold/8 shadow-sm"
                : "border-border/50 bg-surface/50 hover:bg-surface hover:border-border"
            }`}
            style={{ height: `${TILE_HEIGHT}px` }}
          >
            <CardTileName index={index} />
            <div className="flex items-center shrink-0">
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground/40 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteIndex(index);
                }}
                disabled={cardCount <= 1}
              >
                <Delete02Icon />
              </Button>
            </div>
          </div>
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
      <Dialog
        open={deleteIndex !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteIndex(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Remove Position {deleteIndex !== null ? deleteIndex + 1 : ""}?</DialogTitle>
            <DialogDescription>
              This position will be removed from the spread. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteIndex(null)}>
              Keep it
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
import { cardData } from "./spread-schema";

gsap.registerPlugin(Draggable);

const TILE_HEIGHT = 36;
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
  const { control } = useFormContext<{ positions: cardData[] }>();
  const name = useWatch({ control, name: `positions.${index}.name` });
  return (
    <span className="truncate text-sm">
      {index + 1}. {name || "Untitled"}
    </span>
  );
}

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

  // Build an array of indices for rendering
  const indices = Array.from({ length: cardCount }, (_, i) => i);

  // Clean up draggable instances
  const cleanupDraggables = useCallback(() => {
    draggablesRef.current.forEach((d) => d.kill());
    draggablesRef.current = [];
  }, []);

  // Initialize GSAP draggables for reorder
  useEffect(() => {
    cleanupDraggables();

    // Slice to cardCount to avoid stale refs from previous renders with more tiles
    const tiles = tileRefs.current.slice(0, cardCount).filter(Boolean) as HTMLDivElement[];
    if (tiles.length === 0) return;

    const newDraggables: Draggable[] = [];

    tiles.forEach((tile, i) => {
      // Reset any leftover transforms
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
          // Determine which slot the tile center is in
          const currentSlot = Math.round(dragY / SLOT_SIZE) + fromSlot;
          const clampedSlot = Math.max(0, Math.min(tiles.length - 1, currentSlot));

          // Instantly shift displaced tiles to avoid animation overlap
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

          // Reset all transforms before calling move
          tiles.forEach((t) => {
            gsap.set(t, { y: 0, zIndex: "", scale: 1 });
          });

          if (fromSlot !== toSlot) {
            // Track the selected card through the reorder using functional updater
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

    // Adjust selectedCardIndex
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
    <div className="flex flex-col gap-1">
      <div
        ref={containerRef}
        className="relative flex flex-col"
        style={{ gap: `${TILE_GAP}px` }}
      >
        {indices.map((index) => (
          <div
            key={index}
            ref={(el) => { tileRefs.current[index] = el; }}
            className={`flex items-center justify-between rounded-md border px-2 cursor-pointer select-none ${
              index === selectedCardIndex
                ? "border-gold bg-gold/10"
                : "border-border bg-muted/50 hover:bg-muted"
            }`}
            style={{ height: `${TILE_HEIGHT}px` }}
          >
            <CardTileName index={index} />
            <div className="flex items-center shrink-0">
              <Button
                variant="ghost"
                size="icon-xs"
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

      {/* New Card button */}
      <button
        type="button"
        onClick={addCard}
        disabled={cardCount >= maxCards}
        className="flex items-center justify-center rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        style={{ height: `${TILE_HEIGHT}px` }}
      >
        <PlusSignIcon className="size-3.5 mr-1" />
        <span className="text-sm">New Card</span>
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
            <DialogTitle>Remove Card {deleteIndex !== null ? deleteIndex + 1 : ""}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteIndex(null)}>
              Cancel
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

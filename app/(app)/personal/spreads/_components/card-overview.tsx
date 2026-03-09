"use client";

import {
  Dispatch,
  forwardRef,
  type ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { UseFieldArrayMove, UseFieldArrayRemove } from "react-hook-form";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "../../../../_components/confirm-dialog";
import { Delete02Icon, DragDropVerticalIcon, PlusSignIcon } from "hugeicons-react";
import { CardForm } from "@/types/spreads";

gsap.registerPlugin(Draggable);

const TILE_HEIGHT = 40;
const TILE_GAP = 6;
const SLOT_SIZE = TILE_HEIGHT + TILE_GAP;
const DRAG_THRESHOLD = 1;

type TileElement = HTMLDivElement;

function remapSelectedIndex(prev: number | null, fromSlot: number, toSlot: number) {
  if (prev === null) return null;
  if (prev === fromSlot) return toSlot;
  if (fromSlot < toSlot && prev > fromSlot && prev <= toSlot) return prev - 1;
  if (fromSlot > toSlot && prev >= toSlot && prev < fromSlot) return prev + 1;
  return prev;
}

function getDropSlot(dragY: number, fromSlot: number, tileCount: number) {
  const rawSlot = Math.round(dragY / SLOT_SIZE) + fromSlot;
  return Math.max(0, Math.min(tileCount - 1, rawSlot));
}

function resetTilesImmediately(tiles: TileElement[]) {
  tiles.forEach((tile) => {
    tile.style.transition = "none";
    gsap.set(tile, { y: 0, zIndex: "", scale: 1 });
  });
}

function restoreTileTransitions(tiles: TileElement[]) {
  requestAnimationFrame(() => {
    tiles.forEach((tile) => {
      tile.style.transition = "";
    });
  });
}

function updateNeighborShifts(tiles: TileElement[], fromSlot: number, toSlot: number) {
  tiles.forEach((tile, index) => {
    if (index === fromSlot) return;

    let shift = 0;
    if (fromSlot < toSlot && index > fromSlot && index <= toSlot) {
      shift = -SLOT_SIZE;
    } else if (fromSlot > toSlot && index >= toSlot && index < fromSlot) {
      shift = SLOT_SIZE;
    }

    gsap.set(tile, { y: shift });
  });
}

interface CardOverviewProps {
  cardIds: string[];
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
  const doubleDigitIndex = index >= 9;

  return (
    <div className={`relative truncate text-sm mx-1 ${doubleDigitIndex ? "pl-6" : "pl-4"}`}>
      <DragDropVerticalIcon
        size={20}
        color="var(--muted-foreground)"
        strokeWidth={2.5}
        className={`absolute ${doubleDigitIndex ? "-left-0.5" : "-left-1.5"} ${isHovering ? "scale-100" : "scale-0"} duration-150`}
      />
      <span className={`absolute left-0 text-muted-foreground/80 font-medium font-mono mr-1.5 ${isHovering ? "scale-0" : "scale-100"} duration-150`}>{index + 1}</span>
      {name || <span className="text-muted-foreground/40 italic">Untitled</span>}
    </div>
  );
}

interface CardTileProps {
  index: number;
  isSelected: boolean;
  variant?: "readonly" | "editable";
  onSelect?: () => void;
  rightSlot?: ReactNode;
}

const CardTile = forwardRef<HTMLDivElement, CardTileProps>(
  ({ index, isSelected, variant = "editable", onSelect, rightSlot }, ref) => {
    const [isHovering, setIsHovering] = useState(false);

    return (
      <div
        ref={ref}
        onClick={onSelect}
        className={`flex items-center justify-between rounded-lg border px-3 cursor-pointer transition-all duration-200 !overflow-visible ${
          isSelected ? "border-gold/80 bg-gold/10 shadow-sm !-translate-y-0.25" : "border-border/80 bg-surface/50 hover:bg-surface hover:border-border !-translate-y-0"
        }`}
        style={{ height: `${TILE_HEIGHT}px` }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
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
  return (
    <div className="flex flex-col gap-1.5 group">
      <div className="flex justify-between items-center px-1">
        <span className="font-display text-sm font-bold tracking-tight">Positions</span>
        <span className="text-[10px] text-muted-foreground/40 italic opacity-0 group-hover:opacity-100 duration-300">Click to view</span>
      </div>
      <div className="relative flex flex-col" style={{ gap: `${TILE_GAP}px` }}>
        {Array.from({ length: cardCount }, (_, index) => (
          <CardTile
            key={index}
            index={index}
            isSelected={index === selectedCardIndex}
            variant="readonly"
            onSelect={() => setSelectedCardIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}

// ------------ Editable Card Overview ------------ //

export default function CardOverview({
  cardIds,
  selectedCardIndex,
  setSelectedCardIndex,
  move,
  remove,
  addCard,
  maxCards = 78,
}: CardOverviewProps) {
  const cardCount = cardIds.length;
  const tileRefs = useRef<(TileElement | null)[]>([]);
  const draggablesRef = useRef<Draggable[]>([]);
  const didReorderRef = useRef(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const cleanupDraggables = useCallback(() => {
    draggablesRef.current.forEach((d) => d.kill());
    draggablesRef.current = [];
  }, []);

  // Runs synchronously after React commits (before browser paint) so tiles are
  // reset to their natural positions at the same time the content updates —
  // preventing the animated "revert" that made drops look like they failed.
  useLayoutEffect(() => {
    if (!didReorderRef.current) return;

    const tiles = tileRefs.current.slice(0, cardCount).filter(Boolean) as TileElement[];
    resetTilesImmediately(tiles);
    restoreTileTransitions(tiles);
    didReorderRef.current = false;
  }, [cardIds, cardCount]);

  useEffect(() => {
    cleanupDraggables();
    tileRefs.current = tileRefs.current.slice(0, cardCount);

    const tiles = tileRefs.current.slice(0, cardCount).filter(Boolean) as TileElement[];
    if (tiles.length === 0) return;

    const newDraggables: Draggable[] = [];

    tiles.forEach((tile, i) => {
      let didDrag = false;

      gsap.set(tile, { y: 0 });

      const [instance] = Draggable.create(tile, {
        type: "y",
        bounds: {
          minY: -i * SLOT_SIZE,
          maxY: (tiles.length - 1 - i) * SLOT_SIZE,
        },
        cursor: "pointer",
        activeCursor: "grabbing",
        zIndexBoost: true,
        onPress() {
          didDrag = false;
        },
        onDragStart() {
          // Disable CSS transition so the tile follows the cursor instantly
          // instead of lagging by the transition duration on every transform update.
          tile.style.transition = "none";
          gsap.set(tile, { zIndex: 50, scale: 1.02 });
        },
        onDrag() {
          if (Math.abs(this.y) > DRAG_THRESHOLD) {
            didDrag = true;
          }

          updateNeighborShifts(tiles, i, getDropSlot(this.y, i, tiles.length));
        },
        onDragEnd() {
          const fromSlot = i;
          const toSlot = getDropSlot(this.y, fromSlot, tiles.length);

          if (fromSlot !== toSlot) {
            setSelectedCardIndex((prev) => remapSelectedIndex(prev, fromSlot, toSlot));
            move(fromSlot, toSlot);
            didReorderRef.current = true;
          } else {
            resetTilesImmediately(tiles);
            restoreTileTransitions(tiles);
          }
        },
        onRelease() {
          if (didDrag) return;
          const currentIndex = tileRefs.current.indexOf(tile);
          if (currentIndex !== -1) {
            setSelectedCardIndex(currentIndex);
          }
        },
      });
      newDraggables.push(instance);
    });

    draggablesRef.current = newDraggables;

    return cleanupDraggables;
  }, [cardCount, cardIds, move, setSelectedCardIndex, cleanupDraggables]);

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
      <div className="relative flex flex-col" style={{ gap: `${TILE_GAP}px` }}>
        {cardIds.map((cardId, index) => (
          <CardTile
            key={cardId}
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

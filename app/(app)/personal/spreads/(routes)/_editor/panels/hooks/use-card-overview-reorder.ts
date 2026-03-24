"use client";

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { UseFieldArrayMove } from "react-hook-form";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

const TILE_HEIGHT = 40;
const TILE_GAP = 6;
const SLOT_SIZE = TILE_HEIGHT + TILE_GAP;
const DRAG_THRESHOLD = 1;

type TileElement = HTMLDivElement;

interface UseCardOverviewReorderArgs {
  cardIds: string[];
  selectedCardIndex: number | null;
  setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
  move: UseFieldArrayMove;
  isMobile?: boolean;
}

// Remap the selected card index after a tile moves to a new slot.
function remapSelectedIndex(prev: number | null, fromSlot: number, toSlot: number) {
  if (prev === null) return null;
  if (prev === fromSlot) return toSlot;
  if (fromSlot < toSlot && prev > fromSlot && prev <= toSlot) return prev - 1;
  if (fromSlot > toSlot && prev >= toSlot && prev < fromSlot) return prev + 1;
  return prev;
}

// Convert the current drag offset into the nearest valid drop slot.
function getDropSlot(dragY: number, fromSlot: number, tileCount: number) {
  const rawSlot = Math.round(dragY / SLOT_SIZE) + fromSlot;
  return Math.max(0, Math.min(tileCount - 1, rawSlot));
}

// Clear all drag transforms so tiles snap back to their natural layout.
function resetTilesImmediately(tiles: TileElement[]) {
  tiles.forEach((tile) => {
    tile.style.transition = "none";
    gsap.set(tile, { y: 0, zIndex: "", scale: 1 });
  });
}

// Re-enable tile transitions after an immediate reset finishes.
function restoreTileTransitions(tiles: TileElement[]) {
  requestAnimationFrame(() => {
    tiles.forEach((tile) => {
      tile.style.transition = "";
    });
  });
}

// Shift surrounding tiles to preview where the dragged tile will land.
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

// Owns the drag/reorder lifecycle for the card overview list, including GSAP
// instance management and selected-card preservation while the DOM reorders.
export function useCardOverviewReorder({
  cardIds,
  selectedCardIndex,
  setSelectedCardIndex,
  move,
  isMobile = false,
}: UseCardOverviewReorderArgs) {
  const cardCount = cardIds.length;
  const tileRefs = useRef<(TileElement | null)[]>([]);
  const handleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const draggablesRef = useRef<Draggable[]>([]);
  const didReorderRef = useRef(false);
  const selectedCardIdRef = useRef<string | null>(null);
  const [selectedCardIdOverride, setSelectedCardIdOverride] = useState<string | null>(null);

  const selectedCardId =
    selectedCardIdOverride ??
    (selectedCardIndex !== null ? cardIds[selectedCardIndex] ?? null : null);

  const registerTileRef = useCallback((index: number, element: TileElement | null) => {
    tileRefs.current[index] = element;
  }, []);

  const registerHandleRef = useCallback((index: number, element: HTMLDivElement | null) => {
    handleRefs.current[index] = element;
  }, []);

  // Tear down existing draggable instances before rebuilding the list.
  const cleanupDraggables = useCallback(() => {
    draggablesRef.current.forEach((draggable) => draggable.kill());
    draggablesRef.current = [];
  }, []);

  // Reset tile transforms immediately after a reorder commits to the DOM.
  useLayoutEffect(() => {
    if (!didReorderRef.current) return;

    const tiles = tileRefs.current.slice(0, cardCount).filter(Boolean) as TileElement[];
    resetTilesImmediately(tiles);
    restoreTileTransitions(tiles);
    didReorderRef.current = false;
  }, [cardCount, cardIds]);

  // Clear the temporary selected-id override once React catches up to the new order.
  useLayoutEffect(() => {
    if (selectedCardIdOverride === null) return;
    if (selectedCardIndex === null) {
      setSelectedCardIdOverride(null);
      return;
    }

    const remappedSelectedCardId = cardIds[selectedCardIndex] ?? null;
    if (remappedSelectedCardId === selectedCardIdOverride) {
      setSelectedCardIdOverride(null);
    }
  }, [cardIds, selectedCardIndex, selectedCardIdOverride]);

  // Track the selected card by id so selection survives list reordering.
  useEffect(() => {
    selectedCardIdRef.current =
      selectedCardIndex !== null ? cardIds[selectedCardIndex] ?? null : null;
  }, [cardIds, selectedCardIndex]);

  // Create draggable tiles and keep click-to-select working when no drag occurs.
  useEffect(() => {
    cleanupDraggables();
    tileRefs.current = tileRefs.current.slice(0, cardCount);
    handleRefs.current = handleRefs.current.slice(0, cardCount);

    const tiles = tileRefs.current.slice(0, cardCount).filter(Boolean) as TileElement[];
    if (tiles.length === 0) return;

    const newDraggables: Draggable[] = [];

    tiles.forEach((tile, index) => {
      let didDrag = false;

      gsap.set(tile, { y: 0 });

      const [instance] = Draggable.create(tile, {
        type: "y",
        trigger: isMobile ? handleRefs.current[index] ?? tile : tile,
        bounds: {
          minY: -index * SLOT_SIZE,
          maxY: (tiles.length - 1 - index) * SLOT_SIZE,
        },
        cursor: "pointer",
        activeCursor: "grabbing",
        zIndexBoost: true,
        onPress() {
          // Reset drag state at the start of each pointer interaction.
          didDrag = false;
        },
        onDragStart() {
          // Disable CSS transition so the tile follows the cursor instantly
          // instead of lagging by the transition duration on every transform update.
          tile.style.transition = "none";
          gsap.set(tile, { zIndex: 50, scale: 1.02 });
        },
        onDrag() {
          // Track real drags and update neighboring tiles as the drop target changes.
          if (Math.abs(this.y) > DRAG_THRESHOLD) {
            didDrag = true;
          }

          updateNeighborShifts(tiles, index, getDropSlot(this.y, index, tiles.length));
        },
        onDragEnd() {
          // Commit the reorder, or restore the tiles if nothing changed.
          const fromSlot = index;
          const toSlot = getDropSlot(this.y, fromSlot, tiles.length);

          if (fromSlot !== toSlot) {
            if (selectedCardIdRef.current !== null) {
              setSelectedCardIdOverride(selectedCardIdRef.current);
            }
            setSelectedCardIndex((prev) => remapSelectedIndex(prev, fromSlot, toSlot));
            move(fromSlot, toSlot);
            didReorderRef.current = true;
          } else {
            resetTilesImmediately(tiles);
            restoreTileTransitions(tiles);
          }
        },
        onRelease() {
          // On mobile, the handle should only reorder. Tapping the card body selects it.
          if (isMobile) return;

          // Treat pointer release as selection when the tile was clicked, not dragged.
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
  }, [cardCount, cardIds, cleanupDraggables, isMobile, move, setSelectedCardIndex]);

  return {
    selectedCardId,
    registerTileRef,
    registerHandleRef,
  };
}

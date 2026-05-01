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

export function useCardOverviewReorder({
  cardIds,
  selectedCardIndex,
  setSelectedCardIndex,
  move,
  isMobile = false,
}: UseCardOverviewReorderArgs) {
  const cardCount = cardIds.length;
  const cardIdsKey = cardIds.join("\u0000");
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

  useLayoutEffect(() => {
    if (!didReorderRef.current) return;

    const tiles = tileRefs.current.slice(0, cardCount).filter(Boolean) as TileElement[];
    resetTilesImmediately(tiles);
    restoreTileTransitions(tiles);
    didReorderRef.current = false;
  }, [cardCount, cardIdsKey]);

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

  useEffect(() => {
    selectedCardIdRef.current =
      selectedCardIndex !== null ? cardIds[selectedCardIndex] ?? null : null;
  }, [cardIds, selectedCardIndex]);

  const cleanupDraggables = useCallback(() => {
    draggablesRef.current.forEach((draggable) => draggable.kill());
    draggablesRef.current = [];
  }, []);

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
          didDrag = false;
        },
        onDragStart() {
          tile.style.transition = "none";
          gsap.set(tile, { zIndex: 50, scale: 1.02 });
        },
        onDrag() {
          if (Math.abs(this.y) > DRAG_THRESHOLD) {
            didDrag = true;
          }

          updateNeighborShifts(tiles, index, getDropSlot(this.y, index, tiles.length));
        },
        onDragEnd() {
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
          if (isMobile) return;
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
  }, [cardCount, cardIdsKey, cleanupDraggables, isMobile, move, setSelectedCardIndex]);

  return {
    selectedCardId,
    registerTileRef,
    registerHandleRef,
  };
}

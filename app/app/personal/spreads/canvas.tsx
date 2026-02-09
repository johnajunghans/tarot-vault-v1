"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SpreadCard, { type CardPosition } from "./card";

const CANVAS_SIZE = 1500;
const GRID_SIZE = 15;
const CARD_WIDTH = 90;
const CARD_HEIGHT = 150;

interface SpreadCanvasProps {
  cards: CardPosition[];
  onPositionChange: (position: number, x: number, y: number) => void;
  selectedCardPosition: number | null;
  onCardSelect: (position: number | null) => void;
}

export default function SpreadCanvas({
  cards,
  onPositionChange,
  selectedCardPosition,
  onCardSelect,
}: SpreadCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track which card is being dragged and its live position
  const [dragging, setDragging] = useState<{
    position: number;
    x: number;
    y: number;
  } | null>(null);

  // Spacebar panning refs (no re-renders needed)
  const isSpaceHeld = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, scrollX: 0, scrollY: 0 });

  // Sort cards by zIndex for correct SVG render order (higher zIndex renders on top)
  const sortedCards = useMemo(
    () => [...cards].sort((a, b) => a.zIndex - b.zIndex),
    [cards]
  );

  // === Alignment guides ===
  const guides = useMemo(() => {
    if (!dragging) return [];

    const draggedEdges = {
      left: dragging.x,
      right: dragging.x + CARD_WIDTH,
      top: dragging.y,
      bottom: dragging.y + CARD_HEIGHT,
    };

    const lines: { axis: "v" | "h"; pos: number }[] = [];

    for (const card of cards) {
      if (card.position === dragging.position) continue;

      const otherEdges = {
        left: card.x,
        right: card.x + CARD_WIDTH,
        top: card.y,
        bottom: card.y + CARD_HEIGHT,
      };

      // Vertical guides (matching left/right edges)
      for (const de of [draggedEdges.left, draggedEdges.right]) {
        for (const oe of [otherEdges.left, otherEdges.right]) {
          if (de === oe) {
            lines.push({ axis: "v", pos: de });
          }
        }
      }

      // Horizontal guides (matching top/bottom edges)
      for (const de of [draggedEdges.top, draggedEdges.bottom]) {
        for (const oe of [otherEdges.top, otherEdges.bottom]) {
          if (de === oe) {
            lines.push({ axis: "h", pos: de });
          }
        }
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    return lines.filter((l) => {
      const key = `${l.axis}-${l.pos}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [dragging, cards]);

  // === Card drag callbacks ===
  const handleDragStart = useCallback(
    (position: number) => {
      const card = cards.find((c) => c.position === position);
      if (card) {
        setDragging({ position, x: card.x, y: card.y });
      }
    },
    [cards]
  );

  const handleDrag = useCallback((position: number, x: number, y: number) => {
    setDragging({ position, x, y });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
  }, []);

  // === Spacebar panning ===
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      isSpaceHeld.current = true;
      container.style.cursor = "grab";
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      isSpaceHeld.current = false;
      isPanning.current = false;
      container.style.cursor = "";
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!isSpaceHeld.current) return;
      isPanning.current = true;
      container.style.cursor = "grabbing";
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        scrollX: container.scrollLeft,
        scrollY: container.scrollTop,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      container.scrollLeft = panStart.current.scrollX - dx;
      container.scrollTop = panStart.current.scrollY - dy;
    };

    const handleMouseUp = () => {
      if (!isPanning.current) return;
      isPanning.current = false;
      container.style.cursor = isSpaceHeld.current ? "grab" : "";
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full overflow-auto">
      <svg
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Grid pattern */}
        <defs>
          <pattern
            id="canvas-grid"
            width={GRID_SIZE}
            height={GRID_SIZE}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
              fill="none"
              stroke="var(--border)"
              strokeOpacity={0.6}
              strokeWidth={0.5}
            />
          </pattern>
        </defs>
        <rect
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          fill="url(#canvas-grid)"
          onClick={() => onCardSelect(null)}
        />

        {/* Alignment guide lines */}
        {guides.map((guide) =>
          guide.axis === "v" ? (
            <line
              key={`v-${guide.pos}`}
              x1={guide.pos}
              y1={0}
              x2={guide.pos}
              y2={CANVAS_SIZE}
              stroke="var(--gold)"
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          ) : (
            <line
              key={`h-${guide.pos}`}
              x1={0}
              y1={guide.pos}
              x2={CANVAS_SIZE}
              y2={guide.pos}
              stroke="var(--gold)"
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          )
        )}

        {/* Draggable cards — sorted by zIndex for correct layering */}
        {sortedCards.map((card) => (
          <SpreadCard
            key={card.position}
            card={card}
            selected={card.position === selectedCardPosition}
            onPositionChange={onPositionChange}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrag={handleDrag}
            onClick={onCardSelect}
          />
        ))}
      </svg>
    </div>
  );
}

"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SpreadCard, { CARD_WIDTH, CARD_HEIGHT, type CanvasCard } from "./card";
import { cardData } from "./spread-schema";

const CANVAS_SIZE = 1500;
const GRID_SIZE = 15;
const BOUNDS = { minX: 0, minY: 0, maxX: 1410, maxY: 1350 };

interface SpreadCanvasProps {
  cards: CanvasCard[];
  selectedCardIndex: number | null;
  onCardSelect: (index: number | null) => void;
}

export default function SpreadCanvas({
  cards,
  selectedCardIndex,
  onCardSelect,
}: SpreadCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { control, setValue } = useFormContext<{ positions: cardData[] }>();
  const positions = useWatch({ control, name: "positions" });

  // Ref for accessing current positions in stable callbacks (avoids stale closures)
  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  // Track which card is being dragged and its live position
  const [dragging, setDragging] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);

  // Group selection state
  const [groupSelectedIndices, setGroupSelectedIndices] = useState<Set<number>>(new Set());
  const groupSelectedRef = useRef<Set<number>>(new Set());

  // Marquee state
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const isMarqueeActive = useRef(false);
  const marqueeStart = useRef({ x: 0, y: 0 });

  // Card element registry for group drag
  const cardGroupRefs = useRef<Map<number, SVGGElement>>(new Map());

  // Group drag origins (start positions for delta calculation)
  const groupDragOrigins = useRef<Map<number, { x: number; y: number }>>(new Map());

  // Spacebar panning refs (no re-renders needed)
  const isSpaceHeld = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, scrollX: 0, scrollY: 0 });

  // Helper: update group selection (state + ref together)
  const updateGroupSelection = useCallback((next: Set<number>) => {
    groupSelectedRef.current = next;
    setGroupSelectedIndices(next);
  }, []);

  // Helper: convert client mouse coords to SVG coords
  const clientToSVG = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: clientX, y: clientY };
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: clientX, y: clientY };
    const inv = ctm.inverse();
    return {
      x: clientX * inv.a + clientY * inv.c + inv.e,
      y: clientX * inv.b + clientY * inv.d + inv.f,
    };
  }, []);

  // Register card ref callback (passed to each SpreadCard)
  const registerCardRef = useCallback((index: number, el: SVGGElement | null) => {
    if (el) {
      cardGroupRefs.current.set(index, el);
    } else {
      cardGroupRefs.current.delete(index);
    }
  }, []);

  // Sort cards by zIndex for correct SVG render order (higher zIndex renders on top).
  // Preserve original index so callbacks and selection use the right card.
  const sortedCards = useMemo(
    () =>
      cards
        .map((card, index) => ({ card, index }))
        .sort((a, b) => a.card.z - b.card.z),
    [cards]
  );

  // === Alignment guides ===
  const guides = useMemo(() => {
    if (!dragging) return [];

    // Suppress guide lines during group movement
    if (
      groupSelectedIndices.size > 1 &&
      groupSelectedIndices.has(dragging.index)
    )
      return [];

    const draggedEdges = {
      left: dragging.x,
      right: dragging.x + CARD_WIDTH,
      top: dragging.y,
      bottom: dragging.y + CARD_HEIGHT,
    };

    const lines: { axis: "v" | "h"; pos: number }[] = [];

    positions.forEach((pos, i) => {
      if (i === dragging.index) return;

      const otherEdges = {
        left: pos.x,
        right: pos.x + CARD_WIDTH,
        top: pos.y,
        bottom: pos.y + CARD_HEIGHT,
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
    });

    // Deduplicate
    const seen = new Set<string>();
    return lines.filter((l) => {
      const key = `${l.axis}-${l.pos}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [dragging, positions, groupSelectedIndices]);

  // Ref to store the dragged card's start position (for group drag delta)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  // Ref to mirror latest dragging state for use in handleDragEnd (avoids stale closure)
  const draggingRef = useRef<{ index: number; x: number; y: number } | null>(null);

  // === Card drag callbacks ===
  const handleDragStart = useCallback(
    (index: number, x: number, y: number) => {
      setDragging({ index, x, y });
      draggingRef.current = { index, x, y };

      // Use form-state position as the drag origin so the delta is measured
      // from the card's true rest position (GSAP may have already shifted the card slightly by the time onDragStart fires).
      const formPos = positionsRef.current[index];
      dragStartPos.current = formPos
        ? { x: formPos.x, y: formPos.y }
        : { x, y };

      // If dragged card is group-selected, record origins for all group members
      if (groupSelectedRef.current.has(index)) {
        const origins = new Map<number, { x: number; y: number }>();
        for (const i of groupSelectedRef.current) {
          if (i === index) continue; // dragged card handled by its own Draggable
          const pos = positionsRef.current[i];
          if (pos) {
            origins.set(i, { x: pos.x, y: pos.y });
          }
        }
        groupDragOrigins.current = origins;
      }
    },
    []
  );

  const handleDrag = useCallback((index: number, x: number, y: number) => {
    setDragging({ index, x, y });
    draggingRef.current = { index, x, y };

    // Group drag: apply delta to siblings
    if (groupDragOrigins.current.size > 0 && dragStartPos.current) {
      const dx = x - dragStartPos.current.x;
      const dy = y - dragStartPos.current.y;

      for (const [i, origin] of groupDragOrigins.current) {
        const el = cardGroupRefs.current.get(i);
        if (!el) continue;

        // Snap and clamp the sibling position
        const rawX = origin.x + dx;
        const rawY = origin.y + dy;
        const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
        const snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;
        const clampedX = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, snappedX));
        const clampedY = Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, snappedY));

        // Move sibling visually without updating form (avoids per-pixel re-renders)
        el.transform.baseVal.getItem(0).setTranslate(clampedX, clampedY);
      }
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    // Commit sibling positions to form state
    if (groupDragOrigins.current.size > 0 && dragStartPos.current) {
      const current = draggingRef.current;
      if (current) {
        const dx = current.x - dragStartPos.current.x;
        const dy = current.y - dragStartPos.current.y;

        for (const [i, origin] of groupDragOrigins.current) {
          const rawX = origin.x + dx;
          const rawY = origin.y + dy;
          const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
          const snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;
          const clampedX = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, snappedX));
          const clampedY = Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, snappedY));

          setValue(`positions.${i}.x`, clampedX, { shouldDirty: true });
          setValue(`positions.${i}.y`, clampedY, { shouldDirty: true });
        }
      }
    }

    groupDragOrigins.current = new Map();
    dragStartPos.current = null;
    draggingRef.current = null;
    setDragging(null);
  }, [setValue]);

  // === Marquee effect ===
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMarqueeActive.current) return;
      const pt = clientToSVG(e.clientX, e.clientY);
      setMarquee((prev) =>
        prev ? { ...prev, currentX: pt.x, currentY: pt.y } : null
      );
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isMarqueeActive.current) return;
      isMarqueeActive.current = false;

      const endPt = clientToSVG(e.clientX, e.clientY);
      const dx = endPt.x - marqueeStart.current.x;
      const dy = endPt.y - marqueeStart.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        // Tiny drag = click on empty canvas → deselect all
        updateGroupSelection(new Set());
        onCardSelect(null);
      } else {
        // Compute AABB of marquee
        const left = Math.min(marqueeStart.current.x, endPt.x);
        const right = Math.max(marqueeStart.current.x, endPt.x);
        const top = Math.min(marqueeStart.current.y, endPt.y);
        const bottom = Math.max(marqueeStart.current.y, endPt.y);

        // Find cards that intersect the marquee
        const selected = new Set<number>();
        positions.forEach((pos, i) => {
          const cardLeft = pos.x;
          const cardRight = pos.x + CARD_WIDTH;
          const cardTop = pos.y;
          const cardBottom = pos.y + CARD_HEIGHT;

          // AABB intersection test
          if (
            cardRight > left &&
            cardLeft < right &&
            cardBottom > top &&
            cardTop < bottom
          ) {
            selected.add(i);
          }
        });

        updateGroupSelection(selected);
      }

      setMarquee(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [clientToSVG, positions, updateGroupSelection, onCardSelect]);

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

  // Background mousedown: start marquee (if not panning)
  const handleBackgroundMouseDown = useCallback(
    (e: React.MouseEvent<SVGRectElement>) => {
      if (isSpaceHeld.current) return; // panning takes priority
      const pt = clientToSVG(e.clientX, e.clientY);
      isMarqueeActive.current = true;
      marqueeStart.current = { x: pt.x, y: pt.y };
      setMarquee({ startX: pt.x, startY: pt.y, currentX: pt.x, currentY: pt.y });
    },
    [clientToSVG]
  );

  // Compute marquee rect for rendering
  const marqueeRect = useMemo(() => {
    if (!marquee) return null;
    return {
      x: Math.min(marquee.startX, marquee.currentX),
      y: Math.min(marquee.startY, marquee.currentY),
      width: Math.abs(marquee.currentX - marquee.startX),
      height: Math.abs(marquee.currentY - marquee.startY),
    };
  }, [marquee]);

  return (
    <div ref={containerRef} className="h-full w-full overflow-auto">
      <svg
        ref={svgRef}
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
          onMouseDown={handleBackgroundMouseDown}
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
        {sortedCards.map(({ card, index }) => {
          // Check if this card is part of a group currently being dragged
          const isDraggingInGroup =
            dragging !== null &&
            groupSelectedIndices.size > 1 &&
            groupSelectedIndices.has(dragging.index) &&
            groupSelectedIndices.has(index);

          return (
            <SpreadCard
              key={String(index)}
              card={card}
              index={index}
              selected={index === selectedCardIndex}
              groupSelected={groupSelectedIndices.has(index)}
              isDraggingInGroup={isDraggingInGroup}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrag={handleDrag}
              onClick={onCardSelect}
              registerRef={registerCardRef}
            />
          );
        })}

        {/* Marquee selection rectangle */}
        {marqueeRect && (
          <rect
            x={marqueeRect.x}
            y={marqueeRect.y}
            width={marqueeRect.width}
            height={marqueeRect.height}
            fill="var(--gold)"
            fillOpacity={0.1}
            stroke="var(--gold)"
            strokeOpacity={0.4}
            strokeWidth={1}
            pointerEvents="none"
          />
        )}
      </svg>
    </div>
  );
}

"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SpreadCard, { CARD_WIDTH, CARD_HEIGHT, type CanvasCard } from "./card";
import { CardForm } from "@/types/spreads";
import { useTheme } from "next-themes";

const CANVAS_SIZE = 1500;
const GRID_SIZE = 15;
const BOUNDS = { minX: 0, minY: 0, maxX: 1410, maxY: 1350 };

interface SpreadCanvasProps {
  cards: CanvasCard[];
  selectedCardIndex: number | null;
  onCardSelect: (index: number | null) => void;
  onCanvasDoubleClick?: (x: number, y: number) => void;
  isViewMode?: boolean;
}

/** SVG canvas for arranging spread positions. Supports drag, marquee select, spacebar pan, alignment guides, and grid snapping. */
export default function SpreadCanvas({
  cards,
  selectedCardIndex,
  onCardSelect,
  onCanvasDoubleClick,
  isViewMode = false,
}: SpreadCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { control, setValue } = useFormContext<{ positions: CardForm[] }>();
  const positions = useWatch({ control, name: "positions" });

  const [svgWidth, setSvgWidth] = useState(CANVAS_SIZE);
  const [svgHeight, setSvgHeight] = useState(CANVAS_SIZE);

  const { resolvedTheme } = useTheme();

  const themeBasedStyles = useMemo(
    () => ({
      containerBg: "bg-[var(--canvas-bg)]",
      stoneTextureFillOpacity: resolvedTheme === "dark" ? "0.8" : "0.6",
      dragGridFill: resolvedTheme === "dark" ? "var(--gold)" : "var(--foreground)",
      dragGridFillOpacity: resolvedTheme === "dark" ? "0.3" : "0.7",
      ghostCardStrokeOpacity: resolvedTheme === "dark" ? "0.4" : "0.8",
    }),
    [resolvedTheme]
  );

  /** Keep SVG at least CANVAS_SIZE; grow with container for responsive layout. */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSvgWidth(Math.max(CANVAS_SIZE, entry.contentRect.width));
        setSvgHeight(Math.max(CANVAS_SIZE, entry.contentRect.height));
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  const [dragging, setDragging] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);

  const [groupSelectedIndices, setGroupSelectedIndices] = useState<Set<number>>(new Set());
  const groupSelectedRef = useRef<Set<number>>(new Set());

  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const isMarqueeActive = useRef(false);
  const marqueeStart = useRef({ x: 0, y: 0 });

  const cardGroupRefs = useRef<Map<number, SVGGElement>>(new Map());
  const groupDragOrigins = useRef<Map<number, { x: number; y: number }>>(new Map());

  const isSpaceHeld = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, scrollX: 0, scrollY: 0 });

  /** Sync group selection state and ref so callbacks see current value. */
  const updateGroupSelection = useCallback((next: Set<number>) => {
    groupSelectedRef.current = next;
    setGroupSelectedIndices(next);
  }, []);

  /** Map viewport (client) coords to SVG coords using getScreenCTM inverse. */
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

  /** Register/unregister card group DOM refs for group-drag transforms. */
  const registerCardRef = useCallback((index: number, el: SVGGElement | null) => {
    if (el) {
      cardGroupRefs.current.set(index, el);
    } else {
      cardGroupRefs.current.delete(index);
    }
  }, []);

  /** Cards ordered by z-index for correct stacking. */
  const sortedCards = useMemo(
    () =>
      cards
        .map((card, index) => ({ card, index }))
        .sort((a, b) => a.card.z - b.card.z),
    [cards]
  );

  /** Vertical/horizontal alignment lines when a single card’s edge matches another. Hidden in view mode or during group drag. */
  const guides = useMemo(() => {
    if (isViewMode || !dragging) return [];

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

      for (const de of [draggedEdges.left, draggedEdges.right]) {
        for (const oe of [otherEdges.left, otherEdges.right]) {
          if (de === oe) {
            lines.push({ axis: "v", pos: de });
          }
        }
      }

      for (const de of [draggedEdges.top, draggedEdges.bottom]) {
        for (const oe of [otherEdges.top, otherEdges.bottom]) {
          if (de === oe) {
            lines.push({ axis: "h", pos: de });
          }
        }
      }
    });

    const seen = new Set<string>();
    return lines.filter((l) => {
      const key = `${l.axis}-${l.pos}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [isViewMode, dragging, positions, groupSelectedIndices]);

  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef<{ index: number; x: number; y: number } | null>(null);

  /** Start drag: set dragging state, store origin for delta, and capture group origins if dragging a selected group. */
  const handleDragStart = useCallback(
    (index: number, x: number, y: number) => {
      setDragging({ index, x, y });
      draggingRef.current = { index, x, y };

      const formPos = positionsRef.current[index];
      dragStartPos.current = formPos
        ? { x: formPos.x, y: formPos.y }
        : { x, y };

      if (groupSelectedRef.current.has(index)) {
        const origins = new Map<number, { x: number; y: number }>();
        for (const i of groupSelectedRef.current) {
          if (i === index) continue;
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

  /** During drag: update position; if group-dragging, apply delta to all group cards with grid snap and bounds clamp. */
  const handleDrag = useCallback((index: number, x: number, y: number) => {
    setDragging({ index, x, y });
    draggingRef.current = { index, x, y };

    if (groupDragOrigins.current.size > 0 && dragStartPos.current) {
      const dx = x - dragStartPos.current.x;
      const dy = y - dragStartPos.current.y;

      for (const [i, origin] of groupDragOrigins.current) {
        const el = cardGroupRefs.current.get(i);
        if (!el) continue;

        const rawX = origin.x + dx;
        const rawY = origin.y + dy;
        const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
        const snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;
        const clampedX = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, snappedX));
        const clampedY = Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, snappedY));

        el.transform.baseVal.getItem(0).setTranslate(clampedX, clampedY);
      }
    }
  }, []);

  /** End drag: persist group positions to form via setValue, then clear drag state. */
  const handleDragEnd = useCallback(() => {
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

  /** Marquee: track mouse move for rect; on mouseup, select cards intersecting rect or clear selection if drag < 5px. */
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
        updateGroupSelection(new Set());
        onCardSelect(null);
      } else {
        const left = Math.min(marqueeStart.current.x, endPt.x);
        const right = Math.max(marqueeStart.current.x, endPt.x);
        const top = Math.min(marqueeStart.current.y, endPt.y);
        const bottom = Math.max(marqueeStart.current.y, endPt.y);

        const selected = new Set<number>();
        positions.forEach((pos, i) => {
          const cardLeft = pos.x;
          const cardRight = pos.x + CARD_WIDTH;
          const cardTop = pos.y;
          const cardBottom = pos.y + CARD_HEIGHT;

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

  /** Spacebar pan: hold Space + drag to scroll the canvas container. Ignore Space when focus is in input/textarea/select. */
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

  /** Start marquee selection on background click (unless Space is held for pan). */
  const handleBackgroundMouseDown = useCallback(
    (e: React.MouseEvent<SVGRectElement>) => {
      if (isSpaceHeld.current) return;
      const pt = clientToSVG(e.clientX, e.clientY);
      isMarqueeActive.current = true;
      marqueeStart.current = { x: pt.x, y: pt.y };
      setMarquee({ startX: pt.x, startY: pt.y, currentX: pt.x, currentY: pt.y });
    },
    [clientToSVG]
  );

  /** Add a new position at double-click coords: snap to grid, clamp to bounds, center card on click. */
  const handleBackgroundDoubleClick = useCallback(
    (e: React.MouseEvent<SVGRectElement>) => {
      if (isViewMode || !onCanvasDoubleClick) return;
      const pt = clientToSVG(e.clientX, e.clientY);
      const snappedX = Math.round(pt.x / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(pt.y / GRID_SIZE) * GRID_SIZE;
      const clampedX = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, snappedX - CARD_WIDTH / 2));
      const clampedY = Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, snappedY - CARD_HEIGHT / 2));
      const finalX = Math.round(clampedX / GRID_SIZE) * GRID_SIZE;
      const finalY = Math.round(clampedY / GRID_SIZE) * GRID_SIZE;
      onCanvasDoubleClick(finalX, finalY);
    },
    [isViewMode, onCanvasDoubleClick, clientToSVG]
  );

  /** Single card click: clear group selection and select this card. */
  const handleCardClick = useCallback((index: number) => {
    updateGroupSelection(new Set());
    onCardSelect(index);
  }, [onCardSelect, updateGroupSelection]);

  /** Bounding rect for marquee overlay from start/current coords. */
  const marqueeRect = useMemo(() => {
    if (!marquee) return null;
    return {
      x: Math.min(marquee.startX, marquee.currentX),
      y: Math.min(marquee.startY, marquee.currentY),
      width: Math.abs(marquee.currentX - marquee.startX),
      height: Math.abs(marquee.currentY - marquee.startY),
    };
  }, [marquee]);

  // const isDragging = dragging !== null;
  const showEmptyPrompt = !isViewMode && cards.length === 0;

  return (
    <div ref={containerRef} className={`h-full w-full overflow-auto ${themeBasedStyles.containerBg}`}>
      <svg
        ref={svgRef}
        width={svgWidth}
        height={svgHeight}
        xmlns="http://www.w3.org/2000/svg"
        className="select-none"
      >
        <defs>
          {/* Stone texture pattern */}
          <pattern id="stone-texture" width="120" height="120" patternUnits="userSpaceOnUse">
            {/* <rect width="120" height="120" fill="var(--canvas-bg)" fillOpacity={themeBasedStyles.stoneTextureFillOpacity} /> */}
            {/* Stone grain lines */}
            {/* <line x1="0" y1="30" x2="120" y2="35" stroke="var(--canvas-stone)" strokeWidth="0.5" strokeOpacity="0.3" />
            <line x1="0" y1="70" x2="80" y2="72" stroke="var(--canvas-stone)" strokeWidth="0.3" strokeOpacity="0.2" />
            <line x1="40" y1="0" x2="42" y2="120" stroke="var(--canvas-stone)" strokeWidth="0.3" strokeOpacity="0.15" />
            <line x1="90" y1="0" x2="95" y2="90" stroke="var(--canvas-stone)" strokeWidth="0.4" strokeOpacity="0.2" /> */}
            {/* Faint gold vein fragment */}
            {/* <line x1="60" y1="50" x2="85" y2="48" stroke="var(--canvas-vein)" strokeWidth="0.5" strokeOpacity="0.12" /> */}
          </pattern>

          {/* Subtle dot grid only visible during drag */}
          <pattern id="drag-grid" width={GRID_SIZE * 2} height={GRID_SIZE * 2} patternUnits="userSpaceOnUse">
            <circle cx={GRID_SIZE} cy={GRID_SIZE} r={0.6} fill={themeBasedStyles.dragGridFill} fillOpacity={themeBasedStyles.dragGridFillOpacity} />
          </pattern>

          {/* Atmospheric vignette — faint light from above */}
          <radialGradient id="canvas-vignette" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.02" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Layer 1: Stone texture base */}
        <rect
          width={svgWidth}
          height={svgHeight}
          fill="url(#stone-texture)"
        />

        {/* Layer 2: Ambient center warmth */}
        <rect
          width={svgWidth}
          height={svgHeight}
          fill="url(#canvas-vignette)"
        />

        {/* Layer 3: Grid dots (only visible while dragging) */}
        {
          // isDragging && 
          !isViewMode && (
          <rect
            width={svgWidth}
            height={svgHeight}
            fill="url(#drag-grid)"
            style={{
              opacity: 1,
              transition: "opacity 200ms ease",
            }}
            pointerEvents="none"
          />
        )}

        {/* Layer 4: Interaction target (transparent, catches all mouse events) */}
        <rect
          width={svgWidth}
          height={svgHeight}
          fill="transparent"
          onMouseDown={isViewMode ? () => onCardSelect(null) : handleBackgroundMouseDown}
          onDoubleClick={handleBackgroundDoubleClick}
        />

        {/* Empty canvas prompt */}
        {showEmptyPrompt && (
          <g pointerEvents="none">
            {/* Ghost card outline */}
            <rect
              x={svgWidth / 2 - CARD_WIDTH / 2}
              y={15}
              width={CARD_WIDTH}
              height={CARD_HEIGHT}
              rx={8}
              fill="none"
              stroke="var(--gold)"
              strokeWidth={1}
              strokeOpacity={themeBasedStyles.ghostCardStrokeOpacity}
              strokeDasharray="6 4"
              className="animate-gentle-pulse"
            />
            {/* Prompt text */}
            <text
              x={svgWidth / 2}
              y={CARD_HEIGHT + 40}
              textAnchor="middle"
              fontSize={13}
              fill="var(--muted-foreground)"
              fillOpacity={0.6}
              fontFamily="var(--font-nunito), sans-serif"
            >
              Double-click to place your first position
            </text>
          </g>
        )}

        {/* Alignment guide lines */}
        {guides.map((guide) =>
          guide.axis === "v" ? (
            <line
              key={`v-${guide.pos}`}
              x1={guide.pos} y1={0}
              x2={guide.pos} y2={svgHeight}
              stroke="var(--gold)"
              strokeOpacity={0.35}
              strokeWidth={0.75}
              strokeDasharray="4 4"
              pointerEvents="none"
            />
          ) : (
            <line
              key={`h-${guide.pos}`}
              x1={0} y1={guide.pos}
              x2={svgWidth} y2={guide.pos}
              stroke="var(--gold)"
              strokeOpacity={0.35}
              strokeWidth={0.75}
              strokeDasharray="4 4"
              pointerEvents="none"
            />
          )
        )}

        {/* Cards — sorted by zIndex for correct layering */}
        {sortedCards.map(({ card, index }) => {
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
              groupSelected={isViewMode ? false : groupSelectedIndices.has(index)}
              isDraggingInGroup={isViewMode ? false : isDraggingInGroup}
              isViewMode={isViewMode}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrag={handleDrag}
              onClick={handleCardClick}
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
            fillOpacity={0.08}
            stroke="var(--gold)"
            strokeOpacity={0.3}
            strokeWidth={1}
            strokeDasharray="4 3"
            pointerEvents="none"
          />
        )}
      </svg>
    </div>
  );
}

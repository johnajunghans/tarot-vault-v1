"use client";

import { useFormContext } from "react-hook-form";
import { memo, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

// Card dimensions
const CARD_WIDTH = 90;
const CARD_HEIGHT = 150;
const STROKE_WIDTH = 2;
const GRID_SIZE = 15;

// Bounds: keep cards within 1500x1500 canvas, snapped to multiples of 15
const BOUNDS = { minX: 0, minY: 0, maxX: 1410, maxY: 1350 };

/** Card data for canvas (no position field; index is used instead). */
export interface CanvasCard {
  name: string;
  description?: string;
  allowReverse?: boolean;
  x: number;
  y: number;
  r: number;
  z: number;
}

interface SpreadCardProps {
  card: CanvasCard;
  index: number;
  selected: boolean;
  onPositionChange: (index: number, x: number, y: number) => void;
  onDragStart: (index: number, x: number, y: number) => void;
  onDragEnd: (index: number) => void;
  onDrag: (index: number, x: number, y: number) => void;
  onClick: (index: number) => void;
}

// === Component ===

function SpreadCard({
  card,
  index,
  selected,
  onPositionChange,
  onDragStart,
  onDragEnd,
  onDrag,
  onClick,
}: SpreadCardProps) {
  const form = useFormContext<{ positions: Array<{ name: string }> }>();
  const groupRef = useRef<SVGGElement>(null);
  const draggableRef = useRef<Draggable | null>(null);
  const isDraggingRef = useRef(false);
  const wasDraggedRef = useRef(false);
  const initialPos = useRef({ x: card.x, y: card.y });

  // Subscribe to this card's name so the label updates when the form field changes
  const [displayName, setDisplayName] = useState(card.name);
  useEffect(() => {
    setDisplayName(card.name);
  }, [card.name]);
  useEffect(() => {
    return form.subscribe({
      name: [`positions.${index}.name`],
      formState: { values: true },
      callback: ({ values }) => {
        const name = values?.positions?.[index]?.name ?? "";
        setDisplayName(name);
      },
    });
  }, [form, index]);

  // Initialize GSAP Draggable
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    // Set initial position from ref (avoids re-init on position changes)
    gsap.set(group, { x: initialPos.current.x, y: initialPos.current.y });

    const [instance] = Draggable.create(group, {
      type: "x,y",
      liveSnap: {
        x: (value) => {
          const snapped = Math.round(value / GRID_SIZE) * GRID_SIZE;
          return Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, snapped));
        },
        y: (value) => {
          const snapped = Math.round(value / GRID_SIZE) * GRID_SIZE;
          return Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, snapped));
        },
      },
      onDragStart: function () {
        isDraggingRef.current = true;
        onDragStart(index, this.x, this.y);
        gsap.to(group, { opacity: 0.7, duration: 0.15 });
      },
      onDrag: function () {
        wasDraggedRef.current = true;
        onDrag(index, this.x, this.y);
      },
      onDragEnd: function () {
        isDraggingRef.current = false;
        onDragEnd(index);
        gsap.to(group, { opacity: 1, duration: 0.15 });
        onPositionChange(index, this.x, this.y);
      },
      cursor: "grab",
      activeCursor: "grabbing",
    });

    draggableRef.current = instance;

    return () => {
      instance.kill();
    };
  }, [index, onPositionChange, onDragStart, onDragEnd, onDrag]);

  // Sync position from props when not dragging
  useEffect(() => {
    if (groupRef.current && draggableRef.current && !isDraggingRef.current) {
      gsap.set(groupRef.current, { x: card.x, y: card.y });
      draggableRef.current.update();
    }
  }, [card.x, card.y]);

  const handleMouseDown = () => {
    wasDraggedRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!wasDraggedRef.current) {
      e.stopPropagation();
      onClick(index);
    }
  };

  return (
    <g
      ref={groupRef}
      style={{ cursor: "grab" }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Inner rotation wrapper — separate from GSAP's x/y transform on outer <g> */}
      <g transform={`rotate(${card.r}, ${CARD_WIDTH / 2}, ${CARD_HEIGHT / 2})`}>
        {/* Card background — inset by 1px so stroke centers on edge,
            making total visual footprint exactly 90x150 */}
        <rect
          x={1}
          y={1}
          width={CARD_WIDTH - STROKE_WIDTH}
          height={CARD_HEIGHT - STROKE_WIDTH}
          rx={6}
          fill="var(--gold)"
          fillOpacity={0.25}
          stroke={selected ? "var(--gold)" : "var(--gold-muted)"}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={selected ? undefined : "4 3"}
        />

        {/* Index badge (top-left, 1-based display) */}
        <circle cx={15} cy={15} r={10} fill={selected ? "var(--gold)" : "var(--gold-muted)"} />
        <text
          x={15}
          y={19}
          textAnchor="middle"
          fontSize={11}
          fontWeight="bold"
          fill="var(--background)"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {index + 1}
        </text>

        {/* Card name (center) — from form subscription so it updates immediately */}
        <text
          x={CARD_WIDTH / 2}
          y={CARD_HEIGHT / 2 + 4}
          textAnchor="middle"
          fontSize={11}
          fill="var(--foreground)"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {displayName}
        </text>
      </g>
    </g>
  );
}

// === Memoization ===

function arePropsEqual(prev: SpreadCardProps, next: SpreadCardProps): boolean {
  return (
    prev.card === next.card &&
    prev.index === next.index &&
    prev.selected === next.selected &&
    prev.onPositionChange === next.onPositionChange &&
    prev.onDragStart === next.onDragStart &&
    prev.onDragEnd === next.onDragEnd &&
    prev.onDrag === next.onDrag &&
    prev.onClick === next.onClick
  );
}

export default memo(SpreadCard, arePropsEqual);

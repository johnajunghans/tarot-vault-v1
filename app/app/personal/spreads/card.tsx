"use client";

import { useFormContext } from "react-hook-form";
import { memo, RefObject, useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { useGSAP } from '@gsap/react'
import { Edit01Icon, InformationCircleIcon } from "hugeicons-react";
import { Button } from "@/components/ui/button";

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
  onDragStart,
  onDragEnd,
  onDrag,
  onClick,
}: SpreadCardProps) {
  const form = useFormContext<{ positions: Array<{ name: string }> }>();
  const [showEditButton, setShowEditButton] = useState(false)

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

  const handleCardTranslation = useCallback((index: number, x: number, y: number) => {
      // console.log("updating card position...")
      // // TWO DIFFERENT APPROACHES IN THIS FUNCTION, BOTH APPEAR TO WORK
      // const currentPositions = form.getValues("positions")
      // const currentCard = currentPositions[index]
      // update(index, {
      //     ...currentCard, x, y
      // })
      const positions = form.getValues("positions");
      const updated = positions.map((card, i) =>
        i === index ? { ...card, x, y } : card
      );
      form.setValue("positions", updated, { shouldDirty: true });
  }, [form])

  // Initialize GSAP Draggable
  useGSAP(() => {
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
        console.log("drag start. ending positions:", this.x, this.y)
        isDraggingRef.current = true;
        onDragStart(index, this.x, this.y);
        gsap.to(group, { opacity: 0.7, duration: 0.15 });
      },
      onDrag: function () {
        console.log("dragging. ending positions:", this.x, this.y)
        wasDraggedRef.current = true;
        onDrag(index, this.x, this.y);
        handleCardTranslation(index, this.x, this.y)
      },
      onDragEnd: function () {
        console.log("drag end. ending positions:", this.x, this.y)
        isDraggingRef.current = false;
        onDragEnd(index);
        gsap.to(group, { opacity: 1, duration: 0.15 });
        handleCardTranslation(index, this.x, this.y);
      },
      cursor: "grab",
      activeCursor: "grabbing",
    });

    draggableRef.current = instance;

    return () => {
      instance.kill();
    };
  }, { dependencies: [index, handleCardTranslation, onDragStart, onDragEnd, onDrag] });

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
    // if (!wasDraggedRef.current) {
      // console.log("card button clicked")
      e.stopPropagation();
      onClick(index);
    // }
  };

  return (
    <g
      ref={groupRef}
      style={{ cursor: "grab" }}
      onMouseDown={handleMouseDown}
      onMouseOver={() => setShowEditButton(true)}
      onMouseOut={() => setShowEditButton(false)}
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

        <foreignObject width={32} height={32} x={CARD_WIDTH - 36} y={CARD_HEIGHT - 36}>
          <Button 
            variant="secondary"
            size="icon"
            onClick={handleClick}
            className={`${showEditButton ? "translate-y-0 opacity-100 scale-100" : "translate-y-2 opacity-0 scale-75 pointer-events-none"} duration-100 cursor-pointer`}
          >
            <Edit01Icon />
          </Button>
        </foreignObject>
      </g>
    </g>
  );
}

// === Memoization ===

function arePropsEqual(prev: SpreadCardProps, next: SpreadCardProps): boolean {
  return (
    prev.card.name === next.card.name &&
    prev.card.description === next.card.description &&
    prev.card.allowReverse === next.card.allowReverse &&
    prev.card.x === next.card.x &&
    prev.card.y === next.card.y &&
    prev.card.r === next.card.r &&
    prev.card.z === next.card.z &&
    prev.index === next.index &&
    prev.selected === next.selected &&
    prev.onDragStart === next.onDragStart &&
    prev.onDragEnd === next.onDragEnd &&
    prev.onDrag === next.onDrag &&
    prev.onClick === next.onClick
  );
}

export default memo(SpreadCard, arePropsEqual);

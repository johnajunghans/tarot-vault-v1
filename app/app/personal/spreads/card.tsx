"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { useGSAP } from '@gsap/react'
import { cardData } from "./spread-schema";

gsap.registerPlugin(Draggable);

// Card dimensions
export const CARD_WIDTH = 90;
export const CARD_HEIGHT = 150;
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
  groupSelected: boolean;
  isDraggingInGroup: boolean;
  onDragStart: (index: number, x: number, y: number) => void;
  onDragEnd: (index: number) => void;
  onDrag: (index: number, x: number, y: number) => void;
  onClick: (index: number) => void;
  registerRef: (index: number, el: SVGGElement | null) => void;
}

// === Component ===

function SpreadCard({
  card,
  index,
  selected,
  groupSelected,
  isDraggingInGroup,
  onDragStart,
  onDragEnd,
  onDrag,
  onClick,
  registerRef,
}: SpreadCardProps) {
  const { control, setValue } = useFormContext<{ positions: cardData[] }>();
  const watched = useWatch({ control, name: `positions.${index}` });
  const [isDraggingState, setIsDraggingState] = useState(false)

  // ------------ DRAG LOGIC ------------ //

  const groupRef = useRef<SVGGElement>(null);
  const draggableRef = useRef<Draggable | null>(null);
  const isDraggingRef = useRef(false);
  const initialPos = useRef({ x: card.x, y: card.y });

  // Set x, y field values
  const handleCardTranslation = useCallback((index: number, x: number, y: number) => {
      setValue(`positions.${index}.x`, x, { shouldDirty: true });
      setValue(`positions.${index}.y`, y, { shouldDirty: true });
  }, [setValue])

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
        isDraggingRef.current = true;
        setIsDraggingState(true);
        onDragStart(index, this.x, this.y);
      },
      onDrag: function () {
        onDrag(index, this.x, this.y);
        handleCardTranslation(index, this.x, this.y);
      },
      onDragEnd: function () {
        isDraggingRef.current = false;
        setIsDraggingState(false);
        onDragEnd(index);
        handleCardTranslation(index, this.x, this.y);
      },
      onClick: function () {
        onClick(index);
      },
      cursor: "pointer",
      activeCursor: "grabbing",
    });

    draggableRef.current = instance;

    return () => {
      instance.kill();
    };
  }, { dependencies: [index, handleCardTranslation, onDragStart, onDragEnd, onDrag, onClick] });

  // Sync GSAP position from form state when not dragging (e.g. panel input changes)
  useEffect(() => {
    if (groupRef.current && draggableRef.current && !isDraggingRef.current) {
      gsap.set(groupRef.current, { x: watched.x, y: watched.y });
      draggableRef.current.update();
    }
  }, [watched.x, watched.y]);

  // Register ref with canvas for group drag
  useEffect(() => {
    registerRef(index, groupRef.current);
    return () => registerRef(index, null);
  }, [index, registerRef]);

  // ------------ VISUAL STATE ------------ //

  const isActiveDrag = isDraggingState || isDraggingInGroup;
  const isGroupStyled = groupSelected;
  const isEditStyled = selected && !groupSelected;

  // Simplified color scheme:
  // - Edit-selected: gold (current styling with glow)
  // - Group-selected: gold (prominent highlight)
  // - Unselected: muted-foreground (neutral)
  const cardFill = isEditStyled || isGroupStyled ? "var(--gold)" : "var(--muted-foreground)";
  const cardFillOpacity = 0.3;
  const cardStroke = isEditStyled || isGroupStyled ? "var(--gold)" : "var(--muted-foreground)";
  const cardDashArray = undefined; // Always solid stroke
  const badgeColor = isEditStyled || isGroupStyled ? "var(--gold)" : "var(--muted-foreground)";

  // ------------ RETURN ------------ //

  return (
    <g
      ref={groupRef}
      style={{
        cursor: "pointer",
        opacity: isActiveDrag ? 0.7 : 1,
        transition: "opacity 150ms ease",
      }}
    >
      {/* Inner rotation wrapper — separate from GSAP's x/y transform on outer <g> */}
      <g transform={`rotate(${watched.r}, ${CARD_WIDTH / 2}, ${CARD_HEIGHT / 2})`}>
        {/* Soft glow for edit-selected state */}
        {isEditStyled && (
          <rect
            x={-3}
            y={-3}
            width={CARD_WIDTH + 6}
            height={CARD_HEIGHT + 6}
            rx={9}
            fill="none"
            stroke="var(--gold)"
            strokeOpacity={0.25}
            strokeWidth={5}
            style={{ pointerEvents: "none" }}
          />
        )}

        {/* Card background — inset by 1px so stroke centers on edge,
            making total visual footprint exactly 90x150 */}
        <rect
          x={1}
          y={1}
          width={CARD_WIDTH - STROKE_WIDTH}
          height={CARD_HEIGHT - STROKE_WIDTH}
          rx={6}
          fill={cardFill}
          fillOpacity={cardFillOpacity}
          stroke={cardStroke}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={cardDashArray}
        />

        {/* Index badge (top-left, 1-based display) */}
        <circle cx={15} cy={15} r={10} fill={badgeColor} />
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

        {/* Card name (center) — from useWatch so it updates immediately */}
        <text
          x={CARD_WIDTH / 2}
          y={CARD_HEIGHT / 2 + 4}
          textAnchor="middle"
          fontSize={11}
          fill="var(--foreground)"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {watched.name}
        </text>

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
    prev.groupSelected === next.groupSelected &&
    prev.isDraggingInGroup === next.isDraggingInGroup &&
    prev.onDragStart === next.onDragStart &&
    prev.onDragEnd === next.onDragEnd &&
    prev.onDrag === next.onDrag &&
    prev.onClick === next.onClick &&
    prev.registerRef === next.registerRef
  );
}

export default memo(SpreadCard, arePropsEqual);

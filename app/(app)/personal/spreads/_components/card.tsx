"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { useGSAP } from '@gsap/react'
import { CardForm } from "@/types/spreads";

gsap.registerPlugin(Draggable);

export const CARD_WIDTH = 90;
export const CARD_HEIGHT = 150;
const GRID_SIZE = 15;
const BOUNDS = { minX: 0, minY: 0, maxX: 1410, maxY: 1350 };
const CORNER_R = 8;

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
  isViewMode: boolean;
  onDragStart: (index: number, x: number, y: number) => void;
  onDragEnd: (index: number) => void;
  onDrag: (index: number, x: number, y: number) => void;
  onClick: (index: number) => void;
  registerRef: (index: number, el: SVGGElement | null) => void;
}

function TarotCardBack({ selected, groupSelected }: { selected: boolean; groupSelected: boolean }) {
  const isHighlighted = selected || groupSelected;
  const borderColor = isHighlighted ? "var(--gold)" : "var(--gold-muted)";
  const borderOpacity = isHighlighted ? 0.9 : 0.5;
  const fillOpacity = isHighlighted ? 0.18 : 0.1;
  const accentOpacity = isHighlighted ? 0.5 : 0.2;
  const cx = CARD_WIDTH / 2;
  const cy = CARD_HEIGHT / 2;

  return (
    <>
      {/* Card body */}
      <rect
        x={0} y={0}
        width={CARD_WIDTH} height={CARD_HEIGHT}
        rx={CORNER_R}
        fill="var(--card)"
        stroke={borderColor}
        strokeWidth={1.5}
        strokeOpacity={borderOpacity}
      />

      {/* Inner frame */}
      <rect
        x={5} y={5}
        width={CARD_WIDTH - 10} height={CARD_HEIGHT - 10}
        rx={4}
        fill="none"
        stroke={borderColor}
        strokeWidth={0.5}
        strokeOpacity={accentOpacity}
      />

      {/* Second inner frame */}
      <rect
        x={8} y={8}
        width={CARD_WIDTH - 16} height={CARD_HEIGHT - 16}
        rx={3}
        fill="var(--gold)"
        fillOpacity={fillOpacity}
        stroke="none"
      />

      {/* Central diamond */}
      <polygon
        points={`${cx},${cy - 22} ${cx + 15},${cy} ${cx},${cy + 22} ${cx - 15},${cy}`}
        fill="none"
        stroke={borderColor}
        strokeWidth={0.75}
        strokeOpacity={accentOpacity * 1.4}
      />

      {/* Inner diamond */}
      <polygon
        points={`${cx},${cy - 12} ${cx + 8},${cy} ${cx},${cy + 12} ${cx - 8},${cy}`}
        fill="var(--gold)"
        fillOpacity={fillOpacity * 1.5}
        stroke="none"
      />

      {/* Cross lines through center */}
      <line x1={cx} y1={14} x2={cx} y2={CARD_HEIGHT - 14} stroke={borderColor} strokeWidth={0.4} strokeOpacity={accentOpacity * 0.6} />
      <line x1={14} y1={cy} x2={CARD_WIDTH - 14} y2={cy} stroke={borderColor} strokeWidth={0.4} strokeOpacity={accentOpacity * 0.6} />

      {/* Diagonal lines */}
      <line x1={14} y1={14} x2={CARD_WIDTH - 14} y2={CARD_HEIGHT - 14} stroke={borderColor} strokeWidth={0.3} strokeOpacity={accentOpacity * 0.4} />
      <line x1={CARD_WIDTH - 14} y1={14} x2={14} y2={CARD_HEIGHT - 14} stroke={borderColor} strokeWidth={0.3} strokeOpacity={accentOpacity * 0.4} />

      {/* Corner ornaments - small diamonds */}
      {[
        { x: 14, y: 14 },
        { x: CARD_WIDTH - 14, y: 14 },
        { x: 14, y: CARD_HEIGHT - 14 },
        { x: CARD_WIDTH - 14, y: CARD_HEIGHT - 14 },
      ].map((pos, i) => (
        <polygon
          key={i}
          points={`${pos.x},${pos.y - 4} ${pos.x + 3},${pos.y} ${pos.x},${pos.y + 4} ${pos.x - 3},${pos.y}`}
          fill={borderColor}
          fillOpacity={accentOpacity * 1.2}
          stroke="none"
        />
      ))}

      {/* Concentric arcs at top and bottom center */}
      <path
        d={`M ${cx - 18} ${18} A 18 18 0 0 1 ${cx + 18} ${18}`}
        fill="none"
        stroke={borderColor}
        strokeWidth={0.4}
        strokeOpacity={accentOpacity * 0.7}
      />
      <path
        d={`M ${cx - 18} ${CARD_HEIGHT - 18} A 18 18 0 0 0 ${cx + 18} ${CARD_HEIGHT - 18}`}
        fill="none"
        stroke={borderColor}
        strokeWidth={0.4}
        strokeOpacity={accentOpacity * 0.7}
      />
    </>
  );
}

function SpreadCard({
  card,
  index,
  selected,
  groupSelected,
  isDraggingInGroup,
  isViewMode,
  onDragStart,
  onDragEnd,
  onDrag,
  onClick,
  registerRef,
}: SpreadCardProps) {
  const { control, setValue, getValues } = useFormContext<{ positions: CardForm[] }>();
  const watched = useWatch({ control, name: `positions.${index}` });
  const [isDraggingState, setIsDraggingState] = useState(false)

  const groupRef = useRef<SVGGElement>(null);
  const draggableRef = useRef<Draggable | null>(null);
  const isDraggingRef = useRef(false);
  const initialPos = useRef({ x: card.x, y: card.y });

  const handleCardTranslation = useCallback((index: number, x: number, y: number) => {
      setValue(`positions.${index}.x`, x, { shouldDirty: true });
      setValue(`positions.${index}.y`, y, { shouldDirty: true });
  }, [setValue])

  useGSAP(() => {
    const group = groupRef.current;
    if (!group) return;

    const currentPos = getValues(`positions.${index}`);
    const startX = currentPos?.x ?? initialPos.current.x;
    const startY = currentPos?.y ?? initialPos.current.y;
    gsap.set(group, { x: startX, y: startY });

    if (isViewMode) return;

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
  }, { dependencies: [index, isViewMode, handleCardTranslation, onDragStart, onDragEnd, onDrag, onClick] });

  useEffect(() => {
    if (!groupRef.current || isDraggingRef.current) return;
    gsap.set(groupRef.current, { x: watched.x, y: watched.y });
    if (draggableRef.current) {
      draggableRef.current.update();
    }
  }, [watched.x, watched.y]);

  useEffect(() => {
    registerRef(index, groupRef.current);
    return () => registerRef(index, null);
  }, [index, registerRef]);

  const isActiveDrag = isDraggingState || isDraggingInGroup;
  const isHighlighted = selected || groupSelected;
  const badgeColor = isHighlighted ? "var(--gold)" : "var(--gold-muted)";

  return (
    <g
      ref={groupRef}
      onClick={isViewMode ? () => onClick(index) : undefined}
      style={{ cursor: "pointer" }}
    >
      {/* Shadow filter definition scoped to this card */}
      <defs>
        <filter id={`shadow-${index}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx={0}
            dy={isActiveDrag ? 6 : 2}
            stdDeviation={isActiveDrag ? 8 : 3}
            floodColor="black"
            floodOpacity={isActiveDrag ? 0.4 : 0.15}
          />
        </filter>
      </defs>

      {/* Outer group with shadow + drag transform */}
      <g
        filter={`url(#shadow-${index})`}
        style={{
          transition: isActiveDrag ? "none" : "filter 300ms ease",
          transform: isActiveDrag ? "scale(1.03)" : "scale(1)",
          transformOrigin: `${CARD_WIDTH / 2}px ${CARD_HEIGHT / 2}px`,
        }}
      >
        {/* Rotation wrapper */}
        <g transform={`rotate(${watched.r}, ${CARD_WIDTH / 2}, ${CARD_HEIGHT / 2})`}>

          {/* Selection glow ring */}
          {selected && !groupSelected && (
            <rect
              x={-4} y={-4}
              width={CARD_WIDTH + 8} height={CARD_HEIGHT + 8}
              rx={CORNER_R + 4}
              fill="none"
              stroke="var(--gold)"
              strokeOpacity={0.3}
              strokeWidth={6}
              style={{ pointerEvents: "none" }}
            />
          )}

          {/* The tarot card back */}
          <TarotCardBack selected={selected} groupSelected={groupSelected} />

          {/* Position number badge */}
          <circle cx={15} cy={15} r={10} fill={badgeColor} fillOpacity={0.9} />
          <text
            x={15} y={19}
            textAnchor="middle"
            fontSize={10}
            fontWeight="bold"
            fill="var(--background)"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {index + 1}
          </text>

          {/* Position name */}
          <text
            x={CARD_WIDTH / 2}
            y={CARD_HEIGHT - 18}
            textAnchor="middle"
            fontSize={9}
            fontWeight="600"
            fill="var(--foreground)"
            fillOpacity={0.7}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {watched.name || ""}
          </text>
        </g>
      </g>
    </g>
  );
}

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
    prev.isViewMode === next.isViewMode &&
    prev.onDragStart === next.onDragStart &&
    prev.onDragEnd === next.onDragEnd &&
    prev.onDrag === next.onDrag &&
    prev.onClick === next.onClick &&
    prev.registerRef === next.registerRef
  );
}

export default memo(SpreadCard, arePropsEqual);

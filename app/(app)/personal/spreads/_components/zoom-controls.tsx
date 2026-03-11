"use client";

import { Button } from "@/components/ui/button";
import { MinusSignIcon, PlusSignIcon } from "hugeicons-react";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.1;

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  className?: string;
}

export default function ZoomControls({ zoom, onZoomChange, className }: ZoomControlsProps) {
  const clamp = (value: number) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, value));

  return (
    <div
      className={`flex items-center gap-0.5 rounded-lg border border-border/50 bg-background/90 px-1 py-0.5 shadow-md backdrop-blur-sm ${className ?? ""}`}
    >
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onZoomChange(clamp(zoom - ZOOM_STEP))}
        disabled={zoom <= ZOOM_MIN}
      >
        <MinusSignIcon />
      </Button>
      <span
        className="min-w-10 select-none text-center font-mono text-xs text-muted-foreground"
      >
        {Math.round(zoom * 100)}%
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onZoomChange(clamp(zoom + ZOOM_STEP))}
        disabled={zoom >= ZOOM_MAX}
      >
        <PlusSignIcon />
      </Button>
    </div>
  );
}

export { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP };

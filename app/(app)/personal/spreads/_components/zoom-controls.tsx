"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MinusSignIcon, PlusSignIcon, Refresh01Icon } from "hugeicons-react";

const DEFAULT_ZOOM = 1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.1;
const ZOOM_STEP_EPSILON = 0.0001;
const TOOLTIP_DELAY = 500;

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  className?: string;
}

export default function ZoomControls({ zoom, onZoomChange, className }: ZoomControlsProps) {
  const clamp = (value: number) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, value));
  const isDefaultZoom = Math.abs(zoom - DEFAULT_ZOOM) < ZOOM_STEP_EPSILON;
  const snapZoom = (direction: "in" | "out") => {
    const stepIndex = zoom / ZOOM_STEP;
    const nearestStep = Math.round(stepIndex);
    const isStepAligned = Math.abs(stepIndex - nearestStep) < ZOOM_STEP_EPSILON;

    if (direction === "in") {
      const nextStep = isStepAligned ? nearestStep + 1 : Math.ceil(stepIndex);
      return clamp(nextStep * ZOOM_STEP);
    }

    const nextStep = isStepAligned ? nearestStep - 1 : Math.floor(stepIndex);
    return clamp(nextStep * ZOOM_STEP);
  };

  return (
    <div
      className={`flex h-11 items-center gap-1 rounded-xl border border-border/50 bg-background/90 px-1.5 shadow-md backdrop-blur-sm ${className ?? ""}`}
    >
      {!isDefaultZoom && (
        <>
          <Tooltip delay={TOOLTIP_DELAY}>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onZoomChange(DEFAULT_ZOOM)}
                >
                  <Refresh01Icon />
                </Button>
              }
            />
            <TooltipContent>Reset zoom</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="my-2" />
        </>
      )}
      <Tooltip delay={TOOLTIP_DELAY}>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onZoomChange(snapZoom("out"))}
              disabled={zoom <= ZOOM_MIN}
            >
              <MinusSignIcon />
            </Button>
          }
        />
        <TooltipContent>Zoom out</TooltipContent>
      </Tooltip>
      <span
        className="min-w-12 select-none text-center font-mono text-sm text-muted-foreground"
      >
        {Math.round(zoom * 100)}%
      </span>
      <Tooltip delay={TOOLTIP_DELAY}>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onZoomChange(snapZoom("in"))}
              disabled={zoom >= ZOOM_MAX}
            >
              <PlusSignIcon />
            </Button>
          }
        />
        <TooltipContent>Zoom in</TooltipContent>
      </Tooltip>
    </div>
  );
}

export { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP };

"use client";

import {
  forwardRef,
  type ReactNode,
  useState,
} from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { DragDropVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CardForm } from "@/types/spreads";

const TILE_HEIGHT = 40;

function CardTileName({ index, isHovering = false }: { index: number; isHovering?: boolean }) {

    const { control } = useFormContext<{ positions: CardForm[] }>();
    const name = useWatch({ control, name: `positions.${index}.name` });
    const doubleDigitIndex = index >= 9;
  
    return (
      <div
        className={`relative mx-1 overflow-visible truncate font-display text-sm ${doubleDigitIndex ? "pl-6" : "pl-4"}`}
      >
        <HugeiconsIcon
          icon={DragDropVerticalIcon}
          size={20}
          color="var(--muted-foreground)"
          strokeWidth={2.5}
          className={`absolute ${doubleDigitIndex ? "-left-0.5" : "-left-1.5"} ${isHovering ? "scale-100" : "scale-0"} duration-150`}
        />
        <span
          className={`absolute left-0 mr-1.5 font-mono font-medium text-muted-foreground/80 ${isHovering ? "scale-0" : "scale-100"} duration-150`}
        >
          {index + 1}
        </span>
        {name || <span className="italic text-muted-foreground/40">Untitled</span>}
      </div>
    );
  }
  
  interface CardTileProps {
    index: number;
    isSelected: boolean;
    isMobile?: boolean;
    variant?: "readonly" | "editable";
    onSelect?: () => void;
    handleRef?: (el: HTMLDivElement | null) => void;
    rightSlot?: ReactNode;
  }
  
  const CardTile = forwardRef<HTMLDivElement, CardTileProps>(
    ({ index, isSelected, isMobile = false, variant = "editable", onSelect, handleRef, rightSlot }, ref) => {
      const [isHovering, setIsHovering] = useState(false);
      const showMobileHandle = variant === "editable" && isMobile;
  
      return (
        <div
          ref={ref}
          className={`flex items-stretch transition-transform duration-200 ${showMobileHandle ? "gap-2" : ""}`}
          style={{
            height: `${TILE_HEIGHT}px`,
            touchAction: showMobileHandle ? "pan-y" : undefined,
          }}
        >
          <div
            onClick={onSelect}
            className={`!overflow-visible flex min-w-0 flex-1 cursor-pointer items-center justify-between rounded-lg border px-3 transition-all duration-200 ${
              isSelected
                ? "border-gold/80 bg-gold/10 shadow-sm !-translate-y-0.25"
                : "border-border/80 bg-surface/50 !-translate-y-0 hover:border-border hover:bg-surface"
            }`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <CardTileName
              index={index}
              isHovering={variant === "editable" && !showMobileHandle ? isHovering : false}
            />
            {rightSlot && <div className="flex shrink-0 items-center">{rightSlot}</div>}
          </div>
          {showMobileHandle && (
            <div
              ref={handleRef}
              className={`flex w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                isSelected
                  ? "border-gold/40 bg-gold/8 text-gold/80"
                  : "border-border/70 bg-surface/35 text-muted-foreground/65"
              }`}
              style={{ touchAction: "none", flex: "0 0 40px" }}
              aria-label={`Drag position ${index + 1}`}
            >
              <HugeiconsIcon icon={DragDropVerticalIcon} size={20} strokeWidth={2.5} />
            </div>
          )}
        </div>
      );
    }
  );
  CardTile.displayName = "CardTile";

  export default CardTile
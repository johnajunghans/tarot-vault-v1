"use client";

import {
  Dispatch,
  forwardRef,
  type ReactNode,
  SetStateAction,
  useCallback,
  useState,
} from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { UseFieldArrayMove, UseFieldArrayRemove } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Delete02Icon, DragDropVerticalIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CardForm } from "@/types/spreads";
import ConfirmDialog from "@/app/(app)/_components/confirm-dialog";
import { useCardOverviewReorder } from "../hooks/use-card-overview-reorder";

const TILE_HEIGHT = 40;
const TILE_GAP = 6;

interface CardOverviewProps {
  cardIds: string[];
  selectedCardIndex: number | null;
  setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
  move: UseFieldArrayMove;
  remove: UseFieldArrayRemove;
  addCard: () => void;
  maxCards?: number;
  isMobile?: boolean;
}

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

interface CardOverviewReadOnlyProps {
  cardCount: number;
  selectedCardIndex: number | null;
  setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
}

export function CardOverviewReadOnly({
  cardCount,
  selectedCardIndex,
  setSelectedCardIndex,
}: CardOverviewReadOnlyProps) {
  return (
    <div className="group flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-1">
        <span className="font-display text-sm font-bold tracking-tight">Positions</span>
        <span className="text-[10px] italic text-muted-foreground/40 opacity-0 duration-300 group-hover:opacity-100">
          Click to view
        </span>
      </div>
      <div className="relative flex flex-col" style={{ gap: `${TILE_GAP}px` }}>
        {Array.from({ length: cardCount }, (_, index) => (
          <CardTile
            key={index}
            index={index}
            isSelected={index === selectedCardIndex}
            variant="readonly"
            onSelect={() => setSelectedCardIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default function CardOverview({
  cardIds,
  selectedCardIndex,
  setSelectedCardIndex,
  move,
  remove,
  addCard,
  maxCards = 78,
  isMobile = false,
}: CardOverviewProps) {
  const cardCount = cardIds.length;
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const { selectedCardId, registerTileRef, registerHandleRef } = useCardOverviewReorder({
    cardIds,
    selectedCardIndex,
    setSelectedCardIndex,
    move,
    isMobile,
  });

  const handleDeleteConfirm = useCallback(() => {
    if (deleteIndex === null) return;

    if (selectedCardIndex !== null) {
      if (selectedCardIndex === deleteIndex) {
        setSelectedCardIndex(null);
      } else if (selectedCardIndex > deleteIndex) {
        setSelectedCardIndex(selectedCardIndex - 1);
      }
    }

    remove(deleteIndex);
    setDeleteIndex(null);
  }, [deleteIndex, selectedCardIndex, setSelectedCardIndex, remove]);

  return (
    <div className="group mb-24 flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-1">
        <span className="font-display text-sm font-bold tracking-tight">Positions</span>
        <span
          className={`text-[10px] italic text-muted-foreground/40 duration-300 ${
            isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {isMobile ? "Use handle to reorder" : "Drag to reorder"}
        </span>
      </div>
      <div className="relative flex flex-col" style={{ gap: `${TILE_GAP}px` }}>
        {cardIds.map((cardId, index) => (
          <CardTile
            key={cardId}
            ref={(el) => {
              registerTileRef(index, el);
            }}
            index={index}
            isSelected={cardId === selectedCardId}
            isMobile={isMobile}
            onSelect={() => setSelectedCardIndex(index)}
            handleRef={(el) => {
              registerHandleRef(index, el);
            }}
            rightSlot={
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground/40 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteIndex(index);
                }}
              >
                <HugeiconsIcon icon={Delete02Icon} />
              </Button>
            }
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addCard}
        disabled={cardCount >= maxCards}
        className="flex h-10 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border/50 text-muted-foreground/50 transition-all duration-200 hover:border-gold/30 hover:bg-gold/5 hover:text-gold disabled:pointer-events-none disabled:opacity-30"
      >
        <HugeiconsIcon icon={PlusSignIcon} className="mr-1.5 size-3.5" />
        <span className="text-sm">Add Position</span>
      </button>

      <ConfirmDialog
        open={deleteIndex !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteIndex(null);
        }}
        title={deleteIndex !== null ? `Remove Position ${deleteIndex + 1}?` : ""}
        description="This position will be removed from the spread. This cannot be undone."
        cancelLabel="Keep it"
        confirmLabel="Remove"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

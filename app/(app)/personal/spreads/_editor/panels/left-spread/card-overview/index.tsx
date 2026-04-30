"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useState,
} from "react";
import { UseFieldArrayMove, UseFieldArrayRemove } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import ConfirmDialog from "@/app/(app)/_components/confirm-dialog";
import { useCardOverviewReorder } from "./use-card-overview-reorder";
import CardTile from "./card-tile";

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
        description="This position will be removed from the spread. You can undo this change before saving."
        cancelLabel="Keep it"
        confirmLabel="Remove"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

"use client";

import { type Dispatch, type ReactNode, type SetStateAction } from "react";
import { FieldSeparator } from "@/components/ui/field";
import { useFormContext, useWatch } from "react-hook-form";
import type { SpreadForm } from "@/types/spreads";
import { CardOverviewReadOnly } from "./card-overview";
import SpreadPanelHeader from "./spread-panel-header";

interface SpreadDetailsContentProps {
  cards: Record<"id", string>[];
  selectedCardIndex: number | null;
  setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
  headerActions?: ReactNode;
}

export default function SpreadDetailsContent({
  cards,
  selectedCardIndex,
  setSelectedCardIndex,
  headerActions,
}: SpreadDetailsContentProps) {
  const { control } = useFormContext<SpreadForm>();
  const name = useWatch({ control, name: "name" });
  const description = useWatch({ control, name: "description" });

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <SpreadPanelHeader title="Spread Details" actions={headerActions} />
      <div className="flex flex-col gap-3">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
            Name
          </span>
          <p className="mt-0.5 text-sm">{name || "Untitled"}</p>
        </div>
        {description && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Description
            </span>
            <p className="mt-0.5 whitespace-pre-wrap text-sm">{description}</p>
          </div>
        )}
      </div>
      <FieldSeparator />
      <CardOverviewReadOnly
        cardCount={cards.length}
        selectedCardIndex={selectedCardIndex}
        setSelectedCardIndex={setSelectedCardIndex}
      />
    </div>
  );
}

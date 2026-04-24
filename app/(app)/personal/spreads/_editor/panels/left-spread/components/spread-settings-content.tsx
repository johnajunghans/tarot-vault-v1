"use client";

import { type Dispatch, type ReactNode, type SetStateAction } from "react";
import { FieldSeparator, FieldSet } from "@/components/ui/field";
import { UseFieldArrayMove, UseFieldArrayRemove, useFormContext } from "react-hook-form";
import TextField from "@/components/form/text-field";
import TextareaField from "@/components/form/textarea-field";
import type { SpreadForm } from "@/types/spreads";
import CardOverview from "../card-overview";
import { PanelHeader } from "../../shared/panel-header";

interface SpreadSettingsContentProps {
  cards: Record<"id", string>[];
  addCard: () => void;
  remove: UseFieldArrayRemove;
  move: UseFieldArrayMove;
  selectedCardIndex: number | null;
  setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
  headerActions?: ReactNode;
  isMobile: boolean;
}

export default function SpreadSettingsContent({
  cards,
  addCard,
  remove,
  move,
  selectedCardIndex,
  setSelectedCardIndex,
  headerActions,
  isMobile,
}: SpreadSettingsContentProps) {
  const form = useFormContext<SpreadForm>();

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <PanelHeader title="Spread Settings" actions={headerActions} />
      <form>
        <FieldSet>
          <TextField
            label="Name"
            id="spread-name"
            placeholder="e.g. Celtic Cross, Daily Draw..."
            autoFocus={!isMobile}
            error={form.formState.errors.name}
            {...form.register("name")}
          />
          <TextareaField
            label="Description"
            id="spread-description"
            placeholder="What is this spread for? (optional)"
            error={form.formState.errors.description}
            {...form.register("description")}
          />
          <FieldSeparator />
        </FieldSet>
      </form>
      <CardOverview
        cardIds={cards.map((card) => card.id)}
        selectedCardIndex={selectedCardIndex}
        setSelectedCardIndex={setSelectedCardIndex}
        move={move}
        remove={remove}
        addCard={addCard}
        isMobile={isMobile}
      />
    </div>
  );
}

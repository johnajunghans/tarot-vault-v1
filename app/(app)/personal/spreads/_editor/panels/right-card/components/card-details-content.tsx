"use client";

import { FieldSeparator } from "@/components/ui/field";
import type { CardForm } from "@/types/spreads";
import type { ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { PanelHeader } from "@personal/_panel";

interface CardDetailsContentProps {
  selectedCardIndex: number | null;
  headerActions?: ReactNode;
}

export default function CardDetailsContent({
  selectedCardIndex,
  headerActions,
}: CardDetailsContentProps) {
  const { control } = useFormContext<{ positions: CardForm[] }>();
  const card = useWatch({
    control,
    name: `positions.${selectedCardIndex ?? 0}`,
  });

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <PanelHeader
        title={`Position ${selectedCardIndex !== null ? selectedCardIndex + 1 : ""}`.trim()}
        actions={headerActions}
      />
      {card && selectedCardIndex !== null && (
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Name
            </span>
            <p className="mt-0.5 text-sm">{card.name || "Untitled"}</p>
          </div>
          {card.description && (
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Meaning
              </span>
              <p className="mt-0.5 whitespace-pre-wrap text-sm">{card.description}</p>
            </div>
          )}
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Reversals
            </span>
            <p className="mt-0.5 text-sm">{card.allowReverse ? "Allowed" : "Not allowed"}</p>
          </div>
          <FieldSeparator />
          <div>
            <span className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Placement
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
                  Horizontal
                </span>
                <p className="text-sm font-medium">{card.x}px</p>
              </div>
              <div className="rounded-lg bg-surface p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
                  Vertical
                </span>
                <p className="text-sm font-medium">{card.y}px</p>
              </div>
              <div className="rounded-lg bg-surface p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
                  Rotation
                </span>
                <p className="text-sm font-medium">{card.r}&deg;</p>
              </div>
              <div className="rounded-lg bg-surface p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
                  Layer
                </span>
                <p className="text-sm font-medium">{card.z}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

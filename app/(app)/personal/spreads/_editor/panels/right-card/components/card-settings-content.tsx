"use client";

import ConfirmDialog from "@/app/(app)/_components/confirm-dialog";
import {
  clampLayer,
  getLayersWithBackCard,
  getLayersWithFrontCard,
  normalizeRotationForStorage,
  snapToGrid,
} from "../../../_lib";
import NumberField from "@/components/form/number-field";
import SwitchField from "@/components/form/switch-field";
import TextareaField from "@/components/form/textarea-field";
import TextField from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { FieldGroup, FieldSeparator, FieldSet } from "@/components/ui/field";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  LayerBringToFrontIcon,
  LayerSendToBackIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type Dispatch, type ReactNode, type SetStateAction, useCallback, useMemo, useState } from "react";
import { Controller, type UseFieldArrayRemove, useFormContext, useWatch } from "react-hook-form";
import type { CardForm } from "@/types/spreads";
import CardPanelHeader from "./card-panel-header";

const TOOLTIP_DELAY = 500;

interface CardSettingsContentProps {
  cards: Record<"id", string>[];
  selectedCardIndex: number | null;
  setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
  onRotationChange: (index: number, value: number) => void;
  remove: UseFieldArrayRemove;
  headerActions?: ReactNode;
  isMobile: boolean;
}

export default function CardSettingsContent({
  cards,
  selectedCardIndex,
  setSelectedCardIndex,
  onRotationChange,
  remove,
  headerActions,
  isMobile,
}: CardSettingsContentProps) {
  const form = useFormContext<{ positions: CardForm[] }>();
  const positions = useWatch({
    control: form.control,
    name: "positions",
  });
  const selectedCard = selectedCardIndex !== null ? cards[selectedCardIndex] : null;
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [placementOpen, setPlacementOpen] = useState(false);
  const layers = useMemo(
    () => (positions ?? []).map((card) => clampLayer(card.z ?? 0)),
    [positions]
  );
  const selectedLayer = selectedCardIndex !== null ? layers[selectedCardIndex] ?? null : null;
  const maxLayer = layers.length > 0 ? Math.max(...layers) : null;
  const minLayer = layers.length > 0 ? Math.min(...layers) : null;
  const isAtFront =
    selectedCardIndex === null || selectedLayer === null || maxLayer === null
      ? true
      : selectedLayer >= maxLayer;
  const isAtBack =
    selectedCardIndex === null || selectedLayer === null || minLayer === null
      ? true
      : selectedLayer <= minLayer;

  const applyLayerValues = useCallback(
    (nextLayers: number[]) => {
      nextLayers.forEach((layer, index) => {
        form.setValue(`positions.${index}.z`, layer, {
          shouldDirty: true,
        });
      });
    },
    [form]
  );

  const handleBringToFront = useCallback(() => {
    if (selectedCardIndex === null || isAtFront) return;

    const nextLayers = (form.getValues("positions") ?? []).map((card) => clampLayer(card.z ?? 0));
    applyLayerValues(getLayersWithFrontCard(nextLayers, selectedCardIndex));
  }, [applyLayerValues, form, isAtFront, selectedCardIndex]);

  const handleMoveToBack = useCallback(() => {
    if (selectedCardIndex === null || isAtBack) return;

    const nextLayers = (form.getValues("positions") ?? []).map((card) => clampLayer(card.z ?? 0));
    applyLayerValues(getLayersWithBackCard(nextLayers, selectedCardIndex));
  }, [applyLayerValues, form, isAtBack, selectedCardIndex]);

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
  }, [deleteIndex, remove, selectedCardIndex, setSelectedCardIndex]);

  const cardDetailsPanel = selectedCard && selectedCardIndex !== null && (
    <form key={selectedCardIndex}>
      <FieldSet>
        <FieldSet>
          <Controller
            name={`positions.${selectedCardIndex}.name`}
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                label="Position Name"
                id="card-name"
                autoFocus={!isMobile}
                maxLength={50}
                placeholder="e.g. Past, Present, Future"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                error={fieldState.error}
              />
            )}
          />

          <Controller
            name={`positions.${selectedCardIndex}.description`}
            control={form.control}
            render={({ field, fieldState }) => (
              <TextareaField
                label="Meaning"
                id="card-description"
                maxLength={500}
                placeholder="What does this position represent in the reading?"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                error={fieldState.error}
              />
            )}
          />

          <Controller
            name={`positions.${selectedCardIndex}.allowReverse`}
            control={form.control}
            render={({ field, fieldState }) => (
              <SwitchField
                label="Allow Reversals"
                id="card-allowReverse"
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
                description="Can this position hold reversed cards?"
                error={fieldState.error}
              />
            )}
          />
        </FieldSet>

        <FieldSeparator />

        <div>
          <button
            type="button"
            className="mb-1 flex w-full items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            onClick={() => setPlacementOpen((prev) => !prev)}
          >
            {placementOpen ? (
              <HugeiconsIcon icon={ArrowDown01Icon} className="h-3.5 w-3.5" />
            ) : (
              <HugeiconsIcon icon={ArrowRight01Icon} className="h-3.5 w-3.5" />
            )}
            Placement
          </button>

          {placementOpen && (
            <FieldSet className="mt-2">
              <FieldGroup className="gap-2">
                <Controller
                  name={`positions.${selectedCardIndex}.x`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <NumberField
                      label="Horizontal"
                      id={field.name}
                      value={field.value}
                      onChangeValue={field.onChange}
                      onBlurTransform={snapToGrid}
                      onBlur={field.onBlur}
                      step={15}
                      min={0}
                      error={fieldState.error}
                      showStepper={!isMobile}
                    />
                  )}
                />
                <Controller
                  name={`positions.${selectedCardIndex}.y`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <NumberField
                      label="Vertical"
                      id={field.name}
                      value={field.value}
                      onChangeValue={field.onChange}
                      onBlurTransform={snapToGrid}
                      onBlur={field.onBlur}
                      step={15}
                      min={0}
                      error={fieldState.error}
                      showStepper={!isMobile}
                    />
                  )}
                />
              </FieldGroup>

              <FieldGroup className="gap-2">
                <Controller
                  name={`positions.${selectedCardIndex}.r`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <NumberField
                      label="Rotation"
                      id={field.name}
                      value={field.value}
                      onChangeValue={(value) => onRotationChange(selectedCardIndex, value)}
                      onBlurTransform={normalizeRotationForStorage}
                      onBlur={field.onBlur}
                      step={1}
                      error={fieldState.error}
                      showStepper={!isMobile}
                    />
                  )}
                />
                <Controller
                  name={`positions.${selectedCardIndex}.z`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <NumberField
                      label="Layer"
                      id={field.name}
                      value={field.value}
                      onChangeValue={(value) => field.onChange(clampLayer(value))}
                      onBlurTransform={clampLayer}
                      onBlur={field.onBlur}
                      step={1}
                      min={0}
                      error={fieldState.error}
                      showStepper={!isMobile}
                      trailingControls={
                        <ButtonGroup>
                          <Tooltip delay={TOOLTIP_DELAY}>
                            <Button
                              render={<TooltipTrigger />}
                              type="button"
                              variant="outline"
                              size="icon"
                              aria-label="Move position to back"
                              aria-disabled={isAtBack || undefined}
                              className="aria-disabled:opacity-50"
                              onClick={handleMoveToBack}
                            >
                              <HugeiconsIcon icon={LayerSendToBackIcon} />
                            </Button>
                            <TooltipContent>Move to Back</TooltipContent>
                          </Tooltip>
                          <Tooltip delay={TOOLTIP_DELAY}>
                            <Button
                              render={<TooltipTrigger />}
                              type="button"
                              variant="outline"
                              size="icon"
                              aria-label="Bring position to front"
                              aria-disabled={isAtFront || undefined}
                              className="aria-disabled:opacity-50"
                              onClick={handleBringToFront}
                            >
                              <HugeiconsIcon icon={LayerBringToFrontIcon} />
                            </Button>
                            <TooltipContent>Bring to Front</TooltipContent>
                          </Tooltip>
                        </ButtonGroup>
                      }
                    />
                  )}
                />
              </FieldGroup>
            </FieldSet>
          )}
        </div>

        <FieldSeparator />

        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
          onClick={() => {
            if (selectedCardIndex !== null) setDeleteIndex(selectedCardIndex);
          }}
        >
          <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
          Remove Position
        </Button>
      </FieldSet>
    </form>
  );

  return (
    <>
      <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
        <CardPanelHeader
          title={`Position ${selectedCardIndex !== null ? selectedCardIndex + 1 : ""}`.trim()}
          actions={headerActions}
        />
        {cardDetailsPanel}
      </div>

      <ConfirmDialog
        open={deleteIndex !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleteIndex(null);
        }}
        title={deleteIndex !== null ? `Remove Position ${deleteIndex + 1}?` : ""}
        description="This position will be removed from the spread. This cannot be undone."
        cancelLabel="Keep it"
        confirmLabel="Remove"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}

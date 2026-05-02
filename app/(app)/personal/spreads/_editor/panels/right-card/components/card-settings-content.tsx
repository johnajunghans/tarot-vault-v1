"use client";

import ConfirmDialog from "@/app/(app)/_components/confirm-dialog";
import {
  clampLayer,
  getLayersWithBackCard,
  getLayersWithFrontCard,
  isUniqueHighestLayer,
  isUniqueLowestLayer,
  moveCardToLayer,
  normalizeLayerValues,
  normalizeRotationForStorage,
  ROTATION_STEP,
  snapToGrid,
} from "../../../lib";
import NumberField from "@/components/form/number-field";
import SwitchField from "@/components/form/switch-field";
import TextareaField from "@/components/form/textarea-field";
import TextField from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { FieldGroup, FieldSeparator, FieldSet } from "@/components/ui/field";
import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  LayerBringToFrontIcon,
  LayerSendToBackIcon,
  RotateTopLeftIcon,
  RotateTopRightIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type Dispatch, type ReactNode, type SetStateAction, useCallback, useMemo, useState } from "react";
import { Controller, type UseFieldArrayRemove, useFormContext, useWatch } from "react-hook-form";
import type { CardForm } from "@/types/spreads";
import { PanelHeader } from "@personal/_panel";

const TOOLTIP_DELAY = 500;

interface CardSettingsContentProps {
  cards: Record<"id", string>[];
  selectedCardIndex: number | null;
  setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
  onRotationChange: (index: number, value: number) => void;
  onImmediateFormChange: () => void;
  onTextEditStart: () => void;
  onTextEditEnd: () => void;
  remove: UseFieldArrayRemove;
  headerActions?: ReactNode;
  isMobile: boolean;
}

export default function CardSettingsContent({
  cards,
  selectedCardIndex,
  setSelectedCardIndex,
  onRotationChange,
  onImmediateFormChange,
  onTextEditStart,
  onTextEditEnd,
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
    () => normalizeLayerValues((positions ?? []).map((card) => card.z ?? 1)),
    [positions]
  );
  const isAtFront =
    selectedCardIndex === null
      ? true
      : isUniqueHighestLayer(layers, selectedCardIndex);
  const isAtBack =
    selectedCardIndex === null
      ? true
      : isUniqueLowestLayer(layers, selectedCardIndex);

  const applyLayerValues = useCallback(
    (nextLayers: number[]) => {
      const currentLayers = normalizeLayerValues(
        (form.getValues("positions") ?? []).map((card) => card.z ?? 1)
      );
      const hasChanged = nextLayers.some((layer, index) => layer !== currentLayers[index]);
      if (!hasChanged) return;

      onImmediateFormChange();
      nextLayers.forEach((layer, index) => {
        form.setValue(`positions.${index}.z`, layer, {
          shouldDirty: true,
        });
      });
    },
    [form, onImmediateFormChange]
  );

  const handleBringToFront = useCallback(() => {
    if (selectedCardIndex === null || isAtFront) return;

    const nextLayers = (form.getValues("positions") ?? []).map((card) => card.z ?? 1);
    applyLayerValues(getLayersWithFrontCard(nextLayers, selectedCardIndex));
  }, [applyLayerValues, form, isAtFront, selectedCardIndex]);

  const handleMoveToBack = useCallback(() => {
    if (selectedCardIndex === null || isAtBack) return;

    const nextLayers = (form.getValues("positions") ?? []).map((card) => card.z ?? 1);
    applyLayerValues(getLayersWithBackCard(nextLayers, selectedCardIndex));
  }, [applyLayerValues, form, isAtBack, selectedCardIndex]);

  const handleLayerChange = useCallback(
    (value: number) => {
      if (selectedCardIndex === null) return;

      const currentLayers = (form.getValues("positions") ?? []).map((card) => card.z ?? 1);
      applyLayerValues(moveCardToLayer(currentLayers, selectedCardIndex, value));
    },
    [applyLayerValues, form, selectedCardIndex]
  );

  const handleRotateStep = useCallback(
    (direction: 1 | -1) => {
      if (selectedCardIndex === null) return;

      const currentRotation = form.getValues(`positions.${selectedCardIndex}.r`) ?? 0;
      const nextRotation = normalizeRotationForStorage(currentRotation + direction * ROTATION_STEP);
      onRotationChange(selectedCardIndex, nextRotation);
    },
    [form, onRotationChange, selectedCardIndex]
  );

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
                onFocus={onTextEditStart}
                onBlur={() => {
                  field.onBlur();
                  onTextEditEnd();
                }}
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
                onFocus={onTextEditStart}
                onBlur={() => {
                  field.onBlur();
                  onTextEditEnd();
                }}
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
                onCheckedChange={(checked) => {
                  if (checked !== field.value) {
                    onImmediateFormChange();
                  }
                  field.onChange(checked);
                }}
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
                      onChangeValue={(value) => {
                        if (value !== field.value) {
                          onImmediateFormChange();
                        }
                        field.onChange(value);
                      }}
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
                      onChangeValue={(value) => {
                        if (value !== field.value) {
                          onImmediateFormChange();
                        }
                        field.onChange(value);
                      }}
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
                      onChangeValue={(value) => {
                        if (value !== field.value) {
                          onRotationChange(selectedCardIndex, value);
                        }
                      }}
                      onBlurTransform={normalizeRotationForStorage}
                      onBlur={field.onBlur}
                      step={1}
                      error={fieldState.error}
                      showStepper={!isMobile}
                      trailingControls={
                        <TooltipProvider delay={TOOLTIP_DELAY}>
                          <ButtonGroup>
                            <TooltipRoot>
                              <Button
                                render={<TooltipTrigger />}
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label="Rotate position counterclockwise 45 degrees"
                                onClick={() => handleRotateStep(-1)}
                              >
                                <HugeiconsIcon icon={RotateTopLeftIcon} />
                              </Button>
                              <TooltipContent>Rotate Left 45&deg;</TooltipContent>
                            </TooltipRoot>
                            <TooltipRoot>
                              <Button
                                render={<TooltipTrigger />}
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label="Rotate position clockwise 45 degrees"
                                onClick={() => handleRotateStep(1)}
                              >
                                <HugeiconsIcon icon={RotateTopRightIcon} />
                              </Button>
                              <TooltipContent>Rotate Right 45&deg;</TooltipContent>
                            </TooltipRoot>
                          </ButtonGroup>
                        </TooltipProvider>
                      }
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
                      value={field.value ?? (selectedCardIndex === null ? 1 : layers[selectedCardIndex] ?? 1)}
                      onChangeValue={handleLayerChange}
                      onBlurTransform={(value) => clampLayer(value, layers.length)}
                      onBlur={field.onBlur}
                      step={1}
                      min={1}
                      max={layers.length}
                      error={fieldState.error}
                      showStepper={!isMobile}
                      trailingControls={
                        <TooltipProvider delay={TOOLTIP_DELAY}>
                          <ButtonGroup>
                            <TooltipRoot>
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
                            </TooltipRoot>
                            <TooltipRoot>
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
                            </TooltipRoot>
                          </ButtonGroup>
                        </TooltipProvider>
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
        <PanelHeader
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
        description="This position will be removed from the spread. You can undo this change before saving."
        cancelLabel="Keep it"
        confirmLabel="Remove"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}

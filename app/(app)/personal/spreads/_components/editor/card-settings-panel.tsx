import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  FieldGroup,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { normalizeRotationForStorage } from "../../_lib/rotation";
import { snapToGrid } from "../../_lib/layout";
import {
  Cancel01Icon,
  Delete02Icon,
  LayerBringToFrontIcon,
  LayerSendToBackIcon,
} from "hugeicons-react";
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useFormContext, useWatch, UseFieldArrayRemove } from "react-hook-form";
import { CardForm } from "@/types/spreads";
import { usePanelRef } from "react-resizable-panels";
import TextField from "@/components/form/text-field";
import TextareaField from "@/components/form/textarea-field";
import SwitchField from "@/components/form/switch-field";
import NumberField from "@/components/form/number-field";
import { ResponsivePanel } from "@/app/(app)/_components/responsive-panel";
import ConfirmDialog from "@/app/_components/confirm-dialog";

const TOOLTIP_DELAY = 500;

function clampLayer(value: number): number {
  return Math.max(0, Math.round(value));
}

function getLayersWithFrontCard(layers: number[], selectedIndex: number): number[] {
  const maxLayer = layers.reduce((max, layer) => Math.max(max, layer), 0);
  const nextLayers = [...layers];
  nextLayers[selectedIndex] = maxLayer + 1;
  return nextLayers;
}

function getLayersWithBackCard(layers: number[], selectedIndex: number): number[] {
  if (layers.length === 0) return layers;

  const minLayer = layers.reduce((min, layer) => Math.min(min, layer), layers[0] ?? 0);
  const nextLayers = [...layers];

  if (minLayer > 0) {
    nextLayers[selectedIndex] = minLayer - 1;
    return nextLayers;
  }

  return nextLayers.map((layer, index) =>
    index === selectedIndex ? 0 : layer + 1
  );
}

// ------------ Read-Only Content Component ------------ //

interface CardDetailsContentProps {
    selectedCardIndex: number | null;
    headerActions?: React.ReactNode;
}

function CardDetailsContent({
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
        <div className="flex w-full justify-between items-center gap-4">
          <h3 className="font-display text-base font-bold tracking-tight">
            Position {selectedCardIndex !== null && selectedCardIndex + 1}
          </h3>
          {headerActions}
        </div>
        {card && selectedCardIndex !== null && (
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider font-medium">Name</span>
              <p className="text-sm mt-0.5">{card.name || "Untitled"}</p>
            </div>
            {card.description && (
              <div>
                <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider font-medium">Meaning</span>
                <p className="text-sm whitespace-pre-wrap mt-0.5">{card.description}</p>
              </div>
            )}
            <div>
              <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider font-medium">Reversals</span>
              <p className="text-sm mt-0.5">{card.allowReverse ? "Allowed" : "Not allowed"}</p>
            </div>
            <FieldSeparator />
            <div>
              <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider font-medium mb-2 block">Placement</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-surface p-2.5">
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Horizontal</span>
                  <p className="text-sm font-medium">{card.x}px</p>
                </div>
                <div className="rounded-lg bg-surface p-2.5">
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Vertical</span>
                  <p className="text-sm font-medium">{card.y}px</p>
                </div>
                <div className="rounded-lg bg-surface p-2.5">
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Rotation</span>
                  <p className="text-sm font-medium">{card.r}&deg;</p>
                </div>
                <div className="rounded-lg bg-surface p-2.5">
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Layer</span>
                  <p className="text-sm font-medium">{card.z}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}

// ------------ Editable Content Component ------------ //

interface CardSettingsContentProps {
    cards: Record<"id", string>[];
    selectedCardIndex: number | null;
    setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
    onRotationChange: (index: number, value: number) => void;
    remove: UseFieldArrayRemove;
    headerActions?: React.ReactNode;
    isMobile: boolean;
}

export function CardSettingsContent({
    cards,
    selectedCardIndex,
    setSelectedCardIndex,
    onRotationChange,
    remove,
    headerActions,
    isMobile
}: CardSettingsContentProps) {
    const form = useFormContext<{ positions: CardForm[] }>();
    const positions = useWatch({
      control: form.control,
      name: "positions",
    });
    const selectedCard = selectedCardIndex !== null ? cards[selectedCardIndex] : null
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
    const layers = useMemo(
      () => (positions ?? []).map((card) => clampLayer(card.z ?? 0)),
      [positions]
    );
    const selectedLayer =
      selectedCardIndex !== null ? layers[selectedCardIndex] ?? null : null;
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

    const applyLayerValues = useCallback((nextLayers: number[]) => {
      nextLayers.forEach((layer, index) => {
        form.setValue(`positions.${index}.z`, layer, {
          shouldDirty: true,
        });
      });
    }, [form]);

    const handleBringToFront = useCallback(() => {
      if (selectedCardIndex === null || isAtFront) return;

      const layers = (form.getValues("positions") ?? []).map((card) =>
        clampLayer(card.z ?? 0)
      );
      applyLayerValues(getLayersWithFrontCard(layers, selectedCardIndex));
    }, [applyLayerValues, form, isAtFront, selectedCardIndex]);

    const handleMoveToBack = useCallback(() => {
      if (selectedCardIndex === null || isAtBack) return;

      const layers = (form.getValues("positions") ?? []).map((card) =>
        clampLayer(card.z ?? 0)
      );
      applyLayerValues(getLayersWithBackCard(layers, selectedCardIndex));
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
    }, [deleteIndex, selectedCardIndex, setSelectedCardIndex, remove]);

    const cardDetailsPanel = selectedCard && selectedCardIndex !== null && (
      <form key={selectedCardIndex}>
        <FieldSet>
          <FieldSet>
            {/* Name */}
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

            {/* Description */}
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

            {/* Allow Reverse Orientation */}
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
            <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider font-medium mb-3 block">Placement</span>
            <FieldSet>
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
                      step={45}
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
                              <LayerSendToBackIcon />
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
                              <LayerBringToFrontIcon />
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
          </div>

          <FieldSeparator />

          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/5"
            onClick={() => {
              if (selectedCardIndex !== null) setDeleteIndex(selectedCardIndex);
            }}
          >
            <Delete02Icon className="w-4 h-4" />
            Remove Position
          </Button>
        </FieldSet>
      </form>
    );

    return (
      <>
        <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
          <div className="flex w-full justify-between items-center gap-4">
            <h3 className="font-display text-base font-bold tracking-tight">
              Position {selectedCardIndex !== null && selectedCardIndex + 1}
            </h3>
            {headerActions}
          </div>
          {cardDetailsPanel}
        </div>

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
      </>
    )
}

// ------------ Desktop Panel Component ------------ //

interface CardSettingsPanelProps {
    cards: Record<"id", string>[]
    selectedCardIndex: number | null,
    setSelectedCardIndex: Dispatch<SetStateAction<number | null>>
    onRotationChange?: (index: number, value: number) => void
    remove?: UseFieldArrayRemove
    isMobile: boolean;
    isViewMode?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function CardSettingsPanel({
    cards,
    selectedCardIndex,
    setSelectedCardIndex,
    onRotationChange,
    remove,
    isMobile,
    isViewMode = false,
    open = false,
    onOpenChange,
}: CardSettingsPanelProps) {
    const cardDetailsPanelRef = usePanelRef();

    function handleResize() {
      if (!cardDetailsPanelRef.current) return;

      if (cardDetailsPanelRef.current.isCollapsed()) {
        setSelectedCardIndex(null)
      }
    }

    useEffect(() => {
      const id = requestAnimationFrame(() => {
        const panel = cardDetailsPanelRef.current
        if (!panel) return
        if (selectedCardIndex !== null) {
          panel.expand()
        } else {
          panel.collapse()
        }
      })
      return () => cancelAnimationFrame(id)
    }, [selectedCardIndex, cardDetailsPanelRef])

    useEffect(() => {
      if (
        selectedCardIndex !== null &&
        !cards.some((_, i) => i === selectedCardIndex)
      ) {
        setSelectedCardIndex(null);
      }
    }, [cards, selectedCardIndex, setSelectedCardIndex]);

    const panelTitle = isViewMode ? "Position Details" : "Position Settings";

    const closeHeaderAction = !isMobile && (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => {
          setSelectedCardIndex(null)
          cardDetailsPanelRef.current?.collapse()
        }}
      >
        <Cancel01Icon />
      </Button>
    );

    return (
      <ResponsivePanel
        isMobile={isMobile}
        panelId="card-settings-panel"
        panelRef={cardDetailsPanelRef}
        onPanelResize={handleResize}
        collapsible
        defaultSize="20%"
        minSize={240}
        maxSize={480}
        handlePosition="before"
        hideHandle={selectedCardIndex === null}
        side="right"
        sheetTitle={panelTitle}
        open={open}
        onOpenChange={onOpenChange}
      >
        <div className={isMobile ? "h-full" : "h-full bg-background/85 backdrop-blur-xs"}>
          {isViewMode ? (
            <CardDetailsContent
              selectedCardIndex={selectedCardIndex}
              headerActions={closeHeaderAction}
            />
          ) : (
            <CardSettingsContent
              cards={cards}
              selectedCardIndex={selectedCardIndex}
              setSelectedCardIndex={setSelectedCardIndex}
              onRotationChange={onRotationChange!}
              remove={remove!}
              headerActions={closeHeaderAction}
              isMobile={isMobile}
            />
          )}
        </div>
      </ResponsivePanel>
    )
  }

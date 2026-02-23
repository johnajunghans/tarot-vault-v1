import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup, FieldSeparator, FieldSet } from "@/components/ui/field";
import { Cancel01Icon, Delete02Icon } from "hugeicons-react";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { Controller, useFormContext, useWatch, UseFieldArrayRemove } from "react-hook-form";
import { CardForm } from "@/types/spreads";
import { usePanelRef } from "react-resizable-panels";
import TextField from "@/components/form/text-field";
import TextareaField from "@/components/form/textarea-field";
import SwitchField from "@/components/form/switch-field";
import NumberField from "@/components/form/number-field";
import { ResponsivePanel } from "@/app/(app)/_components/responsive-panel";

const GRID_SIZE = 15;

function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
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
    cards: Record<"id", string>[]
    selectedCardIndex: number | null
    setSelectedCardIndex: Dispatch<SetStateAction<number | null>>
    remove: UseFieldArrayRemove
    cardCount: number
    headerActions?: React.ReactNode
}

export function CardSettingsContent({
    cards,
    selectedCardIndex,
    setSelectedCardIndex,
    remove,
    cardCount,
    headerActions,
}: CardSettingsContentProps) {
    const form = useFormContext<{ positions: CardForm[] }>();
    const selectedCard = selectedCardIndex !== null ? cards[selectedCardIndex] : null
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

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
                  autoFocus
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
                      onChangeValue={field.onChange}
                      onBlur={field.onBlur}
                      step={45}
                      min={0}
                      max={315}
                      error={fieldState.error}
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
                      onChangeValue={field.onChange}
                      onBlur={field.onBlur}
                      step={1}
                      min={0}
                      max={100}
                      error={fieldState.error}
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
            disabled={cardCount <= 1}
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

        <Dialog
          open={deleteIndex !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteIndex(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Remove Position {deleteIndex !== null ? deleteIndex + 1 : ""}?</DialogTitle>
              <DialogDescription>
                This position will be removed from the spread. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteIndex(null)}>
                Keep it
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
}

// ------------ Desktop Panel Component ------------ //

interface CardSettingsPanelProps {
    cards: Record<"id", string>[]
    selectedCardIndex: number | null,
    setSelectedCardIndex: Dispatch<SetStateAction<number | null>>
    remove?: UseFieldArrayRemove
    cardCount?: number
    isMobile: boolean;
    isViewMode?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function CardSettingsPanel({
    cards,
    selectedCardIndex,
    setSelectedCardIndex,
    remove,
    cardCount,
    isMobile,
    isViewMode = false,
    open = false,
    onOpenChange,
}: CardSettingsPanelProps) {
    const cardDetailsPanelRef = usePanelRef();

    function handleResize() {
      if (cardDetailsPanelRef.current && cardDetailsPanelRef.current.isCollapsed()) {
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
    }, [selectedCardIndex])

    useEffect(() => {
      if (
        selectedCardIndex !== null &&
        !cards.some((_, i) => i === selectedCardIndex)
      ) {
        setSelectedCardIndex(null);
      }
    }, [cards, selectedCardIndex]);

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
            remove={remove!}
            cardCount={cardCount!}
            headerActions={closeHeaderAction}
          />
        )}
      </ResponsivePanel>
    )
  }

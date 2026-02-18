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
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { Cancel01Icon, Delete02Icon } from "hugeicons-react";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { Controller, useFormContext, UseFieldArrayRemove } from "react-hook-form";
import { CardForm } from "@/types/spreads";
import { usePanelRef } from "react-resizable-panels";
import TextField from "@/components/form/text-field";
import TextareaField from "@/components/form/textarea-field";
import SwitchField from "@/components/form/switch-field";
import NumberField from "@/components/form/number-field";

const GRID_SIZE = 15;

// Snap value to nearest multiple of grid size
function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

// ------------ Shared Content Component ------------ //

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
                  label="Name"
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
                  label="Description"
                  id="card-description"
                  maxLength={500}
                  placeholder="What this position represents..."
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
                  label="Allow Reverse"
                  id="card-allowReverse"
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                  error={fieldState.error}
                />
              )}
            />
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            {/* X-Offset / Y-Offset */}
            <FieldGroup className="gap-2">
              <Controller
                name={`positions.${selectedCardIndex}.x`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <NumberField
                    label="X-Offset"
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
                    label="Y-Offset"
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

            {/* Rotation / Z-Index */}
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
                    label="Z-Index"
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

          <FieldSeparator />

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={cardCount <= 1}
            onClick={() => {
              if (selectedCardIndex !== null) setDeleteIndex(selectedCardIndex);
            }}
          >
            <Delete02Icon />
            Remove Card
          </Button>
        </FieldSet>
      </form>
    );

    return (
      <>
        <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
          <div className="flex w-full justify-between items-center gap-4">
            <h3 className="text-md font-semibold">
              Card {selectedCardIndex !== null && selectedCardIndex + 1} Settings
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
              <DialogTitle>Remove Card {deleteIndex !== null ? deleteIndex + 1 : ""}?</DialogTitle>
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteIndex(null)}>
                Cancel
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
    remove: UseFieldArrayRemove
    cardCount: number
}

export default function CardSettingsPanel({
    cards,
    selectedCardIndex,
    setSelectedCardIndex,
    remove,
    cardCount,
}: CardSettingsPanelProps) {
    const cardDetailsPanelRef = usePanelRef();

    function handleResize() {
      if (cardDetailsPanelRef.current && cardDetailsPanelRef.current.isCollapsed()) {
        setSelectedCardIndex(null)
      }
    }

    // Expand when a card is selected, collapse when none.
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

    // Deselect card if it no longer exists
    useEffect(() => {
      if (
        selectedCardIndex !== null &&
        !cards.some((_, i) => i === selectedCardIndex)
      ) {
        setSelectedCardIndex(null);
      }
    }, [cards, selectedCardIndex]);

    return (
      <>
        <ResizableHandle withHandle className={selectedCardIndex === null ? "hidden" : ""} />
        <ResizablePanel
          id="card-settings-panel"
          panelRef={cardDetailsPanelRef}
          onResize={handleResize}
          collapsible
          defaultSize="20%"
          minSize={240}
          maxSize="40%"
        >
          <CardSettingsContent
            cards={cards}
            selectedCardIndex={selectedCardIndex}
            setSelectedCardIndex={setSelectedCardIndex}
            remove={remove}
            cardCount={cardCount}
            headerActions={
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
            }
          />
        </ResizablePanel>
      </>
    )
  }

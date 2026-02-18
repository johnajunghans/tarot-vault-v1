import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel, FieldSeparator, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Cancel01Icon, Delete02Icon } from "hugeicons-react";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { Controller, useFormContext, UseFieldArrayRemove } from "react-hook-form";
import { CardForm } from "@/types/spreads";
import { usePanelRef } from "react-resizable-panels";

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

    const cardErrors = selectedCardIndex !== null ? form.formState.errors.positions?.[selectedCardIndex] : undefined;

    const cardDetailsPanel = selectedCard && selectedCardIndex !== null && (
      <form key={selectedCardIndex}>
        <FieldSet>
          <FieldSet>
            {/* Name */}
            <Controller
              name={`positions.${selectedCardIndex}.name`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="card-name">Name</FieldLabel>
                  <FieldContent>
                    <Input
                      id="card-name"
                      type="text"
                      autoFocus
                      maxLength={50}
                      placeholder="e.g. Past, Present, Future"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />

            {/* Description */}
            <Controller
              name={`positions.${selectedCardIndex}.description`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="card-description">Description</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="card-description"
                      maxLength={500}
                      placeholder="What this position represents..."
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />

            {/* Allow Reverse Orientation */}
            <Field orientation="horizontal">
              <FieldLabel htmlFor="card-allowReverse" className="flex-1">
                Allow Reverse
              </FieldLabel>
              <FieldContent>
                <Controller
                  name={`positions.${selectedCardIndex}.allowReverse`}
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id="card-allowReverse"
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                      aria-invalid={!!cardErrors?.allowReverse}
                    />
                  )}
                />
                <FieldError errors={cardErrors?.allowReverse ? [cardErrors.allowReverse] : []} />
              </FieldContent>
            </Field>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            {/* X-Offset / Y-Offset */}
            <FieldGroup className="gap-2">
              <Controller
                name={`positions.${selectedCardIndex}.x`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>X-Offset</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        id={field.name}
                        type="number"
                        step={15}
                        min={0}
                        aria-invalid={fieldState.invalid}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            field.onChange(val);
                          }
                        }}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            field.onChange(snapToGrid(val));
                          }
                          field.onBlur();
                        }}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </FieldContent>
                  </Field>
                )}
              />
              <Controller
                name={`positions.${selectedCardIndex}.y`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Y-Offset</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        id={field.name}
                        type="number"
                        step={15}
                        min={0}
                        aria-invalid={fieldState.invalid}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            field.onChange(val);
                          }
                        }}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            field.onChange(snapToGrid(val));
                          }
                          field.onBlur();
                        }}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </FieldContent>
                  </Field>
                )}
              />
            </FieldGroup>

            {/* Rotation / Z-Index */}
            <FieldGroup className="gap-2">
              <Controller
                name={`positions.${selectedCardIndex}.r`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Rotation</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        id={field.name}
                        type="number"
                        step={45}
                        min={0}
                        max={315}
                        aria-invalid={fieldState.invalid}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            field.onChange(val);
                          }
                        }}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </FieldContent>
                  </Field>
                )}
              />
              <Controller
                name={`positions.${selectedCardIndex}.z`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Z-Index</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        id={field.name}
                        type="number"
                        step={1}
                        min={0}
                        max={100}
                        aria-invalid={fieldState.invalid}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            field.onChange(val);
                          }
                        }}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </FieldContent>
                  </Field>
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

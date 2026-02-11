import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel, FieldSeparator, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Cancel01Icon } from "hugeicons-react";
import { Dispatch, SetStateAction, useEffect } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { spreadData } from "./spread-schema";
import { usePanelRef } from "react-resizable-panels";

interface CardSettingsPanelProps {
    form: UseFormReturn<spreadData, any, spreadData>
    cards: Record<"id", string>[]
    selectedCardIndex: number | null,
    setSelectedCardIndex: Dispatch<SetStateAction<number | null>>
}

const GRID_SIZE = 15;

// Snap value to nearest multiple of grid size
function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export default function CardSettingsPanel({
    form,
    cards,
    selectedCardIndex,
    setSelectedCardIndex
}: CardSettingsPanelProps) {
    const cardDetailsPanelRef = usePanelRef();
    const selectedCard = selectedCardIndex !== null ? cards[selectedCardIndex] : null

    function handleResize() {
      if (cardDetailsPanelRef.current && cardDetailsPanelRef.current.isCollapsed()) {
        setSelectedCardIndex(null)
      }
    }

    // Expand when a card is selected, collapse when none. Defer so panel ref is set (e.g. on initial mount).
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

    // Deselect card if it no longer exists (e.g., numberOfCards decreased)
    useEffect(() => {
      if (
        selectedCardIndex !== null &&
        !cards.some((_, i) => i === selectedCardIndex)
      ) {
        setSelectedCardIndex(null);
      }
    }, [cards, selectedCardIndex]);

    const cardErrors = selectedCardIndex !== null ? form.formState.errors.positions?.[selectedCardIndex] : undefined;

    const registerCardX = selectedCardIndex !== null
      ? form.register(`positions.${selectedCardIndex}.x`, { valueAsNumber: true })
      : null;
    const registerCardY = selectedCardIndex !== null
      ? form.register(`positions.${selectedCardIndex}.y`, { valueAsNumber: true })
      : null;

    const cardDetailsPanel = selectedCard && selectedCardIndex !== null && registerCardX && registerCardY && (
      <form>
        <FieldSet>
          <FieldSeparator />
          <FieldSet>
            {/* Name */}
            <Field>
              <FieldLabel htmlFor="card-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="card-name"
                  type="text"
                  maxLength={50}
                  placeholder="e.g. Past, Present, Future"
                  {...form.register(`positions.${selectedCardIndex}.name`)}
                  aria-invalid={!!cardErrors?.name}
                />
                <FieldError errors={cardErrors?.name ? [cardErrors.name] : []} />
              </FieldContent>
            </Field>

            {/* Description */}
            <Field>
              <FieldLabel htmlFor="card-description">Description</FieldLabel>
              <FieldContent>
                <Textarea
                  id="card-description"
                  maxLength={500}
                  placeholder="What this position represents..."
                  {...form.register(`positions.${selectedCardIndex}.description`)}
                  aria-invalid={!!cardErrors?.description}
                />
                <FieldError errors={cardErrors?.description ? [cardErrors.description] : []} />
              </FieldContent>
            </Field>

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
              <Field>
                <FieldLabel htmlFor="card-x">X-Offset</FieldLabel>
                <FieldContent>
                  <Input
                    id="card-x"
                    type="number"
                    step={15}
                    min={0}
                    {...registerCardX}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        form.setValue(`positions.${selectedCardIndex}.x`, snapToGrid(val));
                      }
                      registerCardX.onBlur(e);
                    }}
                    aria-invalid={!!cardErrors?.x}
                  />
                  <FieldError errors={cardErrors?.x ? [cardErrors.x] : []} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="card-y">Y-Offset</FieldLabel>
                <FieldContent>
                  <Input
                    id="card-y"
                    type="number"
                    step={15}
                    min={0}
                    {...registerCardY}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        form.setValue(`positions.${selectedCardIndex}.y`, snapToGrid(val));
                      }
                      registerCardY.onBlur(e);
                    }}
                    aria-invalid={!!cardErrors?.y}
                  />
                  <FieldError errors={cardErrors?.y ? [cardErrors.y] : []} />
                </FieldContent>
              </Field>
            </FieldGroup>

            {/* Rotation / Z-Index */}
            <FieldGroup className="gap-2">
              <Field>
                <FieldLabel htmlFor="card-r">Rotation</FieldLabel>
                <FieldContent>
                  <Input
                    id="card-r"
                    type="number"
                    step={45}
                    min={0}
                    max={315}
                    {...form.register(`positions.${selectedCardIndex}.r`, { valueAsNumber: true })}
                    aria-invalid={!!cardErrors?.r}
                  />
                  <FieldError errors={cardErrors?.r ? [cardErrors.r] : []} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="card-z">Z-Index</FieldLabel>
                <FieldContent>
                  <Input
                    id="card-z"
                    type="number"
                    step={1}
                    min={0}
                    max={100}
                    {...form.register(`positions.${selectedCardIndex}.z`, { valueAsNumber: true })}
                    aria-invalid={!!cardErrors?.z}
                  />
                  <FieldError errors={cardErrors?.z ? [cardErrors.z] : []} />
                </FieldContent>
              </Field>
            </FieldGroup>
          </FieldSet>
        </FieldSet>
      </form>
    );

    return (
      <>
        <>
          <ResizableHandle withHandle className={selectedCardIndex === null ? "hidden" : ""} />
          <ResizablePanel
            id="card-settings-panel"
            panelRef={cardDetailsPanelRef}
            onResize={handleResize}
            collapsible
            defaultSize="20%"
            minSize="10%"
            maxSize="40%"
          >
            <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
              <div className="flex w-full justify-between items-center gap-4">
                <h3 className="text-md font-semibold">
                  Card {selectedCardIndex !== null && selectedCardIndex + 1} Settings
                </h3>
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
              </div>
              {cardDetailsPanel}
            </div>
          </ResizablePanel>
        </>
      </>
    )
  }
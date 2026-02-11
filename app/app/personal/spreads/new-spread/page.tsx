"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDefaultLayout, usePanelRef } from "react-resizable-panels";

import { useTopbarStore } from "@/stores/topbar";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PanelLeftIcon } from "hugeicons-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, PlusSignIcon, MinusSignIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Card, CardContent } from "@/components/ui/card";
import SpreadCanvas from "../canvas";

const GRID_SIZE = 15;

// Snap value to nearest multiple of grid size
function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

const cardSchema = z.object({
  name: z.string().max(50),
  description: z.string().max(500).optional(),
  allowReverse: z.boolean().optional(),
  x: z.number(),
  y: z.number(),
  r: z.number().min(0).max(315),
  z: z.number().min(0).max(100),
})

// Form validation schema
const spreadSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(1000).optional(),
  positions: z.array(cardSchema)
});

type cardData = z.infer<typeof cardSchema>
type spreadData = z.infer<typeof spreadSchema>

// Generate starting positions for cards in a grid layout
// All values are multiples of 15: x = 15 + col * 105, y = 15 + row * 165
// function generateCards(count: number): CardPosition[] {
//   const CARDS_PER_ROW = 10;
//   return Array.from({ length: count }, (_, i) => ({
//     position: i + 1,
//     name: "",
//     description: "",
//     allowReverse: true,
//     x: 15 + (i % CARDS_PER_ROW) * 105,
//     y: 15 + Math.floor(i / CARDS_PER_ROW) * 165,
//     r: 0,
//     z: 0,
//   }));
// }

function generateCard(index: number): cardData {
  const CARDS_PER_ROW = 10;
  return {
    name: "",
    description: "",
    allowReverse: true,
    x: 15 + (index % CARDS_PER_ROW) * 105,
    y: 15 + Math.floor(index / CARDS_PER_ROW) * 165,
    r: 0,
    z: 0
  }
}

export default function NewSpreadPage() {
  const router = useRouter();
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

  const form = useForm<spreadData>({
    resolver: zodResolver(spreadSchema),
    defaultValues: {
      name: "",
      description: "",
      positions: [generateCard(0)] // initial single card
    }
  });
  
  const { fields: cards, update, append, remove } = useFieldArray({
    control: form.control,
    name: "positions"
  });
 
  // CAUSES A VARIETY OF ISSUES: 1. localStorage not defined, 2. can't reopen spread settings panel after closed/collapsed.
  // const { defaultLayout, onLayoutChanged } = useDefaultLayout({
  //   id: "spread-creation-layout",
  //   panelIds: ["spread-settings-panel", "spread-canvas-panel", "card-settings-panel"]
  // })

  // Action handlers
  const handleDiscard = useCallback(() => {
    form.reset();
    router.push("/app/personal/spreads");
  }, [form, router]);

  const handleSave = useCallback(() => {
    // Placeholder - will be implemented in future step
    console.log("Save spread:", form.getValues());
  }, [form]);

  // Set topbar state on mount
  useEffect(() => {
    useTopbarStore.getState().setTitle({
      name: "New Spread",
      addInfo: "1-Card",
      draft: true,
    });

    useTopbarStore.getState().setRightButtonGroup({
      primaryButton: {
        text: "Save Spread",
        action: handleSave,
      },
      secondaryButton: {
        text: "Discard",
        action: handleDiscard,
      },
    });

    return () => {
      useTopbarStore.getState().reset();
    };
  }, [handleDiscard, handleSave]);

  // Watch form fields and update topbar title dynamically
  useEffect(() => {
    const subscription = form.watch((value) => {
      const currentName = value.name || "New Spread";
      const addInfo = `${value.positions?.length ?? 0}-Card`

      useTopbarStore.getState().setTitle({
        name: currentName,
        addInfo,
        draft: true,
      });
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Sync cards array when numberOfCards changes
  // useEffect(() => {
  //   const subscription = form.watch((value, { name }) => {
  //     if (name !== "numberOfCards") return;
  //     const count = value.numberOfCards;
  //     if (count == null || count < 1 || count > 78) return;

  //     setCards((prev) => {
  //       if (count > prev.length) {
  //         // Append new cards with calculated grid positions
  //         const newCards = generateCards(count);
  //         return [
  //           ...prev,
  //           ...newCards.slice(prev.length),
  //         ];
  //       } else if (count < prev.length) {
  //         // Remove from the end
  //         return prev.slice(0, count);
  //       }
  //       return prev;
  //     });
  //   });

  //   return () => subscription.unsubscribe();
  // }, [form]);

  // Deselect card if it no longer exists (e.g., numberOfCards decreased)
  useEffect(() => {
    if (
      selectedCardIndex !== null &&
      !cards.some((_, i) => i === selectedCardIndex)
    ) {
      setSelectedCardIndex(null);
    }
  }, [cards, selectedCardIndex]);

  // Update card position from canvas drag
  const handleCardTranslation = useCallback(
    (index: number, x: number, y: number) => {
      form.setValue(`positions.${index}.x`, x)
      form.setValue(`positions.${index}.y`, y)
    }, [form]
  );

  // Update a card's fields
  // const handleCardUpdate = useCallback(
  //   (position: number, updates: Partial<CardPosition>) => {
  //     setCards((prev) =>
  //       prev.map((card) =>
  //         card.position === position ? { ...card, ...updates } : card
  //       )
  //     );
  //   },
  //   []
  // );


  function SpreadSettingsPanel() {
    // const spreadSettingsPanelRef = usePanelRef()
    const [hideSettings, setHideSettings] = useState(false)
 
    // function handleResize() {
    //   if (spreadSettingsPanelRef.current) {
    //     const isCollapsed = spreadSettingsPanelRef.current.isCollapsed()
    //     if (isCollapsed) {
    //       setHideSettings(true)
    //     } else {
    //       setHideSettings(false)
    //     }
    //   }
    // }

    // Add/remove card helpers
    const addCard = () => {
      const newCard = generateCard(cards.length);
      append(newCard);
    };
    
    const removeCard = () => {
      if (cards.length > 1) remove(cards.length - 1);
    };

    const cardCountButtons = (
      <ButtonGroup>
        <Button
          variant={hideSettings ? "secondary" : "outline"}
          size={hideSettings ? "icon-sm" : "icon"}
          // className="bg-gold-muted hover:bg-gold-muted/60"
          onClick={removeCard}
          disabled={cards.length <= 1}
        >
          <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} />
        </Button>
        <Button
          variant={hideSettings ? "secondary" : "outline"}
          size={hideSettings ? "icon-sm" : "icon"}
          // className="bg-gold-muted hover:bg-gold-muted/60"
          onClick={addCard}
          disabled={cards.length >= 78}
        >
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
        </Button>
      </ButtonGroup>
    );

    const settingsForm = (
      <form>
        <FieldSet>
          {/* <FieldLegend>Basic Info</FieldLegend> */}
        {/* Name Field */}
        <Field>
          <FieldLabel htmlFor="spread-name">Name</FieldLabel>
          <FieldContent>
            <Input
              id="spread-name"
              type="text"
              placeholder="Enter spread name"
              autoFocus
              {...form.register("name")}
              aria-invalid={!!form.formState.errors.name}
            />
            <FieldError errors={form.formState.errors.name ? [form.formState.errors.name] : []} />
          </FieldContent>
        </Field>

        {/* Number of Cards Field */}
        {/* <Field>
          <FieldLabel htmlFor="spread-numberOfCards">Number of Cards</FieldLabel>
          <FieldContent>
            <div className="flex gap-2 items-center">
              <Input
                id="spread-numberOfCards"
                type="number"
                min={1}
                max={78}
                placeholder="1"
                className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                {...form.register("numberOfCards", { valueAsNumber: true })}
                aria-invalid={!!form.formState.errors.numberOfCards}
              />
              {cardCountButtons}
            </div>
            <FieldError
              errors={
                form.formState.errors.numberOfCards
                  ? [form.formState.errors.numberOfCards]
                  : []
              }
            />
          </FieldContent>
        </Field> */}

        {/* Description Field */}
        <Field>
          <FieldLabel htmlFor="spread-description">Description</FieldLabel>
          <FieldContent>
            <Textarea
              id="spread-description"
              placeholder="Enter spread description (optional)"
              {...form.register("description")}
              aria-invalid={!!form.formState.errors.description}
            />
            <FieldError
              errors={
                form.formState.errors.description
                  ? [form.formState.errors.description]
                  : []
              }
            />
          </FieldContent>
        </Field>
        </FieldSet>
      </form>
    );

    return (
      <>
        {hideSettings ? 
  
          <Card className="absolute top-3 left-3 py-2 z-10 min-w-[150px] max-w-[350px] shadow-md bg-background">
            <CardContent>
              <div className="flex w-full justify-between items-center gap-4">
                <h3 className="text-md font-semibold">Spread Settings</h3>
                <div className="flex items-center gap-2">
                  {cardCountButtons}
                  <Button variant="ghost" size="icon-sm" onClick={() => setHideSettings(false)}>
                    <PanelLeftIcon />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card> :

          <>
            <ResizablePanel
              id="spread-settings-panel"
              // collapsible
              defaultSize="20%" 
              minSize={150} 
              maxSize="40%"
              // panelRef={spreadSettingsPanelRef}
              // onResize={handleResize}
            >
              <div className="flex h-full flex-col gap-4 p-4">
                <div className="flex w-full justify-between items-center gap-8">
                  <h3 className="text-md font-semibold">Spread Settings</h3>
                  <Button variant="ghost" size="icon-sm" onClick={() => setHideSettings(true)}>
                    <PanelLeftIcon />
                  </Button>
                </div>
                {settingsForm}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        }
        </>
    )
  }

  function CardSettingsPanel() {
    const cardDetailsPanelRef = usePanelRef();
    const [hideSettings, setHideSettings] = useState(true)

    const selectedCard = selectedCardIndex !== null ? cards[selectedCardIndex] : null

    // Expand/collapse card details panel when selection changes.
    // Defer so the panel is registered with the group before calling imperative API.
    // useEffect(() => {
    //   const panel = cardDetailsPanelRef.current;
    //   if (!panel) return;
    //   const id = requestAnimationFrame(() => {
    //     const p = cardDetailsPanelRef.current;
    //     if (!p) return;
    //     if (selectedCardIndex !== null) {
    //       p.expand();
    //     } else {
    //       p.collapse();
    //     }
    //   });
    //   return () => cancelAnimationFrame(id);
    // }, [selectedCardIndex, cardDetailsPanelRef]);

    // sync selectedCardIndex with hideSettings
    useEffect(() => {
      if (selectedCardIndex !== null) {
        setHideSettings(false)
      } else {
        setHideSettings(true)
      }
    }, [selectedCardIndex])

    // function handleResize() {
    //   if (cardDetailsPanelRef.current) {
    //     console.log("handleResize function run")
    //     const isCollapsed = cardDetailsPanelRef.current.isCollapsed()
    //     console.log(isCollapsed)
    //     if (isCollapsed && selectedCardIndex !== null) {
    //       setSelectedCardIndex(null)
    //     } else if (isCollapsed) {
    //       setHideSettings(false)
    //       cardDetailsPanelRef.current.expand()
    //     }
    //   }
    // }

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
      {!hideSettings && 
        <>
          <ResizableHandle withHandle />
          <ResizablePanel
            id="card-settings-panel"
            // panelRef={cardDetailsPanelRef}
            // onResize={handleResize}
            // collapsible
            // collapsedSize="0%"
            defaultSize="20%"
            minSize="10%"
            maxSize="40%"
          >
            <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
              <div className="flex w-full justify-between items-center gap-4">
                <h3 className="text-md font-semibold">
                  Card {selectedCardIndex !== null ? selectedCardIndex + 1 : 0} Settings
                </h3>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSelectedCardIndex(null)}
                >
                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                </Button>
              </div>
              {cardDetailsPanel}
            </div>
          </ResizablePanel>
        </>
      }
      </>
    )
  }

  return (
    <div className="h-app-content relative">
      <FormProvider {...form}>
        <ResizablePanelGroup 
          orientation="horizontal"
        >
          {/* Left Panel — Settings */}
          <SpreadSettingsPanel />

          {/* Center Panel — Canvas */}
          <ResizablePanel 
            id="spread-canvas-panel"
            // defaultSize="75%" 
            // minSize="0%" 
            // maxSize="100%"
          >
            <SpreadCanvas
              cards={cards}
              onPositionChange={handleCardTranslation}
              selectedCardIndex={selectedCardIndex}
              onCardSelect={setSelectedCardIndex}
            />
          </ResizablePanel>

          {/* Right Panel — Card Details */}
          <CardSettingsPanel />
        
        </ResizablePanelGroup>
      </FormProvider>
    </div>
  );
}

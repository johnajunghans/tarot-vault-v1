"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { CardPosition } from "@/types/spreads";

const GRID_SIZE = 15;

// Form validation schema
const formSchema = z.object({
  name: z.string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name cannot exceed 50 characters"),
  numberOfCards: z.number()
    .int("Must be a whole number")
    .min(1, "Must be at least 1")
    .max(78, "Cannot exceed 78"),
  description: z.string()
    .max(1000, "Cannot exceed 1000 characters")
    .optional()
});

type FormData = z.infer<typeof formSchema>;

// Generate starting positions for cards in a grid layout
// All values are multiples of 15: x = 15 + col * 105, y = 15 + row * 165
function generateCards(count: number): CardPosition[] {
  const CARDS_PER_ROW = 10;
  return Array.from({ length: count }, (_, i) => ({
    position: i + 1,
    name: "",
    description: "",
    allowReverse: true,
    x: 15 + (i % CARDS_PER_ROW) * 105,
    y: 15 + Math.floor(i / CARDS_PER_ROW) * 165,
    r: 0,
    z: 0,
  }));
}

// Snap value to nearest multiple of grid size
function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export default function NewSpreadPage() {
  const router = useRouter();
  const [cards, setCards] = useState<CardPosition[]>(() => generateCards(1));
  const [selectedCardPosition, setSelectedCardPosition] = useState<number | null>(null);
 
  // CAUSES A VARIETY OF ISSUES: 1. localStorage not defined, 2. can't reopen spread settings panel after closed/collapsed.
  // const { defaultLayout, onLayoutChanged } = useDefaultLayout({
  //   id: "spread-creation-layout",
  //   panelIds: ["spread-settings-panel", "spread-canvas-panel", "card-settings-panel"]
  // })

  // Initialize form with react-hook-form and zod validation
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      numberOfCards: 1,
      description: "",
    },
    mode: "onChange", // Validate on change for real-time feedback
  });

  // Action handlers
  const handleDiscard = useCallback(() => {
    form.reset();
    router.push("/app/personal/spreads");
  }, [form, router]);

  const handleSave = useCallback((_data: unknown) => {
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
      const addInfo = `${value.numberOfCards}-Card`

      useTopbarStore.getState().setTitle({
        name: currentName,
        addInfo,
        draft: true,
      });
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Sync cards array when numberOfCards changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name !== "numberOfCards") return;
      const count = value.numberOfCards;
      if (count == null || count < 1 || count > 78) return;

      setCards((prev) => {
        if (count > prev.length) {
          // Append new cards with calculated grid positions
          const newCards = generateCards(count);
          return [
            ...prev,
            ...newCards.slice(prev.length),
          ];
        } else if (count < prev.length) {
          // Remove from the end
          return prev.slice(0, count);
        }
        return prev;
      });
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Deselect card if it no longer exists (e.g., numberOfCards decreased)
  useEffect(() => {
    if (
      selectedCardPosition !== null &&
      !cards.some((c) => c.position === selectedCardPosition)
    ) {
      setSelectedCardPosition(null);
    }
  }, [cards, selectedCardPosition]);

  // Update card position from canvas drag
  const handlePositionChange = useCallback(
    (position: number, x: number, y: number) => {
      setCards((prev) =>
        prev.map((card) =>
          card.position === position ? { ...card, x, y } : card
        )
      );
    },
    []
  );

  // Card selection
  const handleCardSelect = useCallback((position: number | null) => {
    setSelectedCardPosition(position);
  }, []);

  // Update a card's fields
  const handleCardUpdate = useCallback(
    (position: number, updates: Partial<CardPosition>) => {
      setCards((prev) =>
        prev.map((card) =>
          card.position === position ? { ...card, ...updates } : card
        )
      );
    },
    []
  );

  // Swap position numbers between two cards
  const handlePositionSwap = useCallback(
    (currentPos: number, newPos: number) => {
      setCards((prev) =>
        prev.map((card) => {
          if (card.position === currentPos) return { ...card, position: newPos };
          if (card.position === newPos) return { ...card, position: currentPos };
          return card;
        })
      );
      setSelectedCardPosition(newPos);
    },
    []
  );

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
    const addCard = useCallback(() => {
      const current = form.getValues("numberOfCards");
      if (current < 78) form.setValue("numberOfCards", current + 1, { shouldValidate: true });
    }, [form]);

    const removeCard = useCallback(() => {
      const current = form.getValues("numberOfCards");
      if (current > 1) form.setValue("numberOfCards", current - 1, { shouldValidate: true });
    }, [form]);

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
        <Field>
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
        </Field>

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
              defaultSize="30%" 
              minSize="20%" 
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

    const selectedCard = selectedCardPosition !== null
    ? cards.find((c) => c.position === selectedCardPosition) ?? null
    : null;

    // Expand/collapse card details panel when selection changes.
    // Defer so the panel is registered with the group before calling imperative API.
    // useEffect(() => {
    //   const panel = cardDetailsPanelRef.current;
    //   if (!panel) return;
    //   const id = requestAnimationFrame(() => {
    //     const p = cardDetailsPanelRef.current;
    //     if (!p) return;
    //     if (selectedCardPosition !== null) {
    //       p.expand();
    //     } else {
    //       p.collapse();
    //     }
    //   });
    //   return () => cancelAnimationFrame(id);
    // }, [selectedCardPosition, cardDetailsPanelRef]);

    // sync selectedCardPosition with hideSettings
    useEffect(() => {
      console.log(selectedCardPosition)
      console.log(hideSettings)
      if (selectedCardPosition !== null) {
        setHideSettings(false)
      } else {
        setHideSettings(true)
      }
    }, [selectedCardPosition])

    // function handleResize() {
    //   if (cardDetailsPanelRef.current) {
    //     console.log("handleResize function run")
    //     const isCollapsed = cardDetailsPanelRef.current.isCollapsed()
    //     console.log(isCollapsed)
    //     if (isCollapsed && selectedCardPosition !== null) {
    //       setSelectedCardPosition(null)
    //     } else if (isCollapsed) {
    //       setHideSettings(false)
    //       cardDetailsPanelRef.current.expand()
    //     }
    //   }
    // }

    const cardDetailsPanel = selectedCard && (
      <form>
        <FieldSet>
        <FieldSeparator />
        {/* <FieldLegend>Basic Info</FieldLegend> */}
        <FieldSet>
          {/* Position */}
          <Field>
            <FieldLabel htmlFor="card-position">Position</FieldLabel>
            <FieldContent>
              <Input
                id="card-position"
                type="number"
                min={1}
                max={cards.length}
                step={1}
                value={selectedCard.position}
                onChange={(e) => {
                  const newPos = parseInt(e.target.value, 10);
                  if (!isNaN(newPos) && newPos >= 1 && newPos <= cards.length && newPos !== selectedCard.position) {
                    handlePositionSwap(selectedCard.position, newPos);
                  }
                }}
              />
            </FieldContent>
          </Field>
  
          {/* Name */}
          <Field>
            <FieldLabel htmlFor="card-name">Name</FieldLabel>
            <FieldContent>
              <Input
                id="card-name"
                type="text"
                maxLength={50}
                placeholder="e.g. Past, Present, Future"
                value={selectedCard.name}
                onChange={(e) =>
                  handleCardUpdate(selectedCard.position, { name: e.target.value })
                }
              />
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
                value={selectedCard.description}
                onChange={(e) =>
                  handleCardUpdate(selectedCard.position, { description: e.target.value })
                }
              />
            </FieldContent>
          </Field>
  
          {/* Allow Reverse Orientation */}
          <Field orientation="horizontal">
            <FieldLabel htmlFor="card-allowReverse" className="flex-1">
              Allow Reverse
            </FieldLabel>
            <Switch
              id="card-allowReverse"
              checked={selectedCard.allowReverse}
              onCheckedChange={(checked) =>
                handleCardUpdate(selectedCard.position, { allowReverse: checked })
              }
            />
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
                value={selectedCard.x}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) handleCardUpdate(selectedCard.position, { x: val });
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) handleCardUpdate(selectedCard.position, { x: snapToGrid(val) });
                }}
              />
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
                value={selectedCard.y}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) handleCardUpdate(selectedCard.position, { y: val });
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) handleCardUpdate(selectedCard.position, { y: snapToGrid(val) });
                }}
              />
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
                value={selectedCard.r}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 0 && val <= 315) {
                    handleCardUpdate(selectedCard.position, { r: val });
                  }
                }}
              />
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
                value={selectedCard.z}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 0 && val <= 100) {
                    handleCardUpdate(selectedCard.position, { z: val });
                  }
                }}
              />
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
                  Card {selectedCard?.position} Settings
                </h3>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSelectedCardPosition(null)}
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
            onPositionChange={handlePositionChange}
            selectedCardPosition={selectedCardPosition}
            onCardSelect={handleCardSelect}
          />
        </ResizablePanel>

        {/* Right Panel — Card Details */}
        <CardSettingsPanel />
        
      </ResizablePanelGroup>
    </div>
  );
}

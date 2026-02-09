"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useTopbarStore } from "@/stores/topbar";
import { Field, FieldContent, FieldError, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PanelLeftIcon } from "hugeicons-react";
import { Button } from "@/components/ui/button";
import SpreadCanvas from "../canvas";
import { type CardPosition } from "../card";

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
    x: 15 + (i % CARDS_PER_ROW) * 105,
    y: 15 + Math.floor(i / CARDS_PER_ROW) * 165,
  }));
}

export default function NewSpreadPage() {
  const router = useRouter();
  const [hideSettings, setHideSettings] = useState(false);
  const [cards, setCards] = useState<CardPosition[]>(() => generateCards(1));

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

  return (
    <div className="flex flex-1 min-h-0 w-full relative">

      {/* Left Panel */}
      <div className={`flex min-w-[300px] ${hideSettings ? "absolute top-3 left-3 p-2 h-auto w-auto bg-sidebar border border-border rounded-lg shadow-md" : "h-full w-1/4 flex-col gap-4 p-4 border-r border-border/60"}`}>
        <div className="flex w-full justify-between items-center gap-8">
          <h3 className="text-md font-semibold">Spread Settings</h3>
          <Button variant="ghost" size="icon-sm" onClick={() => setHideSettings(!hideSettings)}>
            <PanelLeftIcon />
          </Button>
        </div>

        {/* Spread Settings Form */}
        {!hideSettings && <form className="flex flex-col gap-4">
              {/* Name Field */}
              <Field>
                <FieldTitle>Name</FieldTitle>
                <FieldContent>
                  <Input
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
                <FieldTitle>Number of Cards</FieldTitle>
                <FieldContent>
                  <Input
                    type="number"
                    min={1}
                    max={78}
                    placeholder="1"
                    {...form.register("numberOfCards", { valueAsNumber: true })}
                    aria-invalid={!!form.formState.errors.numberOfCards}
                  />
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
                <FieldTitle>Description</FieldTitle>
                <FieldContent>
                  <Textarea
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
            </form>}
      </div>

      {/* Right Panel - Spread Canvas */}
      <div className="flex-1 min-w-0 min-h-0">
        <SpreadCanvas cards={cards} onPositionChange={handlePositionChange} />
      </div>
    </div>
  );
}

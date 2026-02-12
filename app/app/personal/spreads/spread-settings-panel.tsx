import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Field, FieldContent, FieldError, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MinusPlus01Icon, MinusSignIcon, PanelLeftIcon, PlusMinus01Icon, PlusSignIcon } from "hugeicons-react";
import { useState } from "react";
import { usePanelRef } from "react-resizable-panels";
import { generateCard, spreadData } from "./spread-schema";
import { UseFieldArrayAppend, UseFieldArrayRemove, useFormContext, UseFormReturn } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";

interface SpreadSettingsPanelProps {
    
    cards: Record<"id", string>[];
    append: UseFieldArrayAppend<spreadData, "positions">;
    remove: UseFieldArrayRemove
}

export default function SpreadSettingsPanel({ 
   
    cards,
    append,
    remove 
}: SpreadSettingsPanelProps) {
    const spreadSettingsPanelRef = usePanelRef()
    const [hideSettings, setHideSettings] = useState(false)

    const form = useFormContext()

    function handleResize() {
      if (spreadSettingsPanelRef.current) {
        setHideSettings(spreadSettingsPanelRef.current.isCollapsed())
      }
    }

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
          <MinusSignIcon />
        </Button>
        <Button
          variant={hideSettings ? "secondary" : "outline"}
          size={hideSettings ? "icon-sm" : "icon"}
          // className="bg-gold-muted hover:bg-gold-muted/60"
          onClick={addCard}
          disabled={cards.length >= 78}
        >
          <PlusSignIcon />
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
        {hideSettings && 
          <Card className="absolute top-3 left-3 py-2 z-10 min-w-[150px] max-w-[350px] shadow-md bg-background">
            <CardContent>
              <div className="flex w-full justify-between items-center gap-4">
                <h3 className="text-md font-semibold">Spread Settings</h3>
                <div className="flex items-center gap-2">
                  {cardCountButtons}
                  <Button variant="ghost" size="icon-sm" onClick={() => spreadSettingsPanelRef.current?.expand()}>
                    <PanelLeftIcon />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        }

        <>
          <ResizablePanel
            id="spread-settings-panel"
            collapsible
            defaultSize="20%" 
            minSize={150} 
            maxSize="40%"
            panelRef={spreadSettingsPanelRef}
            onResize={handleResize}
          >
            <div className="flex h-full flex-col gap-4 p-4">
              <div className="flex w-full justify-between items-center gap-8">
                <h3 className="text-md font-semibold">Spread Settings</h3>
                <Button variant="ghost" size="icon-sm" onClick={() => spreadSettingsPanelRef.current?.collapse()}>
                  <PanelLeftIcon />
                </Button>
              </div>
              {settingsForm}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className={hideSettings ? "hidden" : ""} />
        </>
      </>
    )
  }
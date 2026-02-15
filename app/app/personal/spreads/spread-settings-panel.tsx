import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldLabel, FieldSeparator, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PanelLeftIcon, PlusSignIcon } from "hugeicons-react";
import { Dispatch, type RefObject, SetStateAction, useEffect, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { spreadData } from "./spread-schema";
import { UseFieldArrayAppend, UseFieldArrayMove, UseFieldArrayRemove, useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { generateCard } from "./spread-functions";
import CardOverview from "./card-overview";

interface SpreadSettingsPanelProps {
    cards: Record<"id", string>[];
    append: UseFieldArrayAppend<spreadData, "positions">;
    remove: UseFieldArrayRemove;
    move: UseFieldArrayMove;
    selectedCardIndex: number | null;
    setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
    panelRef: RefObject<PanelImperativeHandle | null>;
}

export default function SpreadSettingsPanel({
    cards,
    append,
    remove,
    move,
    selectedCardIndex,
    setSelectedCardIndex,
    panelRef,
}: SpreadSettingsPanelProps) {
    const spreadSettingsPanelRef = panelRef
    const [hideSettings, setHideSettings] = useState(false)

    const form = useFormContext()

    function handleResize() {
      if (spreadSettingsPanelRef.current) {
        setHideSettings(spreadSettingsPanelRef.current.isCollapsed())
      }
    }

    const addCard = () => {
      const newCard = generateCard(cards.length);
      append(newCard, { focusName: `positions.${selectedCardIndex}.name` });
      setSelectedCardIndex(cards.length);
    };

    const settingsForm = (
      <form>
        <FieldSet>
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
        <FieldSeparator />
        </FieldSet>
      </form>
    );

    return (
      <>
        {hideSettings &&
          <Card className="absolute top-3 left-3 py-2 z-10 min-w-[150px] max-w-[350px] shadow-md bg-background">
            <CardContent>
              <div className="flex w-full justify-between items-center gap-8">
                <h3 className="text-md font-semibold">Spread Settings</h3>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={addCard}
                          disabled={cards.length >= 78}
                        >
                          <PlusSignIcon />
                        </Button>
                      }
                    />
                    <TooltipContent>New Card</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" onClick={() => spreadSettingsPanelRef.current?.expand()}>
                          <PanelLeftIcon />
                        </Button>
                      }
                    />
                    <TooltipContent>Show Panel</TooltipContent>
                  </Tooltip>
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
            minSize={240}
            maxSize="40%"
            panelRef={spreadSettingsPanelRef}
            onResize={handleResize}
          >
            <div className="flex h-full flex-col gap-4 p-4 overflow-y-auto">
              <div className="flex w-full justify-between items-center gap-8">
                <h3 className="text-md font-semibold">Spread Settings</h3>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={addCard}
                          disabled={cards.length >= 78}
                        >
                          <PlusSignIcon />
                        </Button>
                      }
                    />
                    <TooltipContent>New Card</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" onClick={() => spreadSettingsPanelRef.current?.collapse()}>
                          <PanelLeftIcon />
                        </Button>
                      }
                    />
                    <TooltipContent>Hide Panel</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              {settingsForm}
              <CardOverview
                cardCount={cards.length}
                selectedCardIndex={selectedCardIndex}
                setSelectedCardIndex={setSelectedCardIndex}
                move={move}
                remove={remove}
                addCard={addCard}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className={hideSettings ? "hidden" : ""} />
        </>
      </>
    )
  }

import { Button } from "@/components/ui/button";
import { FieldSeparator, FieldSet } from "@/components/ui/field";
import { PanelLeftIcon, PlusSignIcon } from "hugeicons-react";
import { Dispatch, type RefObject, SetStateAction, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { UseFieldArrayMove, UseFieldArrayRemove, useFormContext } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CardOverview from "./card-overview";
import TextField from "@/components/form/text-field";
import TextareaField from "@/components/form/textarea-field";
import { ResponsivePanel } from "@/components/app/responsive-panel";

// ------------ Shared Content Component ------------ //

interface SpreadSettingsContentProps {
    cards: Record<"id", string>[];
    addCard: () => void;
    remove: UseFieldArrayRemove;
    move: UseFieldArrayMove;
    selectedCardIndex: number | null;
    setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
    headerActions?: React.ReactNode;
}

export function SpreadSettingsContent({
    cards,
    addCard,
    remove,
    move,
    selectedCardIndex,
    setSelectedCardIndex,
    headerActions,
}: SpreadSettingsContentProps) {
    const form = useFormContext()

    return (
      <div className="flex h-full flex-col gap-4 p-4 overflow-y-auto">
        <div className="flex w-full justify-between items-center gap-8">
          <h3 className="text-md font-semibold">Spread Settings</h3>
          <div className="flex items-center gap-1">
            {headerActions}
          </div>
        </div>
        <form>
          <FieldSet>
            <TextField
              label="Name"
              id="spread-name"
              placeholder="Enter spread name"
              autoFocus
              error={form.formState.errors.name}
              {...form.register("name")}
            />
            <TextareaField
              label="Description"
              id="spread-description"
              placeholder="Enter spread description (optional)"
              error={form.formState.errors.description}
              {...form.register("description")}
            />
            <FieldSeparator />
          </FieldSet>
        </form>
        <CardOverview
          cardCount={cards.length}
          selectedCardIndex={selectedCardIndex}
          setSelectedCardIndex={setSelectedCardIndex}
          move={move}
          remove={remove}
          addCard={addCard}
        />
      </div>
    )
}

// ------------ Desktop Panel Component ------------ //

interface SpreadSettingsPanelProps {
    cards: Record<"id", string>[];
    addCard: () => void;
    remove: UseFieldArrayRemove;
    move: UseFieldArrayMove;
    selectedCardIndex: number | null;
    setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
    panelRef: RefObject<PanelImperativeHandle | null>;
    isMobile: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function SpreadSettingsPanel({
    cards,
    addCard,
    remove,
    move,
    selectedCardIndex,
    setSelectedCardIndex,
    panelRef,
    isMobile,
    open = false,
    onOpenChange,
}: SpreadSettingsPanelProps) {
    const spreadSettingsPanelRef = panelRef
    const [hideSettings, setHideSettings] = useState(false)

    function handleResize() {
      if (spreadSettingsPanelRef.current) {
        setHideSettings(spreadSettingsPanelRef.current.isCollapsed())
      }
    }

    return (
      <>
        {hideSettings &&
          <Card className="absolute bottom-5 left-3 py-2 z-10 min-w-[150px] max-w-[350px] shadow-md bg-background">
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

        <ResponsivePanel
          isMobile={isMobile}
          panelId="spread-settings-panel"
          collapsible
          defaultSize="20%"
          minSize={240}
          maxSize="40%"
          panelRef={spreadSettingsPanelRef}
          onPanelResize={handleResize}
          handlePosition="after"
          hideHandle={hideSettings}
          side="left"
          sheetTitle="Spread Settings"
          open={open}
          onOpenChange={onOpenChange}
        >
          <SpreadSettingsContent
            cards={cards}
            addCard={addCard}
            remove={remove}
            move={move}
            selectedCardIndex={selectedCardIndex}
            setSelectedCardIndex={setSelectedCardIndex}
            headerActions={
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
            }
          />
        </ResponsivePanel>
      </>
    )
  }

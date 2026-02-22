import { Button } from "@/components/ui/button";
import { FieldSeparator, FieldSet } from "@/components/ui/field";
import { PanelLeftIcon, PlusSignIcon } from "hugeicons-react";
import { Dispatch, type RefObject, SetStateAction, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { UseFieldArrayMove, UseFieldArrayRemove, useFormContext, useWatch } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CardOverview, { CardOverviewReadOnly } from "./card-overview";
import { SpreadForm } from "@/types/spreads";
import TextField from "@/components/form/text-field";
import TextareaField from "@/components/form/textarea-field";
import { ResponsivePanel } from "@/components/layout/responsive-panel";

// ------------ Read-Only Content Component ------------ //

interface SpreadDetailsContentProps {
    cards: Record<"id", string>[];
    selectedCardIndex: number | null;
    setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
    headerActions?: React.ReactNode;
}

export function SpreadDetailsContent({
    cards,
    selectedCardIndex,
    setSelectedCardIndex,
    headerActions,
}: SpreadDetailsContentProps) {
    const { control } = useFormContext<SpreadForm>();
    const name = useWatch({ control, name: "name" });
    const description = useWatch({ control, name: "description" });

    return (
      <div className="flex h-full flex-col gap-5 p-4 overflow-y-auto">
        <div className="flex w-full justify-between items-center gap-8">
          <h3 className="font-display text-base font-bold tracking-tight">Spread Details</h3>
          <div className="flex items-center gap-1">
            {headerActions}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider font-medium">Name</span>
            <p className="text-sm mt-0.5">{name || "Untitled"}</p>
          </div>
          {description && (
            <div>
              <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider font-medium">Description</span>
              <p className="text-sm whitespace-pre-wrap mt-0.5">{description}</p>
            </div>
          )}
        </div>
        <FieldSeparator />
        <CardOverviewReadOnly
          cardCount={cards.length}
          selectedCardIndex={selectedCardIndex}
          setSelectedCardIndex={setSelectedCardIndex}
        />
      </div>
    )
}

// ------------ Editable Content Component ------------ //

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
      <div className="flex h-full flex-col gap-5 p-4 overflow-y-auto">
        <div className="flex w-full justify-between items-center gap-8">
          <h3 className="font-display text-base font-bold tracking-tight">Spread Settings</h3>
          <div className="flex items-center gap-1">
            {headerActions}
          </div>
        </div>
        <form>
          <FieldSet>
            <TextField
              label="Name"
              id="spread-name"
              placeholder="e.g. Celtic Cross, Daily Draw..."
              autoFocus
              error={form.formState.errors.name}
              {...form.register("name")}
            />
            <TextareaField
              label="Description"
              id="spread-description"
              placeholder="What is this spread for? (optional)"
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
    addCard?: () => void;
    remove?: UseFieldArrayRemove;
    move?: UseFieldArrayMove;
    selectedCardIndex: number | null;
    setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
    panelRef: RefObject<PanelImperativeHandle | null>;
    isMobile: boolean;
    isViewMode?: boolean;
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
    isViewMode = false,
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

    const panelTitle = isViewMode ? "Spread Details" : "Spread Settings";

    const collapseHeaderAction = !isMobile && (
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
    );

    return (
      <>
        {hideSettings &&
          <Card className="absolute bottom-5 left-3 py-2 z-10 min-w-[150px] max-w-[350px] shadow-md bg-background/90 backdrop-blur-sm border-border/50">
            <CardContent>
              <div className="flex w-full justify-between items-center gap-8">
                <h3 className="font-display text-sm font-bold tracking-tight">{panelTitle}</h3>
                <div className="flex items-center gap-1">
                  {!isViewMode && addCard && (
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
                      <TooltipContent>Add Position</TooltipContent>
                    </Tooltip>
                  )}
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
          maxSize={480}
          panelRef={spreadSettingsPanelRef}
          onPanelResize={handleResize}
          handlePosition="after"
          hideHandle={hideSettings}
          side="left"
          sheetTitle={panelTitle}
          open={open}
          onOpenChange={onOpenChange}
        >
          {isViewMode ? (
            <SpreadDetailsContent
              cards={cards}
              selectedCardIndex={selectedCardIndex}
              setSelectedCardIndex={setSelectedCardIndex}
              headerActions={collapseHeaderAction}
            />
          ) : (
            <SpreadSettingsContent
              cards={cards}
              addCard={addCard!}
              remove={remove!}
              move={move!}
              selectedCardIndex={selectedCardIndex}
              setSelectedCardIndex={setSelectedCardIndex}
              headerActions={collapseHeaderAction}
            />
          )}
        </ResponsivePanel>
      </>
    )
  }

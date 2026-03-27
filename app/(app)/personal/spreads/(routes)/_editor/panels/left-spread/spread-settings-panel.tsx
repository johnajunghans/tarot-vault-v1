import { Button } from "@/components/ui/button";
import { FieldSeparator, FieldSet } from "@/components/ui/field";
import { Kbd } from "@/components/ui/kbd";
import { PanelLeftIcon, PlusSignIcon } from "hugeicons-react";
import { Dispatch, type RefObject, SetStateAction, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { UseFieldArrayMove, UseFieldArrayRemove, useFormContext, useWatch } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from "@/components/ui/tooltip";
import CardOverview, { CardOverviewReadOnly } from "./card-overview";
import { SpreadForm } from "@/types/spreads";
import TextField from "@/components/form/text-field";
import TextareaField from "@/components/form/textarea-field";
import { ResponsivePanel } from "@/app/(app)/_components/responsive-panel";

const TOOLTIP_DELAY = 500;

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
    isMobile: boolean;
}

export function SpreadSettingsContent({
    cards,
    addCard,
    remove,
    move,
    selectedCardIndex,
    setSelectedCardIndex,
    headerActions,
    isMobile
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
              autoFocus={!isMobile}
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
          cardIds={cards.map((card) => card.id)}
          selectedCardIndex={selectedCardIndex}
          setSelectedCardIndex={setSelectedCardIndex}
          move={move}
          remove={remove}
          addCard={addCard}
          isMobile={isMobile}
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
    const shortcutClassName = "ml-1"

    function handleResize() {
      if (spreadSettingsPanelRef.current) {
        setHideSettings(spreadSettingsPanelRef.current.isCollapsed())
      }
    }

    function handleTogglePanel() {
      if (!spreadSettingsPanelRef.current) return

      if (spreadSettingsPanelRef.current.isCollapsed()) {
        spreadSettingsPanelRef.current.expand()
        return
      }

      spreadSettingsPanelRef.current.collapse()
    }

    const panelTitle = isViewMode ? "Spread Details" : "Spread Settings";
    const panelToggleLabel = hideSettings ? "Show Panel" : "Hide Panel";
    const panelToggleButton = (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleTogglePanel}
      >
        <PanelLeftIcon />
      </Button>
    );

    const spreadDetailsHeaderActions = !isMobile ? (
      <TooltipProvider delay={TOOLTIP_DELAY}>
        <TooltipRoot>
          <TooltipTrigger render={panelToggleButton} />
          <TooltipContent>
            {panelToggleLabel}
            <Kbd className={shortcutClassName}>⌘ H</Kbd>
          </TooltipContent>
        </TooltipRoot>
      </TooltipProvider>
    ) : null;

    const spreadSettingsHeaderActions = !isMobile ? (
      <TooltipProvider delay={TOOLTIP_DELAY}>
        <div className="flex items-center gap-1">
          {!isViewMode && addCard && (
            <TooltipRoot>
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
              <TooltipContent>
                Add Position
                <Kbd className={shortcutClassName}>⌘ J</Kbd>
              </TooltipContent>
            </TooltipRoot>
          )}
          <TooltipRoot>
            <TooltipTrigger render={panelToggleButton} />
            <TooltipContent>
              {panelToggleLabel}
              <Kbd className={shortcutClassName}>⌘ H</Kbd>
            </TooltipContent>
          </TooltipRoot>
        </div>
      </TooltipProvider>
    ) : null;

    return (
      <>
          <Card className={`
              absolute flex h-9 flex-row items-center gap-0 py-0 z-10 top-2 left-2 min-w-[150px] max-w-[350px] shadow-md bg-background/90 backdrop-blur-sm border-border/50 transition-[scale] duration-50
              ${hideSettings ? "scale-100 opacity-100 pointer-events-auto" : "scale-110 opacity-0 pointer-events-none"}
            `}
          >
            <CardContent className="flex flex-1 items-center px-2 py-0">
              <div className="flex w-full justify-between items-center gap-8">
                <h3 className="font-display text-sm font-bold tracking-tight">{panelTitle}</h3>
                <TooltipProvider delay={TOOLTIP_DELAY}>
                  <div className="flex items-center gap-1">
                    {!isViewMode && addCard && (
                      <TooltipRoot>
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
                        <TooltipContent>
                          Add Position
                          <Kbd className={shortcutClassName}>⌘ J</Kbd>
                        </TooltipContent>
                      </TooltipRoot>
                    )}
                    <TooltipRoot>
                      <TooltipTrigger render={panelToggleButton} />
                      <TooltipContent>
                        {panelToggleLabel}
                        <Kbd className={shortcutClassName}>⌘ H</Kbd>
                      </TooltipContent>
                    </TooltipRoot>
                  </div>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        

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
          <div className={isMobile ? "h-full" : "h-full bg-background/85 backdrop-blur-xs"}>
            {isViewMode ? (
              <SpreadDetailsContent
                cards={cards}
                selectedCardIndex={selectedCardIndex}
                setSelectedCardIndex={setSelectedCardIndex}
                headerActions={spreadDetailsHeaderActions}
              />
            ) : (
              <SpreadSettingsContent
                cards={cards}
                addCard={addCard!}
                remove={remove!}
                move={move!}
                selectedCardIndex={selectedCardIndex}
                setSelectedCardIndex={setSelectedCardIndex}
                headerActions={spreadSettingsHeaderActions}
                isMobile={isMobile}
              />
            )}
          </div>
        </ResponsivePanel>
      </>
    )
  }

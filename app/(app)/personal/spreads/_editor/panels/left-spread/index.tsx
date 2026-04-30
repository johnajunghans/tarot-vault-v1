"use client";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from "@/components/ui/tooltip";
import { ResponsivePanel } from "../shared/responsive-panel";
import { PanelLeftIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type Dispatch, type RefObject, type SetStateAction, useEffect } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import type { UseFieldArrayMove, UseFieldArrayRemove } from "react-hook-form";
import SpreadDetailsContent from "./components/spread-details-content";
import SpreadSettingsContent from "./components/spread-settings-content";
import SpreadFloatingToolbar from "./components/spread-floating-toolbar";
import { useSpreadPanelAnimation } from "./hooks/use-spread-panel-animation";

const TOOLTIP_DELAY = 500;

interface SpreadSettingsPanelProps {
  cards: Record<"id", string>[];
  addCard?: () => void;
  remove?: UseFieldArrayRemove;
  move?: UseFieldArrayMove;
  onTextEditStart?: () => void;
  onTextEditEnd?: () => void;
  selectedCardIndex: number | null;
  setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
  panelRef: RefObject<PanelImperativeHandle | null>;
  isMobile: boolean;
  isViewMode?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  togglePanelRef?: RefObject<(() => void) | null>;
}

export default function SpreadSettingsPanel({
  cards,
  addCard,
  remove,
  move,
  onTextEditStart,
  onTextEditEnd,
  selectedCardIndex,
  setSelectedCardIndex,
  panelRef,
  isMobile,
  isViewMode = false,
  open = false,
  onOpenChange,
  togglePanelRef,
}: SpreadSettingsPanelProps) {
  const shortcutClassName = "ml-1";
  const {
    hideSettings,
    toolbarRef,
    panelContentRef,
    handleResize,
    handleTogglePanel,
  } = useSpreadPanelAnimation({
    isMobile,
    open,
    onOpenChange,
    panelRef,
    focusTargetId: isViewMode ? undefined : "spread-name",
  });

  useEffect(() => {
    if (!togglePanelRef) return;

    togglePanelRef.current = handleTogglePanel;

    return () => {
      togglePanelRef.current = null;
    };
  }, [handleTogglePanel, togglePanelRef]);

  const panelTitle = isViewMode ? "Spread Details" : "Spread Settings";
  const panelToggleLabel = hideSettings ? "Show Panel" : "Hide Panel";
  const canAddCard = cards.length < 78;

  const panelToggleButton = (
    <Button variant="ghost" size="icon-sm" onClick={handleTogglePanel}>
      <HugeiconsIcon icon={PanelLeftIcon} />
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
                <Button variant="ghost" size="icon-sm" onClick={addCard} disabled={!canAddCard}>
                  <HugeiconsIcon icon={PlusSignIcon} />
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
      {/* {!isMobile && ( */}
        <div
          ref={toolbarRef}
          className={hideSettings ? "pointer-events-auto" : "pointer-events-none"}
        >
          <SpreadFloatingToolbar
            title={panelTitle}
            onOpenPanel={handleTogglePanel}
            onAddCard={addCard}
            canAddCard={canAddCard}
            showAddCard={!isViewMode}
            isMobile={isMobile}
          />
        </div>
      {/* )} */}

      <ResponsivePanel
        isMobile={isMobile}
        panelId="spread-settings-panel"
        collapsible
        defaultSize="20%"
        minSize={240}
        maxSize={480}
        panelRef={panelRef}
        onPanelResize={handleResize}
        handlePosition="after"
        hideHandle={hideSettings}
        side="left"
        sheetTitle={panelTitle}
        open={open}
        onOpenChange={onOpenChange}
      >
        <div
          ref={panelContentRef}
          className={isMobile ? "h-full" : "h-full bg-background/85 backdrop-blur-xs"}
        >
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
              onTextEditStart={onTextEditStart!}
              onTextEditEnd={onTextEditEnd!}
              selectedCardIndex={selectedCardIndex}
              setSelectedCardIndex={setSelectedCardIndex}
              headerActions={spreadSettingsHeaderActions}
              isMobile={isMobile}
            />
          )}
        </div>
      </ResponsivePanel>
    </>
  );
}

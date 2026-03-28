"use client";

import { ResponsivePanel } from "@/app/(app)/_components/responsive-panel";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from "@/components/ui/tooltip";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type Dispatch, type SetStateAction } from "react";
import type { UseFieldArrayRemove } from "react-hook-form";
import CardDetailsContent from "./components/card-details-content";
import CardSettingsContent from "./components/card-settings-content";
import { useCardSettingsPanel } from "./hooks/use-card-settings-panel";

const TOOLTIP_DELAY = 500;

interface CardSettingsPanelProps {
  cards: Record<"id", string>[];
  selectedCardIndex: number | null;
  setSelectedCardIndex: Dispatch<SetStateAction<number | null>>;
  onRotationChange?: (index: number, value: number) => void;
  remove?: UseFieldArrayRemove;
  isMobile: boolean;
  isViewMode?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDesktopWidthChange?: (panelWidth: number) => void;
  onBeforeDesktopOpen?: (panelWidth: number) => void;
  onAfterDesktopOpen?: (panelWidth: number) => void;
  onBeforeDesktopClose?: (panelWidth: number) => void;
  onAfterDesktopClose?: (panelWidth: number) => void;
}

export default function CardSettingsPanel({
  cards,
  selectedCardIndex,
  setSelectedCardIndex,
  onRotationChange,
  remove,
  isMobile,
  isViewMode = false,
  open = false,
  onOpenChange,
  onDesktopWidthChange,
  onBeforeDesktopOpen,
  onAfterDesktopOpen,
  onBeforeDesktopClose,
  onAfterDesktopClose,
}: CardSettingsPanelProps) {
  const {
    panelRef,
    panelContentRef,
    visibleSelectedCardIndex,
    hideHandle,
    handleResize,
    handleClosePanel,
  } =
    useCardSettingsPanel({
    cards,
    selectedCardIndex,
    setSelectedCardIndex,
    isMobile,
    open,
    onOpenChange,
    focusTargetId: isViewMode ? undefined : "card-name",
    onDesktopWidthChange,
    onBeforeDesktopOpen,
    onAfterDesktopOpen,
    onBeforeDesktopClose,
    onAfterDesktopClose,
    });

  const panelTitle = isViewMode ? "Position Details" : "Position Settings";
  const activeSelectedCardIndex = visibleSelectedCardIndex ?? selectedCardIndex;

  const closeHeaderAction = !isMobile && activeSelectedCardIndex !== null ? (
    <TooltipProvider delay={TOOLTIP_DELAY}>
      <TooltipRoot>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon-sm" onClick={handleClosePanel}>
              <HugeiconsIcon icon={Cancel01Icon} />
            </Button>
          }
        />
        <TooltipContent>
          Close Panel
          <Kbd className="ml-1">⌘ K</Kbd>
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  ) : null;

  return (
    <ResponsivePanel
      isMobile={isMobile}
      panelId="card-settings-panel"
      panelRef={panelRef}
      onPanelResize={handleResize}
      collapsible
      defaultSize="20%"
      minSize={240}
      maxSize={480}
      handlePosition="before"
      hideHandle={hideHandle}
      side="right"
      sheetTitle={panelTitle}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className={isMobile ? "h-full overflow-hidden" : "h-full overflow-hidden bg-background/85 backdrop-blur-xs"}>
        <div ref={panelContentRef} className="h-full will-change-[opacity,transform]">
          {isViewMode ? (
            <CardDetailsContent
            selectedCardIndex={activeSelectedCardIndex}
            headerActions={closeHeaderAction}
          />
        ) : (
          <CardSettingsContent
            cards={cards}
            selectedCardIndex={activeSelectedCardIndex}
            setSelectedCardIndex={setSelectedCardIndex}
            onRotationChange={onRotationChange!}
            remove={remove!}
              headerActions={closeHeaderAction}
              isMobile={isMobile}
            />
          )}
        </div>
      </div>
    </ResponsivePanel>
  );
}

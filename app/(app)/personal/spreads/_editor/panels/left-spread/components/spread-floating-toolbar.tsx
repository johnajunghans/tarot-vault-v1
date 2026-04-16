"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from "@/components/ui/tooltip";
import { PanelLeftIcon, PlusSignIcon, Settings02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const TOOLTIP_DELAY = 500;

interface SpreadFloatingToolbarProps {
  title: string;
  onOpenPanel: () => void;
  onAddCard?: () => void;
  canAddCard?: boolean;
  showAddCard?: boolean;
  isMobile?: boolean;
}

export default function SpreadFloatingToolbar({
  title,
  onOpenPanel,
  onAddCard,
  canAddCard = false,
  showAddCard = false,
  isMobile = false,
}: SpreadFloatingToolbarProps) {
  if (isMobile) {
    return (
      <Card className="pointer-events-auto absolute top-2 left-2 z-10 items-center border-border/50 bg-background/90 py-0 shadow-md backdrop-blur-sm">
        <CardContent className="px-1">
          <div className="flex h-8.5 items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={onOpenPanel}>
              <HugeiconsIcon icon={Settings02Icon} />
            </Button>
            {showAddCard && onAddCard && (
              <Button variant="ghost" size="icon-sm" onClick={onAddCard} disabled={!canAddCard}>
                <HugeiconsIcon icon={PlusSignIcon} />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pointer-events-auto absolute top-2 left-2 z-10 min-w-[150px] max-w-[350px] items-center border-border/50 bg-background/90 py-0 shadow-md backdrop-blur-sm">
      <CardContent className="flex h-10 w-full items-center justify-between gap-8 py-0 pl-3 pr-2">
        <h3 className="truncate font-display text-sm font-bold tracking-tight">{title}</h3>
        <TooltipProvider delay={TOOLTIP_DELAY}>
          <div className="flex items-center gap-1">
            {showAddCard && onAddCard && (
              <TooltipRoot>
                <TooltipTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" onClick={onAddCard} disabled={!canAddCard}>
                      <HugeiconsIcon icon={PlusSignIcon} />
                    </Button>
                  }
                />
                <TooltipContent>
                  Add Position
                  <Kbd className="ml-1">⌘ J</Kbd>
                </TooltipContent>
              </TooltipRoot>
            )}
            <TooltipRoot>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-sm" onClick={onOpenPanel}>
                    <HugeiconsIcon icon={PanelLeftIcon} />
                  </Button>
                }
              />
              <TooltipContent>
                Show Panel
                <Kbd className="ml-1">⌘ H</Kbd>
              </TooltipContent>
            </TooltipRoot>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

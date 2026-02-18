"use client"

import type { RefObject } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";

interface ResponsivePanelProps {
    children: React.ReactNode;

    // Mobile/desktop toggle — caller owns useIsMobile() to ensure stable value
    isMobile: boolean;

    // Sheet props (mobile)
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    side?: "left" | "right" | "top" | "bottom";
    sheetTitle?: string;

    // Panel props (desktop)
    panelId: string;
    collapsible?: boolean;
    defaultSize?: string;
    minSize?: number;
    maxSize?: string;
    panelRef?: RefObject<PanelImperativeHandle | null>;
    onPanelResize?: () => void;

    // Handle props (desktop)
    handlePosition?: "before" | "after";
    hideHandle?: boolean;
}

export function ResponsivePanel({
    children,
    isMobile,
    open = false,
    onOpenChange,
    side = "left",
    sheetTitle,
    panelId,
    collapsible,
    defaultSize,
    minSize,
    maxSize,
    panelRef,
    onPanelResize,
    handlePosition = "after",
    hideHandle = false,
}: ResponsivePanelProps) {

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side={side}>
                    {sheetTitle && <SheetTitle className="sr-only">{sheetTitle}</SheetTitle>}
                    {children}
                </SheetContent>
            </Sheet>
        );
    }

    const handle = (
        <ResizableHandle withHandle className={hideHandle ? "hidden" : ""} />
    );

    return (
        <>
            {handlePosition === "before" && handle}
            <ResizablePanel
                id={panelId}
                collapsible={collapsible}
                defaultSize={defaultSize}
                minSize={minSize}
                maxSize={maxSize}
                panelRef={panelRef}
                onResize={onPanelResize}
            >
                {children}
            </ResizablePanel>
            {handlePosition === "after" && handle}
        </>
    );
}

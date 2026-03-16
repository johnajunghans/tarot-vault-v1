"use client"

import { FormProvider } from "react-hook-form";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { routes } from "@/lib/routes";
import { toast } from "sonner";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import SpreadSettingsPanel from "../_components/spread-settings-panel";
import SpreadCanvas, {
    type SpreadCanvasViewportRequest,
} from "../_components/canvas";
import CardSettingsPanel from "../_components/card-settings-panel";
import ZoomControls from "../_components/canvas/components/zoom-controls";
import { type PanelImperativeHandle, Layout } from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "../../../../_components/confirm-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { PlusSignIcon, Settings02Icon } from "hugeicons-react";
import { Card, CardContent } from "@/components/ui/card";
import { SpreadForm } from "@/types/spreads";
import { useRouter } from "next/navigation";
import { useLayoutDispatch } from "@/components/providers/layout-provider";
import type { ActionDescriptor } from "@/types/layout";
import {
    CANVAS_CENTER,
    getSpreadBounds,
    normalizeCardsToCanvasCenter,
} from "../spread-layout";
import { useSpreadForm } from "../_hooks/use-spread-form";
import { useValidationErrorHandler } from "../_hooks/use-validation-error-handler";
import { mapPositionsForApi } from "../_helpers/map-positions-for-api";

interface PanelWrapperProps {
    defaultLayout: Layout | undefined
    groupId: string
    loadedDraftDate?: number
}

function createDraftTimestamp() {
    const timestamp = Date.now();
    if (typeof window === "undefined") return timestamp;

    let uniqueTimestamp = timestamp;
    while (window.localStorage.getItem(`spread-draft-${uniqueTimestamp}`) !== null) {
        uniqueTimestamp += 1;
    }

    return uniqueTimestamp;
}

export default function PanelWrapper({
    defaultLayout,
    groupId,
    loadedDraftDate,
}: PanelWrapperProps) {
    const emptyCanvasViewportRequest = useMemo<SpreadCanvasViewportRequest>(
        () => ({
            key: "new-spread-empty",
            type: "center-canvas-point",
            point: CANVAS_CENTER,
            zoom: 1,
        }),
        []
    );
    const router = useRouter();
    const [viewportRequest, setViewportRequest] =
        useState<SpreadCanvasViewportRequest | null>(null);
    const isMobile = useIsMobile()

    // ------------ SPREAD FORM ------------ //

    const {
        form,
        cards,
        remove,
        move,
        watchedValues,
        watchedName,
        watchedPositions,
        addCard,
        addCardAt,
        canvasRef,
        cardKeys,
        canvasCards,
        canvasRotationAngles,
        selectedCardIndex,
        setSelectedCardIndex,
        zoomDisplay,
        setZoomDisplay,
        handleCardRotationChange,
        handleCanvasPositionsCommit,
    } = useSpreadForm();

    // ------------ SPREAD DRAFT LOGIC ------------ //

    const [draftDate] = useState(() => loadedDraftDate ?? createDraftTimestamp());
    const draftKey = draftDate ? `spread-draft-${draftDate}` : "";
    const isDiscardingRef = useRef(false);

    useLayoutEffect(() => {
        let nextViewportRequest: SpreadCanvasViewportRequest =
            emptyCanvasViewportRequest;

        if (!loadedDraftDate) {
            const frame = window.requestAnimationFrame(() => {
                setViewportRequest(emptyCanvasViewportRequest);
            });

            return () => window.cancelAnimationFrame(frame);
        }

        const raw = localStorage.getItem(`spread-draft-${loadedDraftDate}`);
        if (!raw) {
            const frame = window.requestAnimationFrame(() => {
                setViewportRequest(emptyCanvasViewportRequest);
            });

            return () => window.cancelAnimationFrame(frame);
        }

        try {
            const draft = JSON.parse(raw) as SpreadForm & { date?: number; numberOfCards?: number };
            const normalizedPositions = normalizeCardsToCanvasCenter(
                (draft.positions ?? []).map(
                    ({ name, description, allowReverse, x, y, r, z }) => ({
                        name,
                        description,
                        allowReverse,
                        x,
                        y,
                        r,
                        z,
                    })
                )
            );
            form.reset({
                name: draft.name ?? "",
                description: draft.description ?? "",
                positions: normalizedPositions,
            });

            const bounds = getSpreadBounds(normalizedPositions);
            nextViewportRequest = bounds
                ? {
                      key: `draft-${loadedDraftDate}-${normalizedPositions.length}`,
                      type: "fit-spread",
                      bounds,
                      maxZoom: 1,
                  }
                : emptyCanvasViewportRequest;
        } catch { /* ignore invalid draft data */ }

        const frame = window.requestAnimationFrame(() => {
            setViewportRequest(nextViewportRequest);
        });

        return () => window.cancelAnimationFrame(frame);
    }, [emptyCanvasViewportRequest, form, loadedDraftDate]);

    useEffect(() => {
        if (isDiscardingRef.current) return;
        if (!watchedValues) return;
        if (form.formState.isDirty) {
            localStorage.setItem(draftKey, JSON.stringify({
                ...watchedValues,
                date: draftDate,
                positions: watchedValues.positions?.map((p, i) => ({ ...p, position: i + 1 })),
                numberOfCards: watchedValues.positions?.length
            }));
        }
    }, [watchedValues, form.formState.isDirty, draftDate, draftKey]);

    // ------------ MOBILE SHEET STATE ------------ //

    const [spreadSheetOpen, setSpreadSheetOpen] = useState(false);

    // ------------ SAVE SPREAD LOGIC ------------ //

    const createSpread = useMutation(api.spreads.create);
    const [isSaving, setIsSaving] = useState(false);
    const spreadSettingsPanelRef = useRef<PanelImperativeHandle | null>(null);

    const onInvalid = useValidationErrorHandler(
        isMobile,
        setSpreadSheetOpen,
        spreadSettingsPanelRef,
    );

    const handleSave = useCallback(() => {
        form.handleSubmit(async (data) => {
            setIsSaving(true);

            try {
                const positions = mapPositionsForApi(data.positions);

                await createSpread({
                    name: data.name,
                    description: data.description,
                    numberOfCards: positions.length,
                    positions,
                });

                localStorage.removeItem(draftKey);
                router.push(routes.personal.spreads.root);
                toast.success("Spread created!");
            } catch (error) {
                toast.error(
                    `Failed to create spread: ${error instanceof Error ? error.message : "Unknown error"}`
                );
                setIsSaving(false);
            }
        }, onInvalid)();
    }, [form, createSpread, router, draftKey, onInvalid]);

    // ------------ DISCARD LOGIC ------------ //

    const [showDiscardDialog, setShowDiscardDialog] = useState(false);

    const handleDiscard = useCallback(() => {
        if (!form.formState.isDirty && !loadedDraftDate) {
            localStorage.removeItem(draftKey)
            router.push(routes.personal.spreads.root);
            return;
        }
        setShowDiscardDialog(true);
    }, [form.formState.isDirty, router, loadedDraftDate, draftKey]);

    const handleConfirmDiscard = useCallback(() => {
        const key = draftKey;
        isDiscardingRef.current = true;
        localStorage.removeItem(key);
        form.reset();
        setShowDiscardDialog(false);
        router.push(routes.personal.spreads.root);
    }, [form, router, draftKey]);

    // ------------ LAYOUT DISPATCH ------------ //

    const { setActions, setTitle, reset } = useLayoutDispatch();
    const isDirty = form.formState.isDirty;

    useEffect(() => {
        setTitle({
            variant: "spread",
            name: watchedName || "New Spread",
            count: watchedPositions?.length ?? 0,
            countUnit: "card",
            badge: "DRAFT",
        })
    }, [watchedName, watchedPositions?.length, setTitle])

    useEffect(() => {
        const items: ActionDescriptor[] = [
            {
                type: "save",
                label: "Save Spread",
                onClick: handleSave,
                disabled: isSaving || (!isDirty && !loadedDraftDate),
                loading: isSaving,
            },
            {
                type: "discard",
                label: "Discard",
                onClick: handleDiscard,
            },
        ];
        if (loadedDraftDate) {
            items.push({
                type: "close",
                label: "Close",
                href: routes.personal.spreads.root,
            });
        }
        setActions(items);
    }, [loadedDraftDate, handleDiscard, handleSave, isSaving, isDirty, setActions]);

    useEffect(() => {
        return () => reset()
    }, [reset])

    return (
        <>
        {/* Main Content */}
        <div className="relative h-full min-h-0 overflow-hidden">
            <FormProvider {...form}>
                <SpreadCanvas
                    ref={canvasRef}
                    cards={canvasCards}
                    cardKeys={cardKeys}
                    rotationAngles={canvasRotationAngles}
                    selectedCardIndex={selectedCardIndex}
                    onCardSelect={setSelectedCardIndex}
                    onCanvasDoubleClick={addCardAt}
                    onPositionsCommit={handleCanvasPositionsCommit}
                    onZoomDisplayChange={setZoomDisplay}
                    viewportRequest={viewportRequest}
                />

                {isMobile ? (
                    <>
                        {/* Floating Toolbar */}
                        <Card className="absolute top-3 left-3 py-2 z-10 shadow-md bg-background/90 backdrop-blur-sm border-border/50">
                            <CardContent>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => setSpreadSheetOpen(true)}
                                    >
                                        <Settings02Icon />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={addCard}
                                        disabled={cards.length >= 78}
                                    >
                                        <PlusSignIcon />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Zoom Controls */}
                        <ZoomControls
                            zoom={zoomDisplay}
                            onZoomIn={() => canvasRef.current?.zoomIn()}
                            onZoomOut={() => canvasRef.current?.zoomOut()}
                            onResetZoom={() => canvasRef.current?.resetZoom()}
                        />

                        {/* Spread Settings (Sheet on mobile via ResponsivePanel) */}
                        <SpreadSettingsPanel
                            isMobile={isMobile}
                            open={spreadSheetOpen}
                            onOpenChange={setSpreadSheetOpen}
                            cards={cards}
                            addCard={addCard}
                            remove={remove}
                            move={move}
                            selectedCardIndex={selectedCardIndex}
                            setSelectedCardIndex={setSelectedCardIndex}
                            panelRef={spreadSettingsPanelRef}
                        />

                        {/* Card Settings (Sheet on mobile via ResponsivePanel) */}
                        <CardSettingsPanel
                            isMobile={isMobile}
                            open={selectedCardIndex !== null}
                            onOpenChange={(open) => {
                                if (!open) setSelectedCardIndex(null);
                            }}
                            cards={cards}
                            selectedCardIndex={selectedCardIndex}
                            setSelectedCardIndex={setSelectedCardIndex}
                            onRotationChange={handleCardRotationChange}
                            remove={remove}
                        />
                    </>
                ) : (
                    <>
                    {/* Layer 2: Panel group overlaid on canvas */}
                    <ResizablePanelGroup
                        id={groupId}
                        orientation="horizontal"
                        defaultLayout={defaultLayout}
                        onLayoutChanged={(layout) => {
                            document.cookie = `${groupId}=${JSON.stringify(layout)}; path=/;`
                        }}
                        className="absolute inset-0 pointer-events-none"
                    >
                    {/* Left Panel — Settings */}
                    <SpreadSettingsPanel
                        isMobile={isMobile}
                        addCard={addCard}
                        remove={remove}
                        move={move}
                        cards={cards}
                        selectedCardIndex={selectedCardIndex}
                        setSelectedCardIndex={setSelectedCardIndex}
                        panelRef={spreadSettingsPanelRef}
                    />

                    {/* Center Spacer — transparent, passes events to canvas */}
                    <ResizablePanel
                        id="spread-canvas-spacer"
                        style={{ pointerEvents: "none" }}
                    >
                        <div className="relative h-full">
                            <ZoomControls
                                zoom={zoomDisplay}
                                onZoomIn={() => canvasRef.current?.zoomIn()}
                                onZoomOut={() => canvasRef.current?.zoomOut()}
                                onResetZoom={() => canvasRef.current?.resetZoom()}
                                className="pointer-events-auto"
                            />
                        </div>
                    </ResizablePanel>

                    {/* Right Panel — Card Details */}
                    <CardSettingsPanel
                        isMobile={isMobile}
                        cards={cards}
                        selectedCardIndex={selectedCardIndex}
                        setSelectedCardIndex={setSelectedCardIndex}
                        onRotationChange={handleCardRotationChange}
                        remove={remove}
                    />

                    </ResizablePanelGroup>
                    </>
                )}
            </FormProvider>
        </div>

        {/* Discard Spread Dialog */}
        <ConfirmDialog
            open={showDiscardDialog}
            onOpenChange={setShowDiscardDialog}
            description="You have unsaved changes. Save as a draft to continue later, or discard entirely."
            cancelLabel="Keep editing"
            secondaryLabel="Save as draft"
            secondaryHref={routes.personal.spreads.root}
            confirmLabel="Discard"
            onConfirm={handleConfirmDiscard}
        />
        </>
    )
}

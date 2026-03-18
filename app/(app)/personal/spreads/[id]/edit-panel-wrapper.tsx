"use client"

import { FormProvider } from "react-hook-form";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { routes } from "@/lib/routes";
import { toast } from "sonner";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import SpreadSettingsPanel from "../_components/editor/spread-settings-panel";
import SpreadCanvas, {
    type SpreadCanvasViewportRequest,
} from "../_canvas";
import CardSettingsPanel from "../_components/editor/card-settings-panel";
import ZoomControls from "../_canvas/components/zoom-controls";
import { type PanelImperativeHandle, Layout } from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import ConfirmDialog from "../../../../_components/confirm-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { PlusSignIcon, Settings02Icon } from "hugeicons-react";
import { Card, CardContent } from "@/components/ui/card";
import { SpreadDB, SpreadForm } from "@/types/spreads";
import { useRouter } from "next/navigation";
import { useLayoutDispatch } from "@/components/providers/layout-provider";
import type { ActionDescriptor, BreadcrumbDescriptor } from "@/types/layout";
import Link from "next/link";
import {
    CANVAS_CENTER,
    getSpreadBounds,
    normalizeCardsToCanvasCenter,
} from "../_lib/layout";
import { useSpreadForm } from "../_hooks/use-spread-form";
import { useValidationErrorHandler } from "../_hooks/use-validation-error-handler";
import { mapPositionsForApi } from "../_lib/map-positions-for-api";

interface EditPanelWrapperProps {
    spreadId: Id<"spreads">
    defaultLayout: Layout | undefined
    groupId: string
    mode: "view" | "edit"
}

const VIEW_BREADCRUMBS: BreadcrumbDescriptor[] = [
    { href: routes.personal.root, label: "Personal" },
    { href: routes.personal.spreads.root, label: "Spreads" },
    { href: "#", label: "View Spread" },
]

const EDIT_BREADCRUMBS: BreadcrumbDescriptor[] = [
    { href: routes.personal.root, label: "Personal" },
    { href: routes.personal.spreads.root, label: "Spreads" },
    { href: "#", label: "Edit Spread" },
]

function toSpreadFormValues(spread: Pick<SpreadDB, "name" | "description" | "positions">): SpreadForm {
    return {
        name: spread.name,
        description: spread.description ?? "",
        positions: spread.positions.map(({ name, description, allowReverse, x, y, r, z }) => ({
            name, description, allowReverse, x, y, r, z,
        })),
    };
}

export default function EditPanelWrapper({
    spreadId,
    defaultLayout,
    groupId,
    mode,
}: EditPanelWrapperProps) {
    const emptyCanvasViewportRequest = useMemo<SpreadCanvasViewportRequest>(
        () => ({
            key: `spread-${spreadId}-empty`,
            type: "center-canvas-point",
            point: CANVAS_CENTER,
            zoom: 1,
        }),
        [spreadId]
    );
    const isViewMode = mode === "view";
    const router = useRouter();
    const [viewportRequest, setViewportRequest] =
        useState<SpreadCanvasViewportRequest | null>(null);
    const isMobile = useIsMobile()

    // ------------ FETCH SPREAD DATA ------------ //

    const spread = useQuery(api.spreads.getById, { _id: spreadId });

    // ------------ SPREAD FORM ------------ //

    const {
        form,
        cards,
        remove,
        move,
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
        minZoomDisplay,
        setMinZoomDisplay,
        handleCardRotationChange,
        handleCanvasPositionsCommit,
    } = useSpreadForm();

    // ------------ POPULATE FORM FROM DB ------------ //

    const hasReset = useRef(false);
    const initialValuesRef = useRef<SpreadForm | null>(null);

    useLayoutEffect(() => {
        if (hasReset.current || !spread) return;
        const initialValues = toSpreadFormValues(spread);
        const normalizedPositions = normalizeCardsToCanvasCenter(
            initialValues.positions
        );
        const normalizedValues = {
            ...initialValues,
            positions: normalizedPositions,
        };
        const bounds = getSpreadBounds(normalizedPositions);
        initialValuesRef.current = normalizedValues;
        hasReset.current = true;
        form.reset(normalizedValues);
        setViewportRequest(
            bounds
                ? {
                      key: `spread-${spreadId}-${spread._creationTime}-${mode}`,
                      type: "fit-spread",
                      bounds,
                      maxZoom: 1,
                  }
                : emptyCanvasViewportRequest
        );
    }, [emptyCanvasViewportRequest, form, mode, spread, spreadId]);

    // ------------ MOBILE SHEET STATE ------------ //

    const [spreadSheetOpen, setSpreadSheetOpen] = useState(false);

    // ------------ SAVE SPREAD LOGIC ------------ //

    const updateSpread = useMutation(api.spreads.update);
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

                await updateSpread({
                    _id: spreadId,
                    name: data.name,
                    description: data.description,
                    numberOfCards: positions.length,
                    positions,
                });

                initialValuesRef.current = data;
                form.reset(data);
                toast.success("Spread updated!");
                router.push(routes.personal.spreads.root);
            } catch (error) {
                toast.error(
                    `Failed to update spread: ${error instanceof Error ? error.message : "Unknown error"}`
                );
            } finally {
                setIsSaving(false);
            }
        }, onInvalid)();
    }, [form, updateSpread, spreadId, router, onInvalid]);

    // ------------ DELETE SPREAD LOGIC ------------ //

    const removeSpread = useMutation(api.spreads.remove);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = useCallback(async () => {
        setIsDeleting(true);
        try {
            await removeSpread({ _id: spreadId });
            toast.success("Spread deleted");
            router.push(routes.personal.spreads.root);
        } catch (error) {
            toast.error(
                `Failed to delete spread: ${error instanceof Error ? error.message : "Unknown error"}`
            );
            setIsDeleting(false);
        }
    }, [removeSpread, spreadId, router]);

    // ------------ CANCEL / DISCARD LOGIC ------------ //

    const [showDiscardDialog, setShowDiscardDialog] = useState(false);

    const viewUrl = routes.personal.spreads.id(spreadId, "view");

    const handleCancel = useCallback(() => {
        if (!form.formState.isDirty) {
            router.push(viewUrl);
            return;
        }
        setShowDiscardDialog(true);
    }, [form.formState.isDirty, router, viewUrl]);

    const handleConfirmDiscard = useCallback(() => {
        form.reset(initialValuesRef.current ?? undefined);
        setSelectedCardIndex(null);
        setSpreadSheetOpen(false);
        setShowDiscardDialog(false);
        router.push(viewUrl);
    }, [form, router, setSelectedCardIndex, viewUrl]);

    // ------------ LAYOUT DISPATCH ------------ //

    const { setActions, setTitle, setBreadcrumbs, reset } = useLayoutDispatch();
    const isDirty = form.formState.isDirty;

    useEffect(() => {
        setBreadcrumbs({
            mode: "custom",
            items: isViewMode ? VIEW_BREADCRUMBS : EDIT_BREADCRUMBS,
        })
    }, [isViewMode, setBreadcrumbs])

    useEffect(() => {
        setTitle({
            variant: "spread",
            name: watchedName || "Untitled Spread",
            count: watchedPositions?.length ?? 0,
            countUnit: "position",
        })
    }, [watchedName, watchedPositions?.length, setTitle])

    const actions = useMemo<ActionDescriptor[] | null>(() => {
        if (!spread) return null;

        if (isViewMode) {
            return [
                {
                    type: "edit",
                    label: "Edit Spread",
                    href: routes.personal.spreads.id(spreadId, "edit"),
                },
                {
                    type: "close",
                    label: "Close",
                    href: routes.personal.spreads.root,
                },
            ];
        }

        return [
            {
                type: "save",
                label: "Save Changes",
                onClick: handleSave,
                disabled: isSaving || !isDirty,
                loading: isSaving,
            },
            {
                type: "delete",
                label: "Delete",
                onClick: () => setShowDeleteDialog(true),
            },
            {
                type: "cancel",
                label: "Cancel",
                onClick: handleCancel,
            },
        ];
    }, [spread, isViewMode, handleCancel, handleSave, isSaving, isDirty, spreadId]);

    useEffect(() => {
        setActions(actions);
    }, [actions, setActions]);

    useEffect(() => {
        return () => reset()
    }, [reset])

    // ------------ LOADING / NOT FOUND ------------ //

    if (spread === undefined) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center">
                <Spinner className="size-6" />
            </div>
        );
    }

    if (spread === null) {
        return (
            <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3">
                <p className="text-muted-foreground font-display text-lg">Spread not found</p>
                <Button variant="outline">
                    <Link href={routes.personal.spreads.root}>Back to spreads</Link>
                </Button>
            </div>
        );
    }

    // ------------ SHARED PANEL PROPS ------------ //

    const spreadPanelProps = {
        isMobile,
        isViewMode,
        cards,
        selectedCardIndex,
        setSelectedCardIndex,
        panelRef: spreadSettingsPanelRef,
        ...(isViewMode ? {} : { addCard, remove, move }),
    };

    const cardPanelProps = {
        isMobile,
        isViewMode,
        cards,
        selectedCardIndex,
        setSelectedCardIndex,
        ...(isViewMode ? {} : { remove, cardCount: cards.length }),
    };

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
                    onCanvasDoubleClick={isViewMode ? undefined : addCardAt}
                    isViewMode={isViewMode}
                    onPositionsCommit={handleCanvasPositionsCommit}
                    onZoomDisplayChange={setZoomDisplay}
                    onZoomBoundsChange={setMinZoomDisplay}
                    viewportRequest={viewportRequest}
                />

                {isMobile ? (
                    <>
                        {/* Floating Toolbar */}
                        <Card className="absolute top-3 left-3 py-2 z-10 shadow-md bg-background/90 backdrop-blur-sm border-border/50 pointer-events-auto">
                            <CardContent>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => setSpreadSheetOpen(true)}
                                    >
                                        <Settings02Icon />
                                    </Button>
                                    {!isViewMode && (
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={addCard}
                                            disabled={cards.length >= 78}
                                        >
                                            <PlusSignIcon />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Zoom Controls */}
                        <ZoomControls
                            zoom={zoomDisplay}
                            minZoom={minZoomDisplay}
                            onZoomIn={() => canvasRef.current?.zoomIn()}
                            onZoomOut={() => canvasRef.current?.zoomOut()}
                            onResetZoom={() => canvasRef.current?.resetZoom()}
                        />

                        {/* Spread Settings */}
                        <SpreadSettingsPanel
                            {...spreadPanelProps}
                            open={spreadSheetOpen}
                            onOpenChange={setSpreadSheetOpen}
                        />

                        {/* Card Settings */}
                        <CardSettingsPanel
                            {...cardPanelProps}
                            onRotationChange={handleCardRotationChange}
                            open={selectedCardIndex !== null}
                            onOpenChange={(open) => {
                                if (!open) setSelectedCardIndex(null);
                            }}
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
                    <SpreadSettingsPanel {...spreadPanelProps} />

                    {/* Center Spacer — transparent, passes events to canvas */}
                    <ResizablePanel
                        id="spread-canvas-spacer"
                        style={{ pointerEvents: "none" }}
                    >
                        <div className="relative h-full">
                            <ZoomControls
                                zoom={zoomDisplay}
                                minZoom={minZoomDisplay}
                                onZoomIn={() => canvasRef.current?.zoomIn()}
                                onZoomOut={() => canvasRef.current?.zoomOut()}
                                onResetZoom={() => canvasRef.current?.resetZoom()}
                                className="pointer-events-auto"
                            />
                        </div>
                    </ResizablePanel>

                    <CardSettingsPanel
                        {...cardPanelProps}
                        onRotationChange={handleCardRotationChange}
                    />

                    </ResizablePanelGroup>
                    </>
                )}
            </FormProvider>
        </div>

        {/* Dialogs (edit mode only) */}
        {!isViewMode && (
            <>
                <ConfirmDialog
                    open={showDiscardDialog}
                    onOpenChange={setShowDiscardDialog}
                    title="Discard changes?"
                    description="Your edits haven't been saved. Are you sure you want to leave?"
                    cancelLabel="Keep editing"
                    confirmLabel="Discard"
                    onConfirm={handleConfirmDiscard}
                />
                <ConfirmDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    title="Delete this spread?"
                    description="This spread and all its positions will be permanently deleted. This cannot be undone."
                    cancelLabel="Keep it"
                    confirmLabel="Delete"
                    onConfirm={handleConfirmDelete}
                    isConfirming={isDeleting}
                />
            </>
        )}
        </>
    )
}

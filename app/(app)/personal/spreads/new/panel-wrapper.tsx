"use client"

import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { spreadSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
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
import ZoomControls from "../_components/zoom-controls";
import { type PanelImperativeHandle, Layout } from "react-resizable-panels";
import { generateCardAt } from "../utils"
import { Button } from "@/components/ui/button";
import { FieldErrors } from "react-hook-form";
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
    CARD_HEIGHT,
    CARD_SPACING_X,
    CARD_WIDTH,
    getSpreadBounds,
    normalizeCardsToCanvasCenter,
} from "../spread-layout";
import {
    normalizeRotationForStorage,
    reconcileContinuousRotations,
    resolveContinuousRotation,
} from "../rotation";

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
    const emptyCanvasViewportRequest: SpreadCanvasViewportRequest = {
        key: "new-spread-empty",
        type: "center-canvas-point",
        point: CANVAS_CENTER,
        zoom: 1,
    };
    const router = useRouter();
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
    const [zoom, setZoom] = useState(1);
    const [viewportRequest, setViewportRequest] =
        useState<SpreadCanvasViewportRequest | null>(emptyCanvasViewportRequest);
    const isMobile = useIsMobile()

    // ------------ SPREAD FORM ------------ //

    const form = useForm<SpreadForm>({
        resolver: zodResolver(spreadSchema),
        defaultValues: {
        name: "",
        description: "",
        positions: []
        }
    });

    const { fields: cards, append, remove, move } = useFieldArray({
        control: form.control,
        name: "positions"
    });

    // ------------ SPREAD DRAFT LOGIC ------------ //

    const [draftDate] = useState(() => loadedDraftDate ?? createDraftTimestamp());
    const draftKey = draftDate ? `spread-draft-${draftDate}` : "";
    const isDiscardingRef = useRef(false);

    useEffect(() => {
        if (!loadedDraftDate) return;
        const raw = localStorage.getItem(`spread-draft-${loadedDraftDate}`);
        if (!raw) return;
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
            const frame = window.requestAnimationFrame(() => {
                setViewportRequest(
                    bounds
                        ? {
                              key: `draft-${loadedDraftDate}-${normalizedPositions.length}`,
                              type: "fit-spread",
                              bounds,
                              maxZoom: 1,
                          }
                        : emptyCanvasViewportRequest
                );
            });

            return () => window.cancelAnimationFrame(frame);
        } catch { /* ignore invalid draft data */ }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const watchedValues = useWatch({ control: form.control });

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

    // ------------ ADD CARD ------------ //

    const addCard = useCallback(() => {
        const nextIndex = cards.length;
        const lastCard = nextIndex > 0 ? form.getValues(`positions.${nextIndex - 1}`) : null;
        const newCard =
            lastCard
                ? generateCardAt(lastCard.x + CARD_SPACING_X, lastCard.y)
                : generateCardAt(
                      CANVAS_CENTER.x - CARD_WIDTH / 2,
                      CANVAS_CENTER.y - CARD_HEIGHT / 2
                  );
        append(newCard, { focusName: `positions.${nextIndex}.name` });
        setSelectedCardIndex(nextIndex);
    }, [append, cards.length, form]);

    const addCardAt = useCallback((x: number, y: number) => {
        if (cards.length >= 78) return;
        const newCard = generateCardAt(x, y);
        append(newCard);
        setSelectedCardIndex(cards.length);
    }, [cards.length, append, setSelectedCardIndex]);

    // ------------ APP TOPBAR LOGIC ------------ //

    const watchedName = watchedValues?.name;
    const watchedPositions = watchedValues?.positions;
    const [cardRotations, setCardRotations] = useState<Record<string, number>>(
        {}
    );
    const cardRotationsRef = useRef<Record<string, number>>({});
    const canvasCards = (watchedPositions ?? []).map((card) => ({
        name: card.name ?? "",
        description: card.description,
        allowReverse: card.allowReverse,
        x: card.x ?? 0,
        y: card.y ?? 0,
        r: card.r ?? 0,
        z: card.z ?? 0,
    }));
    const canvasRotationAngles = cards.map(
        ({ id }, index) => cardRotations[id] ?? canvasCards[index]?.r ?? 0
    );

    useEffect(() => {
        const nextRotations = reconcileContinuousRotations(
            cards.map(({ id }) => id),
            (watchedPositions ?? []).map((card) => card.r ?? 0),
            cardRotationsRef.current
        );

        const hasChanged =
            Object.keys(nextRotations).length !==
                Object.keys(cardRotationsRef.current).length ||
            Object.entries(nextRotations).some(
                ([cardId, rotation]) =>
                    cardRotationsRef.current[cardId] !== rotation
            );

        if (!hasChanged) return;

        cardRotationsRef.current = nextRotations;
        setCardRotations(nextRotations);
    }, [cards, watchedPositions]);

    const handleCardRotationChange = useCallback(
        (index: number, nextValue: number) => {
            const cardId = cards[index]?.id;
            if (!cardId) return;

            const currentStoredRotation =
                form.getValues(`positions.${index}.r`) ?? 0;
            const previousActualRotation =
                cardRotationsRef.current[cardId] ??
                normalizeRotationForStorage(currentStoredRotation);
            const nextActualRotation = resolveContinuousRotation(
                nextValue,
                previousActualRotation
            );
            const nextStoredRotation = normalizeRotationForStorage(nextValue);
            const nextRotations = {
                ...cardRotationsRef.current,
                [cardId]: nextActualRotation,
            };

            cardRotationsRef.current = nextRotations;
            setCardRotations(nextRotations);
            form.setValue(`positions.${index}.r`, nextStoredRotation, {
                shouldDirty: true,
            });
        },
        [cards, form]
    );

    // ------------ MOBILE SHEET STATE ------------ //

    const [spreadSheetOpen, setSpreadSheetOpen] = useState(false);

    // ------------ SAVE SPREAD LOGIC ------------ //

    const createSpread = useMutation(api.spreads.create);
    const [isSaving, setIsSaving] = useState(false);
    const spreadSettingsPanelRef = useRef<PanelImperativeHandle | null>(null);

    const handleSave = useCallback(() => {
        const onInvalid = (errors: FieldErrors<SpreadForm>) => {
            if (errors.name) {
                toast.error("Give your spread a name", {
                    description: errors.name.message,
                });
            }
            if (errors.description) {
                toast.error("Invalid description", {
                    description: errors.description.message,
                });
            }
            if (errors.positions) {
                toast.error("Card issues", {
                    description: "One or more cards need attention.",
                });
            }

            if (errors.name || errors.description) {
                if (isMobile) {
                    setSpreadSheetOpen(true);
                } else {
                    const panel = spreadSettingsPanelRef.current;
                    if (panel?.isCollapsed()) {
                        panel.expand();
                    }
                }
            }
        };

        form.handleSubmit(async (data) => {
            setIsSaving(true);

            try {
                const positions = data.positions.map((card, index) => ({
                    position: index + 1,
                    name: card.name,
                    description: card.description,
                    allowReverse: card.allowReverse,
                    x: card.x,
                    y: card.y,
                    r: card.r,
                    z: card.z,
                }));

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
    }, [form, createSpread, router, isMobile, draftKey]);

    // ------------ DELETE SPREAD MODAL LOGIC ------------ //

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

    // Title effect
    useEffect(() => {
        setTitle({
            variant: "spread",
            name: watchedName || "New Spread",
            count: watchedPositions?.length ?? 0,
            countUnit: "card",
            badge: "DRAFT",
        })
    }, [watchedName, watchedPositions?.length, setTitle])

    // Actions effect
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

    // Cleanup on unmount
    useEffect(() => {
        return () => reset()
    }, [reset])

    return (
        <>
        {/* Main Content */}
        <div className="relative h-full min-h-0 overflow-hidden">
            <FormProvider {...form}>
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
                            zoom={zoom}
                            onZoomChange={setZoom}
                        />

                        {/* Full Canvas */}
                        <SpreadCanvas
                            cards={canvasCards}
                            cardKeys={cards.map(({ id }) => id)}
                            rotationAngles={canvasRotationAngles}
                            selectedCardIndex={selectedCardIndex}
                            onCardSelect={setSelectedCardIndex}
                            onCanvasDoubleClick={addCardAt}
                            zoom={zoom}
                            onZoomChange={setZoom}
                            viewportRequest={viewportRequest}
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
                    {/* Layer 1: Canvas fills entire area */}
                    <SpreadCanvas
                        cards={canvasCards}
                        cardKeys={cards.map(({ id }) => id)}
                        rotationAngles={canvasRotationAngles}
                        selectedCardIndex={selectedCardIndex}
                        onCardSelect={setSelectedCardIndex}
                        onCanvasDoubleClick={addCardAt}
                        zoom={zoom}
                        onZoomChange={setZoom}
                        viewportRequest={viewportRequest}
                    />

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
                                zoom={zoom}
                                onZoomChange={setZoom}
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
            // title="Hold yer horses, partner."
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

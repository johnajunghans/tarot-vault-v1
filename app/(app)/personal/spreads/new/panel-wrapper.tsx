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
import SpreadCanvas from "../_components/canvas";
import CardSettingsPanel from "../_components/card-settings-panel";
import { type PanelImperativeHandle, Layout } from "react-resizable-panels";
import { generateCard, generateCardAt } from "../utils"
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
    const router = useRouter();
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
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
            form.reset({
                name: draft.name ?? "",
                description: draft.description ?? "",
                positions: (draft.positions ?? []).map(({ name, description, allowReverse, x, y, r, z }) => ({
                    name, description, allowReverse, x, y, r, z,
                })),
            });
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
        const newCard = generateCard(cards.length);
        append(newCard, { focusName: `positions.${selectedCardIndex}.name` });
        setSelectedCardIndex(cards.length);
    }, [cards.length, append, selectedCardIndex]);

    const addCardAt = useCallback((x: number, y: number) => {
        if (cards.length >= 78) return;
        const newCard = generateCardAt(x, y);
        append(newCard);
        setSelectedCardIndex(cards.length);
    }, [cards.length, append, setSelectedCardIndex]);

    // ------------ APP TOPBAR LOGIC ------------ //

    const watchedName = watchedValues?.name;
    const watchedPositions = watchedValues?.positions;

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
                disabled: isSaving || !isDirty,
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
        <div className="h-app-content relative">
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

                        {/* Full Canvas */}
                        <SpreadCanvas
                            cards={cards}
                            selectedCardIndex={selectedCardIndex}
                            onCardSelect={setSelectedCardIndex}
                            onCanvasDoubleClick={addCardAt}
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
                            remove={remove}
                        />
                    </>
                ) : (
                    <>
                    {/* Layer 1: Canvas fills entire area */}
                    <SpreadCanvas
                        cards={cards}
                        selectedCardIndex={selectedCardIndex}
                        onCardSelect={setSelectedCardIndex}
                        onCanvasDoubleClick={addCardAt}
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
                    />

                    {/* Right Panel — Card Details */}
                    <CardSettingsPanel
                        isMobile={isMobile}
                        cards={cards}
                        selectedCardIndex={selectedCardIndex}
                        setSelectedCardIndex={setSelectedCardIndex}
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

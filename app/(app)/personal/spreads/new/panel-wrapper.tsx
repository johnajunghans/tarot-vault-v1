"use client"

import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
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
import AppTopbar from "@/components/layout/app-topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { FieldErrors } from "react-hook-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Cancel01Icon, Delete02Icon, PlusSignIcon, Settings02Icon } from "hugeicons-react";
import { Card, CardContent } from "@/components/ui/card";
import { SpreadForm } from "@/types/spreads";

interface PanelWrapperProps {
    defaultLayout: Layout | undefined
    groupId: string
    loadedDraftDate?: number
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

    const draftDate = useRef(loadedDraftDate ?? Date.now());
    const draftKey = draftDate.current ? `spread-draft-${draftDate.current}` : ""
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

    useEffect(() => {
        const subscription = form.watch((values) => {
            if (isDiscardingRef.current) return;
            if (form.formState.isDirty) {
                localStorage.setItem(draftKey, JSON.stringify({
                    ...values,
                    date: draftDate.current,
                    positions: values.positions?.map((p, i) => ({ ...p, position: i + 1 })),
                    numberOfCards: values.positions?.length
                }));
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);

    // ------------ ADD CARD ------------ //

    const addCard = useCallback(() => {
        const newCard = generateCard(cards.length);
        append(newCard, { focusName: `positions.${selectedCardIndex}.name` });
        setSelectedCardIndex(cards.length);
    }, [cards.length, append, selectedCardIndex, setSelectedCardIndex]);

    const addCardAt = useCallback((x: number, y: number) => {
        if (cards.length >= 78) return;
        const newCard = generateCardAt(x, y);
        append(newCard);
        setSelectedCardIndex(cards.length);
    }, [cards.length, append, setSelectedCardIndex]);

    // ------------ APP TOPBAR LOGIC ------------ //

    const watchedName = form.watch("name");
    const watchedPositions = form.watch("positions");

    const spreadTitle = watchedName || "New Spread";
    const cardCount = `${watchedPositions?.length ?? 0} card${(watchedPositions?.length ?? 0) !== 1 ? "s" : ""}`;

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
    }, [form, createSpread, router, isMobile]);

    // ------------ DELETE SPREAD MODAL LOGIC ------------ //

    const [showDiscardDialog, setShowDiscardDialog] = useState(false);

    const handleDiscard = useCallback(() => {
        if (!form.formState.isDirty && !loadedDraftDate) {
            localStorage.removeItem(draftKey)
            router.push(routes.personal.spreads.root);
            return;
        }
        setShowDiscardDialog(true);
    }, [form.formState.isDirty, router]);

    const handleClose = useCallback(() => {
        router.push(routes.personal.spreads.root);
    }, [router]);

    const handleSaveAsDraft = useCallback(() => {
        setShowDiscardDialog(false);
        router.push(routes.personal.spreads.root);
    }, [router]);

    const handleConfirmDiscard = useCallback(() => {
        const key = draftKey;
        isDiscardingRef.current = true;
        localStorage.removeItem(key);
        form.reset();
        setShowDiscardDialog(false);
        router.push(routes.personal.spreads.root);
    }, [form, router]);


    return (
        <>
        {/* App Topbar */}
        <AppTopbar
            centerTitle={
                <>
                    <span className="font-display font-bold text-foreground text-sm lg:text-base truncate max-w-[120px] sm:max-w-[280px] md:max-w-[160px] lg:max-w-[280px]">{spreadTitle}</span>
                    {!isMobile && <>
                        <Separator orientation="vertical" />
                        <span className="text-muted-foreground text-xs lg:text-sm text-nowrap">{cardCount}</span>
                    </>}
                    <Badge variant="secondary" className="text-[10px] font-medium">DRAFT</Badge>
                </>
            }
            rightButtonGroup={
                <>
                    {loadedDraftDate ? (
                        <>
                            <Button type="button" variant="ghost" size={isMobile ? "icon" : "default"} onClick={handleClose}>
                                {isMobile ? <Cancel01Icon /> : <span className="text-xs lg:text-sm">Close</span> }
                            </Button>
                            <Button type="button" variant="destructive" size={isMobile ? "icon" : "default"} onClick={handleDiscard}>
                                {isMobile ? <Delete02Icon /> : <span className="text-xs lg:text-sm">Discard</span> }
                            </Button>
                            <Button type="button" variant="default" disabled={isSaving || !form.formState.isDirty} onClick={handleSave} className="bg-gold hover:bg-gold/90 text-background font-semibold">
                                {isSaving && <Spinner />}
                                <span className="text-xs lg:text-sm">{isMobile ? "Save" : "Save Spread"}</span>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button type="button" variant="ghost" size={isMobile ? "icon" : "default"} onClick={handleDiscard}>
                                {isMobile ? <Delete02Icon /> : <span className="text-xs lg:text-sm">Discard</span> }
                            </Button>
                            <Button type="button" variant="default" disabled={isSaving || !form.formState.isDirty} onClick={handleSave} className="bg-gold hover:bg-gold/90 text-background font-semibold">
                                {isSaving && <Spinner />}
                                <span className="text-xs lg:text-sm">{isMobile ? "Save" : "Save Spread"}</span>
                            </Button>
                        </>
                    )}
                </>
            }
        />

        {/* Main Content */}
        <div className="h-app-content relative">
            <FormProvider {...form}>
                {isMobile ? (
                    <>
                        {/* Floating Toolbar */}
                        <Card className="absolute bottom-3 left-3 py-2 z-10 shadow-md bg-background/90 backdrop-blur-sm border-border/50">
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
                            cardCount={cards.length}
                        />
                    </>
                ) : (
                    <ResizablePanelGroup
                        id={groupId}
                        orientation="horizontal"
                        defaultLayout={defaultLayout}
                        onLayoutChanged={(layout) => {
                            document.cookie = `${groupId}=${JSON.stringify(layout)}; path=/;`
                        }}
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

                    {/* Center Panel — Canvas */}
                    <ResizablePanel
                        id="spread-canvas-panel"
                    >
                        <SpreadCanvas
                        cards={cards}
                        selectedCardIndex={selectedCardIndex}
                        onCardSelect={setSelectedCardIndex}
                        onCanvasDoubleClick={addCardAt}
                        />
                    </ResizablePanel>

                    {/* Right Panel — Card Details */}
                    <CardSettingsPanel
                        isMobile={isMobile}
                        cards={cards}
                        selectedCardIndex={selectedCardIndex}
                        setSelectedCardIndex={setSelectedCardIndex}
                        remove={remove}
                        cardCount={cards.length}
                    />

                    </ResizablePanelGroup>
                )}
            </FormProvider>
        </div>

        {/* Discard Spread Dialog */}
        <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-display">Discard this spread?</DialogTitle>
                    <DialogDescription>
                        You have unsaved changes. Save as a draft to continue later, or discard entirely.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-between">
                    <Button variant="outline" onClick={() => setShowDiscardDialog(false)}>
                        Keep editing
                    </Button>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                        <Button variant="secondary" onClick={handleSaveAsDraft}>
                            Save as draft
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDiscard}>
                            Discard
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}

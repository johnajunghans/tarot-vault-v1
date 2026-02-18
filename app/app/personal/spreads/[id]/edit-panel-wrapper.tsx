"use client"

import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { spreadSchema } from "../spread-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import SpreadSettingsPanel from "../spread-settings-panel";
import SpreadCanvas from "../canvas";
import CardSettingsPanel from "../card-settings-panel";
import { type PanelImperativeHandle, Layout } from "react-resizable-panels";
import { generateCard } from "../spread-functions";
import AppTopbar from "@/components/app/app-topbar";
import { Button } from "@/components/ui/button";
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
import { Cancel01Icon, PlusSignIcon, Settings02Icon } from "hugeicons-react";
import { Card, CardContent } from "@/components/ui/card";
import { SpreadForm } from "@/types/spreads";

interface EditPanelWrapperProps {
    spreadId: Id<"spreads">
    defaultLayout: Layout | undefined
    groupId: string
}

const EDIT_BREADCRUMBS = [
    { href: "/app/personal", label: "Personal", isLast: false },
    { href: "/app/personal/spreads", label: "Spreads", isLast: false },
    { href: "#", label: "Edit Spread", isLast: true },
]

export default function EditPanelWrapper({
    spreadId,
    defaultLayout,
    groupId,
}: EditPanelWrapperProps) {
    const router = useRouter();
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
    const isMobile = useIsMobile()

    // ------------ FETCH SPREAD DATA ------------ //

    const spread = useQuery(api.tables.spreads.getById, { _id: spreadId });

    // ------------ SPREAD FORM ------------ //

    const form = useForm<SpreadForm>({
        resolver: zodResolver(spreadSchema),
        defaultValues: {
            name: "",
            description: "",
            positions: [generateCard(0)]
        }
    });

    const { fields: cards, append, remove, move } = useFieldArray({
        control: form.control,
        name: "positions"
    });

    // ------------ POPULATE FORM FROM DB ------------ //

    const hasReset = useRef(false);

    useEffect(() => {
        if (hasReset.current || !spread) return;
        hasReset.current = true;
        form.reset({
            name: spread.name,
            description: spread.description ?? "",
            positions: spread.positions.map(({ name, description, allowReverse, x, y, r, z }) => ({
                name, description, allowReverse, x, y, r, z,
            })),
        });
    }, [spread, form]);

    // ------------ ADD CARD ------------ //

    const addCard = useCallback(() => {
        const newCard = generateCard(cards.length);
        append(newCard, { focusName: `positions.${selectedCardIndex}.name` });
        setSelectedCardIndex(cards.length);
    }, [cards.length, append, selectedCardIndex, setSelectedCardIndex]);

    // ------------ APP TOPBAR LOGIC ------------ //

    const watchedName = form.watch("name");
    const watchedPositions = form.watch("positions");

    const spreadTitle = watchedName || "Untitled Spread";
    const cardCount = `${watchedPositions?.length ?? 0}-Card`;

    // ------------ MOBILE SHEET STATE ------------ //

    const [spreadSheetOpen, setSpreadSheetOpen] = useState(false);

    // ------------ SAVE SPREAD LOGIC ------------ //

    const updateSpread = useMutation(api.tables.spreads.update);
    const [isSaving, setIsSaving] = useState(false);
    const spreadSettingsPanelRef = useRef<PanelImperativeHandle | null>(null);

    const handleSave = useCallback(() => {
        const onInvalid = (errors: FieldErrors<SpreadForm>) => {
            if (errors.name) {
                toast.error("Spread name is required", {
                    description: errors.name.message,
                });
            }
            if (errors.description) {
                toast.error("Invalid description", {
                    description: errors.description.message,
                });
            }
            if (errors.positions) {
                toast.error("Card errors", {
                    description: "One or more cards have invalid fields.",
                });
            }

            // Open spread settings (sheet on mobile, panel on desktop)
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

                await updateSpread({
                    _id: spreadId,
                    name: data.name,
                    description: data.description,
                    numberOfCards: positions.length,
                    positions,
                });

                form.reset(data);
                toast.success("Spread updated successfully");
                router.push('/app/personal/spreads');
            } catch (error) {
                toast.error(
                    `Failed to update spread: ${error instanceof Error ? error.message : "Unknown error"}`
                );
            } finally {
                setIsSaving(false);
            }
        }, onInvalid)();
    }, [form, updateSpread, spreadId, isMobile]);

    // ------------ CANCEL / DISCARD LOGIC ------------ //

    const [showDiscardDialog, setShowDiscardDialog] = useState(false);

    const handleCancel = useCallback(() => {
        if (!form.formState.isDirty) {
            router.push("/app/personal/spreads");
            return;
        }
        setShowDiscardDialog(true);
    }, [form.formState.isDirty, router]);

    const handleConfirmDiscard = useCallback(() => {
        setShowDiscardDialog(false);
        router.push("/app/personal/spreads");
    }, [router]);


    // ------------ LOADING / NOT FOUND ------------ //

    if (spread === undefined) {
        return (
            <>
                <AppTopbar breadcrumbs={EDIT_BREADCRUMBS} />
                <div className="h-app-content flex items-center justify-center">
                    <Spinner className="size-6" />
                </div>
            </>
        );
    }

    if (spread === null) {
        return (
            <>
                <AppTopbar breadcrumbs={EDIT_BREADCRUMBS} />
                <div className="h-app-content flex items-center justify-center">
                    <p className="text-muted-foreground">Spread not found.</p>
                </div>
            </>
        );
    }

    return (
        <>
        {/* App Topbar */}
        <AppTopbar
            breadcrumbs={EDIT_BREADCRUMBS}
            centerTitle={
                <>
                    <span className="font-bold text-foreground text-sm lg:text-base truncate max-w-[120px] sm:max-w-[280px] md:max-w-[160px] lg:max-w-[280px]">{spreadTitle}</span>
                    {!isMobile && <>
                        <Separator orientation="vertical" />
                        <span className="text-muted-foreground text-sm lg:text-base text-nowrap">{cardCount}</span>
                    </>}
                </>
            }
            rightButtonGroup={
                <>
                    <Button type="button" variant="ghost" size={isMobile ? "icon" : "default"} onClick={handleCancel}>
                        {isMobile ? <Cancel01Icon /> : <span className="text-xs lg:text-sm">Cancel</span>}
                    </Button>
                    <Button type="button" variant="default" disabled={isSaving || !form.formState.isDirty} onClick={handleSave}>
                        {isSaving && <Spinner />}
                        <span className="text-xs lg:text-sm">{isMobile ? "Save" : "Save Edits"}</span>
                    </Button>
                </>
            }
        />

        {/* Main Content */}
        <div className="h-app-content relative">
            <FormProvider {...form}>
                {isMobile ? (
                    <>
                        {/* Floating Toolbar */}
                        <Card className="absolute bottom-3 left-3 py-2 z-10 shadow-md bg-background">
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

        {/* Discard Changes Dialog */}
        <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Discard changes?</DialogTitle>
                    <DialogDescription>
                        You have unsaved changes. Are you sure you want to leave? Your edits will be lost.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-between">
                    <Button variant="outline" onClick={() => setShowDiscardDialog(false)}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleConfirmDiscard}>
                        Discard
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}

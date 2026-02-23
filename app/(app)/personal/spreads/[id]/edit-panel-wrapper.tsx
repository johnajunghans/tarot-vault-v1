"use client"

import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { spreadSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { routes } from "@/lib/routes";
import { toast } from "sonner";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import SpreadSettingsPanel from "../_components/spread-settings-panel";
import SpreadCanvas from "../_components/canvas";
import CardSettingsPanel from "../_components/card-settings-panel";
import { type PanelImperativeHandle, Layout } from "react-resizable-panels";
import { generateCard, generateCardAt } from "../utils";
import AppTopbar from "@/app/(app)/_components/app-topbar";
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
import { Cancel01Icon, Delete02Icon, PencilEdit02Icon, PlusSignIcon, Settings02Icon } from "hugeicons-react";
import { Card, CardContent } from "@/components/ui/card";
import { SpreadForm } from "@/types/spreads";
import { useViewTransitionRouter } from "@/hooks/use-view-transition-router";

interface EditPanelWrapperProps {
    spreadId: Id<"spreads">
    defaultLayout: Layout | undefined
    groupId: string
    mode: "view" | "edit"
}

const VIEW_BREADCRUMBS = [
    { href: routes.personal.root, label: "Personal", isLast: false },
    { href: routes.personal.spreads.root, label: "Spreads", isLast: false },
    { href: "#", label: "View Spread", isLast: true },
]

const EDIT_BREADCRUMBS = [
    { href: routes.personal.root, label: "Personal", isLast: false },
    { href: routes.personal.spreads.root, label: "Spreads", isLast: false },
    { href: "#", label: "Edit Spread", isLast: true },
]

export default function EditPanelWrapper({
    spreadId,
    defaultLayout,
    groupId,
    mode,
}: EditPanelWrapperProps) {
    const isViewMode = mode === "view";
    const router = useViewTransitionRouter();
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
    const isMobile = useIsMobile()

    // ------------ FETCH SPREAD DATA ------------ //

    const spread = useQuery(api.spreads.getById, { _id: spreadId });

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

    const addCardAt = useCallback((x: number, y: number) => {
        if (cards.length >= 78) return;
        const newCard = generateCardAt(x, y);
        append(newCard);
        setSelectedCardIndex(cards.length);
    }, [cards.length, append, setSelectedCardIndex]);

    // ------------ APP TOPBAR LOGIC ------------ //

    const watchedName = form.watch("name");
    const watchedPositions = form.watch("positions");

    const spreadTitle = watchedName || "Untitled Spread";
    const cardCount = `${watchedPositions?.length ?? 0} ${(watchedPositions?.length ?? 0) !== 1 ? "positions" : "position"}`;

    // ------------ MOBILE SHEET STATE ------------ //

    const [spreadSheetOpen, setSpreadSheetOpen] = useState(false);

    // ------------ SAVE SPREAD LOGIC ------------ //

    const updateSpread = useMutation(api.spreads.update);
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
                toast.error("Position issues", {
                    description: "One or more positions need attention.",
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

                await updateSpread({
                    _id: spreadId,
                    name: data.name,
                    description: data.description,
                    numberOfCards: positions.length,
                    positions,
                });

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
    }, [form, updateSpread, spreadId, isMobile, router]);

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
        setShowDiscardDialog(false);
        router.push(viewUrl);
    }, [router, viewUrl]);


    // ------------ LOADING / NOT FOUND ------------ //

    const breadcrumbs = isViewMode ? VIEW_BREADCRUMBS : EDIT_BREADCRUMBS;

    if (spread === undefined) {
        return (
            <>
                <AppTopbar breadcrumbs={breadcrumbs} />
                <div className="h-app-content flex items-center justify-center">
                    <Spinner className="size-6" />
                </div>
            </>
        );
    }

    if (spread === null) {
        return (
            <>
                <AppTopbar breadcrumbs={breadcrumbs} />
                <div className="h-app-content flex flex-col items-center justify-center gap-3">
                    <p className="text-muted-foreground font-display text-lg">Spread not found</p>
                    <Button variant="outline" onClick={() => router.push(routes.personal.spreads.root)}>
                        Back to spreads
                    </Button>
                </div>
            </>
        );
    }

    // ------------ TOPBAR BUTTON GROUPS ------------ //

    const viewModeButtons = (
        <>
            <Button type="button" variant="ghost" size={isMobile ? "icon" : "default"} onClick={() => router.push(routes.personal.spreads.root)}>
                {isMobile ? <Cancel01Icon /> : <span className="text-xs lg:text-sm">Close</span>}
            </Button>
            <Button type="button" variant="default" size={isMobile ? "icon" : "default"} onClick={() => router.push(routes.personal.spreads.id(spreadId, "edit"))} className="bg-gold hover:bg-gold/90 text-background font-semibold">
                {isMobile ? <PencilEdit02Icon /> : <span className="text-xs lg:text-sm">Edit Spread</span>}
            </Button>
        </>
    );

    const editModeButtons = (
        <>
            <Button type="button" variant="ghost" size={isMobile ? "icon" : "default"} onClick={handleCancel}>
                {isMobile ? <Cancel01Icon /> : <span className="text-xs lg:text-sm">Cancel</span>}
            </Button>
            <Button type="button" variant="ghost" size={isMobile ? "icon" : "default"} className="text-muted-foreground hover:text-destructive" onClick={() => setShowDeleteDialog(true)}>
                {isMobile ? <Delete02Icon /> : <span className="text-xs lg:text-sm">Delete</span>}
            </Button>
            <Button type="button" variant="default" disabled={isSaving || !form.formState.isDirty} onClick={handleSave} className="bg-gold hover:bg-gold/90 text-background font-semibold">
                {isSaving && <Spinner />}
                <span className="text-xs lg:text-sm">{isMobile ? "Save" : "Save Changes"}</span>
            </Button>
        </>
    );

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
        {/* App Topbar */}
        <AppTopbar
            breadcrumbs={breadcrumbs}
            centerTitle={
                <>
                    <span className="font-display font-bold text-foreground text-sm lg:text-base truncate max-w-[120px] sm:max-w-[280px] md:max-w-[160px] lg:max-w-[280px]">{spreadTitle}</span>
                    {!isMobile && <>
                        <Separator orientation="vertical" />
                        <span className="text-muted-foreground text-xs lg:text-sm text-nowrap">{cardCount}</span>
                    </>}
                </>
            }
            rightButtonGroup={isViewMode ? viewModeButtons : editModeButtons}
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

                        {/* Full Canvas */}
                        <SpreadCanvas
                            cards={cards}
                            selectedCardIndex={selectedCardIndex}
                            onCardSelect={setSelectedCardIndex}
                            onCanvasDoubleClick={isViewMode ? undefined : addCardAt}
                            isViewMode={isViewMode}
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
                            open={selectedCardIndex !== null}
                            onOpenChange={(open) => {
                                if (!open) setSelectedCardIndex(null);
                            }}
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
                    <SpreadSettingsPanel {...spreadPanelProps} />

                    <ResizablePanel id="spread-canvas-panel">
                        <SpreadCanvas
                            cards={cards}
                            selectedCardIndex={selectedCardIndex}
                            onCardSelect={setSelectedCardIndex}
                            onCanvasDoubleClick={isViewMode ? undefined : addCardAt}
                            isViewMode={isViewMode}
                        />
                    </ResizablePanel>

                    <CardSettingsPanel {...cardPanelProps} />

                    </ResizablePanelGroup>
                )}
            </FormProvider>
        </div>

        {/* Dialogs (edit mode only) */}
        {!isViewMode && (
            <>
                <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="font-display">Discard changes?</DialogTitle>
                            <DialogDescription>
                                Your edits haven&apos;t been saved. Are you sure you want to leave?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="sm:justify-between">
                            <Button variant="outline" onClick={() => setShowDiscardDialog(false)}>
                                Keep editing
                            </Button>
                            <Button variant="destructive" onClick={handleConfirmDiscard}>
                                Discard
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="font-display">Delete this spread?</DialogTitle>
                            <DialogDescription>
                                This spread and all its positions will be permanently deleted. This cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="sm:justify-end">
                            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
                                Keep it
                            </Button>
                            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                                {isDeleting && <Spinner />}
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        )}
        </>
    )
}

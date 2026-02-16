"use client"

import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { spreadData, spreadSchema } from "../spread-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import SpreadSettingsPanel from "../spread-settings-panel";
import SpreadCanvas from "../canvas";
import CardSettingsPanel from "../card-settings-panel";
import { type PanelImperativeHandle, Layout } from "react-resizable-panels";
import { generateCard } from "../spread-functions";
import AppTopbar from "@/components/app/app-topbar";
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

interface PanelWrapperProps {
    defaultLayout: Layout | undefined
    groupId: string
}

export default function PanelWrapper({
    defaultLayout,
    groupId
}: PanelWrapperProps) {
    const router = useRouter(); // router
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null); // state to control selected card
    
    // ------------ SPREAD FORM ------------ //

    const form = useForm<spreadData>({
        resolver: zodResolver(spreadSchema),
        defaultValues: {
        name: "",
        description: "",
        positions: [generateCard(0)] // initial single card
        }
    });

    const { fields: cards, append, remove, move } = useFieldArray({
        control: form.control,
        name: "positions"
    });

    // ------------ SPREAD DRAFT LOGIC ------------ //

    const draftDate = useRef(Date.now());
    const draftKey = draftDate.current ? `spread-draft-${draftDate.current}` : ""

    useEffect(() => {
        const subscription = form.watch((values) => {
            if (form.formState.isDirty) {
                localStorage.setItem(draftKey, JSON.stringify({
                    ...values,
                    date: draftDate.current,
                    positions: values.positions?.map((p, i) => ({ ...p, position: i + 1 }))
                }));
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);

    // ------------ APP TOPBAR LOGIC ------------ //

    const watchedName = form.watch("name");
    const watchedPositions = form.watch("positions");

    const spreadTitle = watchedName || "New Spread";
    const cardCount = `${watchedPositions?.length ?? 0}-Card`;

    // ------------ SAVE SPREAD LOGIC ------------ //

    const createSpread = useMutation(api.tables.spreads.create); // create spread mutation
    const [isSaving, setIsSaving] = useState(false); // state to track save loading
    const spreadSettingsPanelRef = useRef<PanelImperativeHandle | null>(null); // spread settings panel ref — defined here to control expansion of panel if there is an error during save 

    const handleSave = useCallback(() => {
        const onInvalid = (errors: FieldErrors<spreadData>) => {
            // Show toast for each field error
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

            // Expand spread settings panel if it's collapsed and there are spread-level errors
            if (errors.name || errors.description) {
                const panel = spreadSettingsPanelRef.current;
                if (panel?.isCollapsed()) {
                    panel.expand();
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
                router.push("/app/personal/spreads");
                toast.success("Spread created successfully");
            } catch (error) {
                toast.error(
                    `Failed to create spread: ${error instanceof Error ? error.message : "Unknown error"}`
                );
                setIsSaving(false);
            }
        }, onInvalid)();
    }, [form, createSpread, router]);

    // ------------ DELETE SPREAD MODAL LOGIC ------------ //

    const [showDiscardDialog, setShowDiscardDialog] = useState(false);

    const handleDiscard = useCallback(() => {
        if (!form.formState.isDirty) {
            router.push("/app/personal/spreads");
            return;
        }
        setShowDiscardDialog(true);
    }, [form.formState.isDirty, router]);

    const handleSaveAsDraft = useCallback(() => {
        setShowDiscardDialog(false);
        router.push("/app/personal/spreads");
    }, [router]);

    const handleConfirmDiscard = useCallback(() => {
        localStorage.removeItem(draftKey);
        form.reset();
        setShowDiscardDialog(false);
        router.push("/app/personal/spreads");
    }, [form, router]);


    return (
        <>
        {/* App Topbar */}
        <AppTopbar
            centerTitle={
                <>
                    <span className="font-bold text-foreground">{spreadTitle}</span>
                    <Separator orientation="vertical" />
                    <span className="text-muted-foreground">{cardCount}</span>
                    <Badge variant="secondary">DRAFT</Badge>
                </>
            }
            rightButtonGroup={
                <>
                    <Button type="button" variant="ghost" onClick={handleDiscard}>Discard</Button>
                    <Button type="button" variant="default" disabled={isSaving || !form.formState.isDirty} onClick={handleSave}>
                        {isSaving && <Spinner />}
                        Save Spread
                    </Button>
                </>
            }
        />

        {/* Main Content */}
        <div className="h-app-content relative">
            <FormProvider {...form}>
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
                    append={append}
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
                    cards={cards}
                    selectedCardIndex={selectedCardIndex}
                    setSelectedCardIndex={setSelectedCardIndex}
                    remove={remove}
                    cardCount={cards.length}
                />
                
                </ResizablePanelGroup>
            </FormProvider>
        </div>

        {/* Delete Spread Dialog */}
        <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Discard spread?</DialogTitle>
                    <DialogDescription>
                        You have unsaved changes. Would you like to save this spread as a draft for later, or discard it entirely?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-between">
                    <Button variant="outline" onClick={() => setShowDiscardDialog(false)}>
                        Cancel
                    </Button>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                        <Button variant="secondary" onClick={handleSaveAsDraft}>
                            Save as Draft
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
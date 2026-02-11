"use client"

import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { generateCard, spreadData, spreadSchema } from "../spread-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useTopbarStore } from "@/stores/topbar";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import SpreadSettingsPanel from "../spread-settings-panel";
import SpreadCanvas from "../canvas";
import CardSettingsPanel from "../card-settings-panel";
import { Layout, useDefaultLayout } from "react-resizable-panels";

interface PanelWrapperProps {
    defaultLayout: Layout | undefined
    groupId: string
}

export default function PanelWrapper({
    defaultLayout,
    groupId
}: PanelWrapperProps) {
    const router = useRouter();
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);  

    const form = useForm<spreadData>({
        resolver: zodResolver(spreadSchema),
        defaultValues: {
        name: "",
        description: "",
        positions: [generateCard(0)] // initial single card
        }
    });
    
    const { fields: cards, update, append, remove } = useFieldArray({
        control: form.control,
        name: "positions"
    });
    
    // CAUSES A VARIETY OF ISSUES: 1. localStorage not defined, 2. can't reopen spread settings panel after closed/collapsed.
    // const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    //     id: "spread-creation-layout",
    //     panelIds: ["spread-settings-panel", "spread-canvas-panel", "card-settings-panel"]
    // })

    // Action handlers
    const handleDiscard = useCallback(() => {
        form.reset();
        router.push("/app/personal/spreads");
    }, [form, router]);

    const handleSave = useCallback(() => {
        // Placeholder - will be implemented in future step
        console.log("Save spread:", form.getValues());
    }, [form]);

    // Set topbar state on mount
    useEffect(() => {
        useTopbarStore.getState().setTitle({
        name: "New Spread",
        addInfo: "1-Card",
        draft: true,
        });

        useTopbarStore.getState().setRightButtonGroup({
        primaryButton: {
            text: "Save Spread",
            action: handleSave,
        },
        secondaryButton: {
            text: "Discard",
            action: handleDiscard,
        },
        });

        return () => {
        useTopbarStore.getState().reset();
        };
    }, [handleDiscard, handleSave]);

    // Watch form fields and update topbar title dynamically
    useEffect(() => {
        const subscription = form.watch((value) => {
        const currentName = value.name || "New Spread";
        const addInfo = `${value.positions?.length ?? 0}-Card`

        useTopbarStore.getState().setTitle({
            name: currentName,
            addInfo,
            draft: true,
        });
        });

        return () => subscription.unsubscribe();
    }, [form]);

    // Update card position from canvas drag
    const handleCardTranslation = useCallback((index: number, x: number, y: number) => {
        // TWO DIFFERENT APPROACHES IN THIS FUNCTION, BOTH APPEAR TO WORK
        const currentPositions = form.getValues("positions")
        const currentCard = currentPositions[index]
        update(index, {
        ...currentCard, x, y
        })
        // const positions = form.getValues("positions");
        // const updated = positions.map((card, i) =>
        //   i === index ? { ...card, x, y } : card
        // );
        // form.setValue("positions", updated, { shouldDirty: true });
    }, [form])

    return (
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
                form={form}
                append={append}
                remove={remove}
                cards={cards}
            />

            {/* Center Panel — Canvas */}
            <ResizablePanel 
                id="spread-canvas-panel"
            >
                <SpreadCanvas
                cards={cards}
                onPositionChange={handleCardTranslation}
                selectedCardIndex={selectedCardIndex}
                onCardSelect={setSelectedCardIndex}
                />
            </ResizablePanel>

            {/* Right Panel — Card Details */}
            <CardSettingsPanel 
                form={form}
                cards={cards}
                selectedCardIndex={selectedCardIndex}
                setSelectedCardIndex={setSelectedCardIndex}
            />
            
            </ResizablePanelGroup>
        </FormProvider>
        </div>
    )
}
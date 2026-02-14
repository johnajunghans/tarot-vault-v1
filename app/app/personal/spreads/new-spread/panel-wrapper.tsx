"use client"

import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { spreadData, spreadSchema } from "../spread-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useTopbarStore } from "@/stores/topbar";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import SpreadSettingsPanel from "../spread-settings-panel";
import SpreadCanvas from "../canvas";
import CardSettingsPanel from "../card-settings-panel";
import { Layout } from "react-resizable-panels";
import { generateCard } from "../spread-functions";

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
    
    const { fields: cards, append, remove, move } = useFieldArray({
        control: form.control,
        name: "positions"
    });

    // Action handlers
    const handleDiscard = useCallback(() => {
        form.reset();
        router.push("/app/personal/spreads");
    }, [form, router]);

    const createSpread = useMutation(api.tables.spreads.create);

    const handleSave = useCallback(() => {
        form.handleSubmit(async (data) => {
            const store = useTopbarStore.getState();
            store.setRightButtonGroup({
                ...store.rightButtonGroup!,
                primaryButton: {
                    ...store.rightButtonGroup!.primaryButton,
                    disabled: true,
                },
            });

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

                router.push("/app/personal/spreads");
                toast.success("Spread created successfully");
            } catch (error) {
                toast.error(
                    `Failed to create spread: ${error instanceof Error ? error.message : "Unknown error"}`
                );
                const storeAfterError = useTopbarStore.getState();
                storeAfterError.setRightButtonGroup({
                    ...storeAfterError.rightButtonGroup!,
                    primaryButton: {
                        ...storeAfterError.rightButtonGroup!.primaryButton,
                        disabled: false,
                    },
                });
            }
        })();
    }, [form, createSpread, router]);

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
                append={append}
                remove={remove}
                move={move}
                cards={cards}
                selectedCardIndex={selectedCardIndex}
                setSelectedCardIndex={setSelectedCardIndex}
            />

            {/* Center Panel — Canvas */}
            <ResizablePanel 
                id="spread-canvas-panel"
            >
                <SpreadCanvas
                cards={cards}
                selectedCardIndex={selectedCardIndex}
                onCardSelect={setSelectedCardIndex}
                remove={remove}
                />
            </ResizablePanel>

            {/* Right Panel — Card Details */}
            <CardSettingsPanel 
                cards={cards}
                selectedCardIndex={selectedCardIndex}
                setSelectedCardIndex={setSelectedCardIndex}
            />
            
            </ResizablePanelGroup>
        </FormProvider>
        </div>
    )
}
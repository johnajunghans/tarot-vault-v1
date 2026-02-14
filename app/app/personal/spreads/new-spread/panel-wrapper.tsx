"use client"

import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { spreadData, spreadSchema } from "../spread-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import SpreadSettingsPanel from "../spread-settings-panel";
import SpreadCanvas from "../canvas";
import CardSettingsPanel from "../card-settings-panel";
import { Layout } from "react-resizable-panels";
import { generateCard } from "../spread-functions";
import AppTopbar from "@/components/app/app-topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Delete01Icon, Delete02Icon, FloppyDiskIcon } from "hugeicons-react";

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
    const [isSaving, setIsSaving] = useState(false);

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

    const watchedName = form.watch("name");
    const watchedPositions = form.watch("positions");

    // Action handlers
    const handleDiscard = useCallback(() => {
        form.reset();
        router.push("/app/personal/spreads");
    }, [form, router]);

    const createSpread = useMutation(api.tables.spreads.create);

    const handleSave = useCallback(() => {
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

                router.push("/app/personal/spreads");
                toast.success("Spread created successfully");
            } catch (error) {
                toast.error(
                    `Failed to create spread: ${error instanceof Error ? error.message : "Unknown error"}`
                );
                setIsSaving(false);
            }
        })();
    }, [form, createSpread, router]);

    const spreadTitle = watchedName || "New Spread";
    const cardCount = `${watchedPositions?.length ?? 0}-Card`;


    return (
        <>
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
                    <Button type="button" variant="destructive" size="icon" onClick={handleDiscard}>
                        <Delete02Icon />
                    </Button>
                    <Button type="button" variant="default" disabled={isSaving} onClick={handleSave}>
                        {isSaving ? <Spinner /> : <FloppyDiskIcon />}
                        <span>Save</span>
                    </Button>
                </>
            }
        />
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
        </>
    )
}
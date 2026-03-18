"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { routes } from "@/lib/routes";
import { toast } from "sonner";
import { Layout } from "react-resizable-panels";
import ConfirmDialog from "../../../../_components/confirm-dialog";
import { SpreadForm } from "@/types/spreads";
import { useRouter } from "next/navigation";
import { useLayoutDispatch } from "@/components/providers/layout-provider";
import type { ActionDescriptor } from "@/types/layout";
import {
    getSpreadBounds,
    normalizeCardsToCanvasCenter,
} from "../_lib/layout";
import { useSpreadForm } from "../_hooks/use-spread-form";
import { useSpreadEditor } from "../_hooks/use-spread-editor";
import { mapPositionsForApi } from "../_lib/map-positions-for-api";
import SpreadEditorLayout from "../_components/editor/spread-editor-layout";

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

    // ------------ SPREAD FORM ------------ //

    const spreadForm = useSpreadForm();
    const {
        form,
        cards,
        remove,
        move,
        watchedValues,
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
        handleCardRotationChange,
        handleCanvasPositionsCommit,
        zoomDisplay,
        setZoomDisplay,
        minZoomDisplay,
        setMinZoomDisplay,
    } = spreadForm;

    // ------------ EDITOR PLUMBING ------------ //

    const editor = useSpreadEditor({
        requestKey: "new-spread-empty",
        spreadForm,
    });
    const {
        isMobile,
        emptyCanvasViewportRequest,
        viewportRequest,
        setViewportRequest,
        spreadSheetOpen,
        setSpreadSheetOpen,
        isSaving,
        setIsSaving,
        spreadSettingsPanelRef,
        onInvalid,
        showDiscardDialog,
        setShowDiscardDialog,
        zoomIn,
        zoomOut,
        resetZoom,
    } = editor;

    // ------------ SPREAD DRAFT LOGIC ------------ //

    const [draftDate] = useState(() => loadedDraftDate ?? createDraftTimestamp());
    const draftKey = draftDate ? `spread-draft-${draftDate}` : "";
    const isDiscardingRef = useRef(false);

    useLayoutEffect(() => {
        let nextViewportRequest = emptyCanvasViewportRequest;

        if (!loadedDraftDate) {
            const frame = window.requestAnimationFrame(() => {
                setViewportRequest(emptyCanvasViewportRequest);
            });

            return () => window.cancelAnimationFrame(frame);
        }

        const raw = localStorage.getItem(`spread-draft-${loadedDraftDate}`);
        if (!raw) {
            const frame = window.requestAnimationFrame(() => {
                setViewportRequest(emptyCanvasViewportRequest);
            });

            return () => window.cancelAnimationFrame(frame);
        }

        try {
            const draft = JSON.parse(raw) as SpreadForm & { date?: number; numberOfCards?: number };
            const normalizedPositions = normalizeCardsToCanvasCenter(
                (draft.positions ?? []).map(
                    ({ name, description, allowReverse, x, y, r, z }) => ({
                        name, description, allowReverse, x, y, r, z,
                    })
                )
            );
            form.reset({
                name: draft.name ?? "",
                description: draft.description ?? "",
                positions: normalizedPositions,
            });

            const bounds = getSpreadBounds(normalizedPositions);
            nextViewportRequest = bounds
                ? {
                      key: `draft-${loadedDraftDate}-${normalizedPositions.length}`,
                      type: "fit-spread",
                      bounds,
                      maxZoom: 1,
                  }
                : emptyCanvasViewportRequest;
        } catch { /* ignore invalid draft data */ }

        const frame = window.requestAnimationFrame(() => {
            setViewportRequest(nextViewportRequest);
        });

        return () => window.cancelAnimationFrame(frame);
    }, [emptyCanvasViewportRequest, form, loadedDraftDate, setViewportRequest]);

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

    // ------------ SAVE SPREAD LOGIC ------------ //

    const createSpread = useMutation(api.spreads.create);

    const handleSave = useCallback(() => {
        form.handleSubmit(async (data) => {
            setIsSaving(true);

            try {
                const positions = mapPositionsForApi(data.positions);

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
    }, [form, createSpread, router, draftKey, onInvalid, setIsSaving]);

    // ------------ DISCARD LOGIC ------------ //

    const handleDiscard = useCallback(() => {
        if (!form.formState.isDirty && !loadedDraftDate) {
            localStorage.removeItem(draftKey)
            router.push(routes.personal.spreads.root);
            return;
        }
        setShowDiscardDialog(true);
    }, [form.formState.isDirty, router, loadedDraftDate, draftKey, setShowDiscardDialog]);

    const handleConfirmDiscard = useCallback(() => {
        const key = draftKey;
        isDiscardingRef.current = true;
        localStorage.removeItem(key);
        form.reset();
        setShowDiscardDialog(false);
        router.push(routes.personal.spreads.root);
    }, [form, router, draftKey, setShowDiscardDialog]);

    // ------------ LAYOUT DISPATCH ------------ //

    const { setActions, setTitle, reset } = useLayoutDispatch();
    const isDirty = form.formState.isDirty;

    useEffect(() => {
        setTitle({
            variant: "spread",
            name: watchedName || "New Spread",
            count: watchedPositions?.length ?? 0,
            countUnit: "card",
            badge: "DRAFT",
        })
    }, [watchedName, watchedPositions?.length, setTitle])

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

    useEffect(() => {
        return () => reset()
    }, [reset])

    return (
        <>
        <SpreadEditorLayout
            form={form}
            canvasRef={canvasRef}
            canvasCards={canvasCards}
            cardKeys={cardKeys}
            canvasRotationAngles={canvasRotationAngles}
            viewportRequest={viewportRequest}
            cards={cards}
            selectedCardIndex={selectedCardIndex}
            setSelectedCardIndex={setSelectedCardIndex}
            addCard={addCard}
            addCardAt={addCardAt}
            remove={remove}
            move={move}
            handleCardRotationChange={handleCardRotationChange}
            handleCanvasPositionsCommit={handleCanvasPositionsCommit}
            zoomDisplay={zoomDisplay}
            minZoomDisplay={minZoomDisplay}
            setZoomDisplay={setZoomDisplay}
            setMinZoomDisplay={setMinZoomDisplay}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            resetZoom={resetZoom}
            groupId={groupId}
            defaultLayout={defaultLayout}
            spreadSettingsPanelRef={spreadSettingsPanelRef}
            isMobile={isMobile}
            spreadSheetOpen={spreadSheetOpen}
            setSpreadSheetOpen={setSpreadSheetOpen}
        />

        {/* Discard Spread Dialog */}
        <ConfirmDialog
            open={showDiscardDialog}
            onOpenChange={setShowDiscardDialog}
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

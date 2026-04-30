"use client"

import { useCallback, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { routes } from "@/lib/routes";
import { toast } from "sonner";
import { Layout } from "react-resizable-panels";
import {
    Delete02Icon,
    FloppyDiskIcon,
    MultiplicationSignIcon,
} from "@hugeicons/core-free-icons";
import ConfirmDialog from "../../../_components/confirm-dialog";
import { useRouter } from "next/navigation";
import { useLayoutDispatch } from "@/components/providers/layout-provider";
import type { ActionDescriptor } from "@/types/layout";
import {
    useSpreadForm,
    useSpreadEditor,
    useSpreadDraft,
    mapPositionsForApi,
    SpreadEditorLayout,
} from "../_editor";

interface CreateSpreadProps {
    defaultLayout: Layout | undefined
    groupId: string
    loadedDraftDate?: number
}

export default function CreateSpread({
    defaultLayout,
    groupId,
    loadedDraftDate,
}: CreateSpreadProps) {
    const router = useRouter();

    // ------------ SPREAD FORM ------------ //

    const spreadForm = useSpreadForm();
    const { form, watchedValues, watchedName, watchedPositions, clearHistory } = spreadForm;

    // ------------ EDITOR PLUMBING ------------ //

    const editor = useSpreadEditor({
        requestKey: "new-spread-empty",
        spreadForm,
    });
    const {
        emptyCanvasViewportRequest,
        setViewportRequest,
        isSaving,
        setIsSaving,
        onInvalid,
        showDiscardDialog,
        setShowDiscardDialog,
    } = editor;

    // ------------ DRAFT PERSISTENCE ------------ //

    const { draftKey, handleDiscard, handleConfirmDiscard } = useSpreadDraft({
        form,
        loadedDraftDate,
        emptyCanvasViewportRequest,
        setViewportRequest,
        setShowDiscardDialog,
        watchedValues,
        clearHistory,
    });

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

    // ------------ LAYOUT DISPATCH ------------ //

    const { setActions, setTitle, reset } = useLayoutDispatch();
    const isDirty = form.formState.isDirty;

    useEffect(() => {
        setTitle({
            variant: "spread",
            name: watchedName,
            nameFallback: "Untitled Spread",
            count: watchedPositions?.length ?? 0,
            countUnit: "card",
            badge: "DRAFT",
        })
    }, [watchedName, watchedPositions?.length, setTitle])

    useEffect(() => {
        const items: ActionDescriptor[] = [
            {
                variant: "primary",
                type: "button",
                label: "Save Spread",
                icon: FloppyDiskIcon,
                iconStrokeWidth: 2,
                onClick: handleSave,
                disabled: isSaving || (!isDirty && !loadedDraftDate),
                loading: isSaving,
            },
            {
                variant: "destructive",
                type: "button",
                label: "Discard",
                icon: Delete02Icon,
                iconStrokeWidth: 1.5,
                onClick: handleDiscard,
            },
        ];
        if (loadedDraftDate) {
            items.push({
                variant: "ghost",
                type: "link",
                label: "Close",
                icon: MultiplicationSignIcon,
                iconStrokeWidth: 1.5,
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
            spreadForm={spreadForm}
            editor={editor}
            groupId={groupId}
            defaultLayout={defaultLayout}
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

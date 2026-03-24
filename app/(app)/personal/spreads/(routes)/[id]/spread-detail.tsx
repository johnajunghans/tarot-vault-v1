"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { routes } from "@/lib/routes";
import { toast } from "sonner";
import { Layout } from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import ConfirmDialog from "../../../../../_components/confirm-dialog";
import { SpreadDB, SpreadForm } from "@/types/spreads";
import { useRouter } from "next/navigation";
import { useLayoutDispatch } from "@/components/providers/layout-provider";
import type { ActionDescriptor, BreadcrumbDescriptor } from "@/types/layout";
import Link from "next/link";
import {
    getSpreadBounds,
    normalizeCardsToCanvasCenter,
    useSpreadForm,
    useSpreadEditor,
    mapPositionsForApi,
    SpreadEditorLayout,
} from "../_editor";

interface SpreadDetailProps {
    spreadId: Id<"spreads">
    defaultLayout: Layout | undefined
    groupId: string
    mode: "view" | "edit"
}

const VIEW_BREADCRUMBS: BreadcrumbDescriptor[] = [
    { href: routes.personal.root, label: "Personal" },
    { href: routes.personal.spreads.root, label: "Spreads" },
    { href: "#", label: "View Spread" },
]

const EDIT_BREADCRUMBS: BreadcrumbDescriptor[] = [
    { href: routes.personal.root, label: "Personal" },
    { href: routes.personal.spreads.root, label: "Spreads" },
    { href: "#", label: "Edit Spread" },
]

function toSpreadFormValues(spread: Pick<SpreadDB, "name" | "description" | "positions">): SpreadForm {
    return {
        name: spread.name,
        description: spread.description ?? "",
        positions: spread.positions.map(({ name, description, allowReverse, x, y, r, z }) => ({
            name, description, allowReverse, x, y, r, z,
        })),
    };
}

export default function SpreadDetail({
    spreadId,
    defaultLayout,
    groupId,
    mode,
}: SpreadDetailProps) {
    const isViewMode = mode === "view";
    const router = useRouter();

    // ------------ FETCH SPREAD DATA ------------ //

    const spread = useQuery(api.spreads.getById, { _id: spreadId });

    // ------------ SPREAD FORM ------------ //

    const spreadForm = useSpreadForm();
    const {
        form,
        watchedName,
        watchedPositions,
        setSelectedCardIndex,
    } = spreadForm;

    // ------------ EDITOR PLUMBING ------------ //

    const editor = useSpreadEditor({
        requestKey: `spread-${spreadId}-empty`,
        spreadForm,
    });
    const {
        emptyCanvasViewportRequest,
        setViewportRequest,
        setSpreadSheetOpen,
        isSaving,
        setIsSaving,
        onInvalid,
        showDiscardDialog,
        setShowDiscardDialog,
    } = editor;

    // ------------ POPULATE FORM FROM DB ------------ //

    const hasReset = useRef(false);
    const initialValuesRef = useRef<SpreadForm | null>(null);

    useLayoutEffect(() => {
        if (hasReset.current || !spread) return;
        const initialValues = toSpreadFormValues(spread);
        const normalizedPositions = normalizeCardsToCanvasCenter(
            initialValues.positions
        );
        const normalizedValues = {
            ...initialValues,
            positions: normalizedPositions,
        };
        const bounds = getSpreadBounds(normalizedPositions);
        initialValuesRef.current = normalizedValues;
        hasReset.current = true;
        form.reset(normalizedValues);
        setViewportRequest(
            bounds
                ? {
                      key: `spread-${spreadId}-${spread._creationTime}-${mode}`,
                      type: "fit-spread",
                      bounds,
                      maxZoom: 1,
                  }
                : emptyCanvasViewportRequest
        );
    }, [emptyCanvasViewportRequest, form, mode, spread, spreadId, setViewportRequest]);

    // ------------ SAVE SPREAD LOGIC ------------ //

    const updateSpread = useMutation(api.spreads.update);

    const handleSave = useCallback(() => {
        form.handleSubmit(async (data) => {
            setIsSaving(true);

            try {
                const positions = mapPositionsForApi(data.positions);

                await updateSpread({
                    _id: spreadId,
                    name: data.name,
                    description: data.description,
                    numberOfCards: positions.length,
                    positions,
                });

                initialValuesRef.current = data;
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
    }, [form, updateSpread, spreadId, router, onInvalid, setIsSaving]);

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

    const viewUrl = routes.personal.spreads.id(spreadId, "view");

    const handleCancel = useCallback(() => {
        if (!form.formState.isDirty) {
            router.push(viewUrl);
            return;
        }
        setShowDiscardDialog(true);
    }, [form.formState.isDirty, router, viewUrl, setShowDiscardDialog]);

    const handleConfirmDiscard = useCallback(() => {
        form.reset(initialValuesRef.current ?? undefined);
        setSelectedCardIndex(null);
        setSpreadSheetOpen(false);
        setShowDiscardDialog(false);
        router.push(viewUrl);
    }, [form, router, setSelectedCardIndex, setSpreadSheetOpen, setShowDiscardDialog, viewUrl]);

    // ------------ LAYOUT DISPATCH ------------ //

    const { setActions, setTitle, setBreadcrumbs, reset } = useLayoutDispatch();
    const isDirty = form.formState.isDirty;

    useEffect(() => {
        setBreadcrumbs({
            mode: "custom",
            items: isViewMode ? VIEW_BREADCRUMBS : EDIT_BREADCRUMBS,
        })
    }, [isViewMode, setBreadcrumbs])

    useEffect(() => {
        setTitle({
            variant: "spread",
            name: watchedName,
            nameFallback: "Untitled Spread",
            count: watchedPositions?.length ?? 0,
            countUnit: "position",
        })
    }, [watchedName, watchedPositions?.length, setTitle])

    const actions = useMemo<ActionDescriptor[] | null>(() => {
        if (!spread) return null;

        if (isViewMode) {
            return [
                {
                    type: "edit",
                    label: "Edit Spread",
                    href: routes.personal.spreads.id(spreadId, "edit"),
                },
                {
                    type: "close",
                    label: "Close",
                    href: routes.personal.spreads.root,
                },
            ];
        }

        return [
            {
                type: "save",
                label: "Save Changes",
                onClick: handleSave,
                disabled: isSaving || !isDirty,
                loading: isSaving,
            },
            {
                type: "delete",
                label: "Delete",
                onClick: () => setShowDeleteDialog(true),
            },
            {
                type: "cancel",
                label: "Cancel",
                onClick: handleCancel,
            },
        ];
    }, [spread, isViewMode, handleCancel, handleSave, isSaving, isDirty, spreadId]);

    useEffect(() => {
        setActions(actions);
    }, [actions, setActions]);

    useEffect(() => {
        return () => reset()
    }, [reset])

    // ------------ LOADING / NOT FOUND ------------ //

    if (spread === undefined) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center">
                <Spinner className="size-6" />
            </div>
        );
    }

    if (spread === null) {
        return (
            <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3">
                <p className="text-muted-foreground font-display text-lg">Spread not found</p>
                <Button variant="outline">
                    <Link href={routes.personal.spreads.root}>Back to spreads</Link>
                </Button>
            </div>
        );
    }

    return (
        <>
        <SpreadEditorLayout
            spreadForm={spreadForm}
            editor={editor}
            groupId={groupId}
            defaultLayout={defaultLayout}
            isViewMode={isViewMode}
        />

        {/* Dialogs (edit mode only) */}
        {!isViewMode && (
            <>
                <ConfirmDialog
                    open={showDiscardDialog}
                    onOpenChange={setShowDiscardDialog}
                    title="Discard changes?"
                    description="Your edits haven't been saved. Are you sure you want to leave?"
                    cancelLabel="Keep editing"
                    confirmLabel="Discard"
                    onConfirm={handleConfirmDiscard}
                />
                <ConfirmDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    title="Delete this spread?"
                    description="This spread and all its positions will be permanently deleted. This cannot be undone."
                    cancelLabel="Keep it"
                    confirmLabel="Delete"
                    onConfirm={handleConfirmDelete}
                    isConfirming={isDeleting}
                />
            </>
        )}
        </>
    )
}

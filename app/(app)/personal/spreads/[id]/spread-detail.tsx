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
import {
    Cancel01Icon,
    Copy01Icon,
    Delete02Icon,
    FloppyDiskIcon,
    LibraryIcon,
    MoreIcon,
    PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import ConfirmDialog from "../../../_components/confirm-dialog";
import { SpreadDB, SpreadForm } from "@/types/spreads";
import { useRouter } from "next/navigation";
import { useLayoutDispatch } from "@/components/providers/layout-provider";
import type { ActionDescriptor, BreadcrumbDescriptor } from "@/types/layout";
import Link from "next/link";
import {
    getSpreadBounds,
    normalizeCardsToCanvasCenter,
    createDraftTimestamp,
    useSpreadForm,
    useSpreadEditor,
    mapPositionsForApi,
    SpreadEditorLayout,
} from "../_editor";
import { DRAFT_KEY_PREFIX } from "../_editor/lib";

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

    const spreadForm = useSpreadForm({ isViewMode });
    const {
        form,
        watchedName,
        watchedPositions,
        setSelectedCardIndex,
        clearHistory,
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
        clearHistory();
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
    }, [clearHistory, emptyCanvasViewportRequest, form, mode, spread, spreadId, setViewportRequest]);

    // ------------ SAVE SPREAD LOGIC ------------ //

    const updateSpread = useMutation(api.spreads.update);
    const viewUrl = routes.personal.spreads.id(spreadId, "view");

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
                clearHistory();
                toast.success("Spread updated!");
                router.push(viewUrl);
            } catch (error) {
                toast.error(
                    `Failed to update spread: ${error instanceof Error ? error.message : "Unknown error"}`
                );
            } finally {
                setIsSaving(false);
            }
        }, onInvalid)();
    }, [clearHistory, form, updateSpread, spreadId, router, onInvalid, setIsSaving, viewUrl]);

    // ------------ DELETE SPREAD LOGIC ------------ //

    const removeSpread = useMutation(api.spreads.remove);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = useCallback(async () => {
        setIsDeleting(true);
        try {
            await removeSpread({ _id: spreadId, cascade: false });
            toast.success("Spread deleted");
            router.push(routes.personal.spreads.root);
        } catch (error) {
            toast.error(
                `Failed to delete spread: ${error instanceof Error ? error.message : "Unknown error"}`
            );
            setIsDeleting(false);
        }
    }, [removeSpread, spreadId, router]);

    const handleCascadeDelete = useCallback(async () => {
        setIsDeleting(true);
        try {
            await removeSpread({ _id: spreadId, cascade: true });
            toast.success("Spread and all readings deleted");
            router.push(routes.personal.spreads.root);
        } catch (error) {
            toast.error(
                `Failed to delete spread: ${error instanceof Error ? error.message : "Unknown error"}`
            );
            setIsDeleting(false);
        }
    }, [removeSpread, spreadId, router]);

    // ------------ CANCEL / DISCARD LOGIC ------------ //

    const handleCancel = useCallback(() => {
        if (!form.formState.isDirty) {
            router.push(viewUrl);
            return;
        }
        setShowDiscardDialog(true);
    }, [form.formState.isDirty, router, viewUrl, setShowDiscardDialog]);

    const handleConfirmDiscard = useCallback(() => {
        form.reset(initialValuesRef.current ?? undefined);
        clearHistory();
        setSelectedCardIndex(null);
        setSpreadSheetOpen(false);
        setShowDiscardDialog(false);
        router.push(viewUrl);
    }, [clearHistory, form, router, setSelectedCardIndex, setSpreadSheetOpen, setShowDiscardDialog, viewUrl]);

    // ------------ USE AS TEMPLATE ------------ //

    const handleUseAsTemplate = useCallback(() => {
        if (!spread) return;
        const name = `${spread.name} (copy)`.slice(0, 50);
        const timestamp = createDraftTimestamp();
        const draft = {
            name,
            description: spread.description ?? "",
            positions: spread.positions.map((p, i) => ({
                name: p.name,
                description: p.description,
                allowReverse: p.allowReverse,
                x: p.x,
                y: p.y,
                r: p.r,
                z: p.z,
                position: i + 1,
            })),
            date: timestamp,
            numberOfCards: spread.positions.length,
        };
        localStorage.setItem(`${DRAFT_KEY_PREFIX}${timestamp}`, JSON.stringify(draft));
        router.push(routes.personal.spreads.new.draft(timestamp));
    }, [spread, router]);

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
        if (!spread) return;
        setTitle({
            variant: "spread",
            name: watchedName,
            nameFallback: "Untitled Spread",
            count: watchedPositions?.length ?? 0,
            countUnit: "position",
        })
    }, [spread, watchedName, watchedPositions?.length, setTitle])

    const moreActionsMenu: ActionDescriptor = useMemo(() => ({
        variant: "secondary",
        type: "dropdown" as const,
        label: "Actions",
        icon: MoreIcon,
        topbarIconSize: 18,
        sidebarIconSize: 22,
        iconStrokeWidth: 1.5,
        menuStructure: [
            {
                type: "button" as const,
                label: "Create reading with this spread",
                icon: LibraryIcon,
                variant: "default" as const,
                disabled: true,
                onClick: () => {},
            },
            {
                type: "button" as const,
                label: "Use as template for new spread",
                icon: Copy01Icon,
                variant: "default" as const,
                onClick: handleUseAsTemplate,
            },
            "separator" as const,
            {
                type: "button" as const,
                label: "Delete Spread",
                icon: Delete02Icon,
                variant: "destructive" as const,
                onClick: () => setShowDeleteDialog(true),
            },
        ],
    }), [handleUseAsTemplate]);

    const actions = useMemo<ActionDescriptor[] | undefined>(() => {
        if (!spread) return undefined;

        if (isViewMode) {
            return [
                {
                    variant: "primary",
                    type: "link",
                    label: "Edit Spread",
                    icon: PencilEdit02Icon,
                    iconStrokeWidth: 2,
                    href: routes.personal.spreads.id(spreadId, "edit"),
                },
                moreActionsMenu,
                {
                    variant: "link",
                    type: "link",
                    label: "Close",
                    icon: Cancel01Icon,
                    iconStrokeWidth: 1.25,
                    // topbarIconOnly: true,
                    href: routes.personal.spreads.root,
                },
            ];
        }

        return [
            {
                variant: "primary",
                type: "button",
                label: "Save Changes",
                icon: FloppyDiskIcon,
                iconStrokeWidth: 2,
                onClick: handleSave,
                disabled: isSaving || !isDirty,
                loading: isSaving,
            },
            moreActionsMenu,
            {
                variant: "link",
                type: "button",
                label: "Cancel",
                icon: Cancel01Icon,
                iconStrokeWidth: 1.25,
                // topbarIconOnly: true,
                onClick: handleCancel,
            },
        ];
    }, [spread, isViewMode, handleCancel, handleSave, isSaving, isDirty, spreadId, moreActionsMenu]);

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

        {/* Discard dialog (edit mode only) */}
        {!isViewMode && (
            <ConfirmDialog
                open={showDiscardDialog}
                onOpenChange={setShowDiscardDialog}
                title="Discard changes?"
                description="Your edits haven't been saved. Are you sure you want to leave?"
                cancelLabel="Keep editing"
                confirmLabel="Discard"
                onConfirm={handleConfirmDiscard}
            />
        )}

        {/* Delete dialog (both modes) */}
        {spread.readingCount > 0 ? (
            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Delete this spread?"
                description={`This spread is referenced by ${spread.readingCount} reading${spread.readingCount === 1 ? "" : "s"}. You can delete just the spread (readings will keep their layout) or delete the spread and all its readings.`}
                cancelLabel="Keep it"
                confirmLabel={`Delete spread and ${spread.readingCount} reading${spread.readingCount === 1 ? "" : "s"}`}
                onConfirm={handleCascadeDelete}
                secondaryLabel="Delete spread only"
                onSecondary={handleConfirmDelete}
                secondaryVariant="secondary"
                isConfirming={isDeleting}
            />
        ) : (
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
        )}
        </>
    )
}

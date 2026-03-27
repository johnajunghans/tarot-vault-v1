"use client"

import { useCallback, useState } from "react"
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { type Layout } from "react-resizable-panels"
import { FormProvider } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlusSignIcon, Settings02Icon } from "hugeicons-react"
import SpreadCanvas, { ZoomControls, UndoRedoControls } from "../canvas"
import { SpreadSettingsPanel, CardSettingsPanel } from "../panels"
import ConfirmDialog from "@/app/_components/confirm-dialog"
import { useAppHotkey } from "@/hooks/use-app-hotkey"
import type { UseSpreadFormReturn } from "../panels/hooks/use-spread-form"
import type { UseSpreadEditorReturn } from "./hooks/use-spread-editor"

interface SpreadEditorLayoutProps {
    spreadForm: UseSpreadFormReturn
    editor: UseSpreadEditorReturn
    groupId: string
    defaultLayout: Layout | undefined
    isViewMode?: boolean
}

export default function SpreadEditorLayout({
    spreadForm,
    editor,
    groupId,
    defaultLayout,
    isViewMode,
}: SpreadEditorLayoutProps) {
    const {
        form,
        canvasRef,
        canvasCards,
        cardKeys,
        canvasRotationAngles,
        cards,
        selectedCardIndex,
        setSelectedCardIndex,
        addCard,
        addCardAt,
        remove,
        move,
        handleCardRotationChange,
        handleCanvasPositionsCommit,
        handleCanvasLayerChange,
        zoomDisplay,
        setZoomDisplay,
        minZoomDisplay,
        setMinZoomDisplay,
        canUndo,
        canRedo,
        undo,
        redo,
    } = spreadForm

    const {
        isMobile,
        viewportRequest,
        spreadSheetOpen,
        setSpreadSheetOpen,
        spreadSettingsPanelRef,
        zoomIn,
        zoomOut,
        resetZoom,
    } = editor

    const [canvasDeleteIndex, setCanvasDeleteIndex] = useState<number | null>(null)
    const canAddCard = !isViewMode && cards.length < 78

    const handleCanvasDeleteConfirm = useCallback(() => {
        if (canvasDeleteIndex === null) return

        if (selectedCardIndex !== null) {
            if (selectedCardIndex === canvasDeleteIndex) {
                setSelectedCardIndex(null)
            } else if (selectedCardIndex > canvasDeleteIndex) {
                setSelectedCardIndex(selectedCardIndex - 1)
            }
        }

        remove(canvasDeleteIndex)
        setCanvasDeleteIndex(null)
    }, [canvasDeleteIndex, selectedCardIndex, setSelectedCardIndex, remove])

    const toggleLeftPanel = useCallback(() => {
        if (isMobile) {
            setSpreadSheetOpen((open) => !open)
            return
        }

        const panel = spreadSettingsPanelRef.current
        if (!panel) return

        if (panel.isCollapsed()) {
            panel.expand()
            return
        }

        panel.collapse()
    }, [isMobile, setSpreadSheetOpen, spreadSettingsPanelRef])

    useAppHotkey("Mod+H", toggleLeftPanel, {
        ignoreInputs: false,
    })

    useAppHotkey("Mod+J", addCard, {
        enabled: canAddCard,
        ignoreInputs: false,
    })

    return (
        <div className="relative h-full min-h-0 overflow-hidden">
            <FormProvider {...form}>
                <SpreadCanvas
                    ref={canvasRef}
                    cards={canvasCards}
                    cardKeys={cardKeys}
                    rotationAngles={canvasRotationAngles}
                    selectedCardIndex={selectedCardIndex}
                    onCardSelect={setSelectedCardIndex}
                    onCanvasDoubleClick={isViewMode ? undefined : addCardAt}
                    isViewMode={isViewMode}
                    onPositionsCommit={handleCanvasPositionsCommit}
                    onRotationChange={handleCardRotationChange}
                    onLayerChange={handleCanvasLayerChange}
                    onDeleteCard={isViewMode ? undefined : setCanvasDeleteIndex}
                    onZoomDisplayChange={setZoomDisplay}
                    onZoomBoundsChange={setMinZoomDisplay}
                    viewportRequest={viewportRequest}
                />

                {isMobile ? (
                    <>
                        {/* Floating Toolbar */}
                        <Card className="absolute top-3 left-3 py-2 z-10 shadow-md bg-background/90 backdrop-blur-sm border-border/50 pointer-events-auto">
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

                        {/* Canvas Controls */}
                        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                            {!isViewMode && (
                                <UndoRedoControls
                                    canUndo={canUndo}
                                    canRedo={canRedo}
                                    onUndo={undo}
                                    onRedo={redo}
                                />
                            )}
                            <ZoomControls
                                zoom={zoomDisplay}
                                minZoom={minZoomDisplay}
                                onZoomIn={zoomIn}
                                onZoomOut={zoomOut}
                                onResetZoom={resetZoom}
                                className="static"
                            />
                        </div>

                        {/* Spread Settings (Sheet on mobile) */}
                        <SpreadSettingsPanel
                            isMobile={isMobile}
                            isViewMode={isViewMode}
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

                        {/* Card Settings (Sheet on mobile) */}
                        <CardSettingsPanel
                            isMobile={isMobile}
                            isViewMode={isViewMode}
                            open={selectedCardIndex !== null}
                            onOpenChange={(open) => {
                                if (!open) setSelectedCardIndex(null);
                            }}
                            cards={cards}
                            selectedCardIndex={selectedCardIndex}
                            setSelectedCardIndex={setSelectedCardIndex}
                            onRotationChange={handleCardRotationChange}
                            remove={remove}
                        />
                    </>
                ) : (
                    <>
                    {/* Panel group overlaid on canvas */}
                    <ResizablePanelGroup
                        id={groupId}
                        orientation="horizontal"
                        defaultLayout={defaultLayout}
                        onLayoutChanged={(layout) => {
                            document.cookie = `${groupId}=${JSON.stringify(layout)}; path=/;`
                        }}
                        className="absolute inset-0 pointer-events-none"
                    >
                    {/* Left Panel — Settings */}
                    <SpreadSettingsPanel
                        isMobile={isMobile}
                        isViewMode={isViewMode}
                        addCard={addCard}
                        remove={remove}
                        move={move}
                        cards={cards}
                        selectedCardIndex={selectedCardIndex}
                        setSelectedCardIndex={setSelectedCardIndex}
                        panelRef={spreadSettingsPanelRef}
                    />

                    {/* Center Spacer — transparent, passes events to canvas */}
                    <ResizablePanel
                        id="spread-canvas-spacer"
                        style={{ pointerEvents: "none" }}
                    >
                        <div className="relative h-full">
                            <div className="absolute top-2 right-2 z-10 flex items-center gap-2 pointer-events-auto">
                                {!isViewMode && (
                                    <UndoRedoControls
                                        canUndo={canUndo}
                                        canRedo={canRedo}
                                        onUndo={undo}
                                        onRedo={redo}
                                    />
                                )}
                                <ZoomControls
                                    zoom={zoomDisplay}
                                    minZoom={minZoomDisplay}
                                    onZoomIn={zoomIn}
                                    onZoomOut={zoomOut}
                                    onResetZoom={resetZoom}
                                    className="static"
                                />
                            </div>
                        </div>
                    </ResizablePanel>

                    {/* Right Panel — Card Details */}
                    <CardSettingsPanel
                        isMobile={isMobile}
                        isViewMode={isViewMode}
                        cards={cards}
                        selectedCardIndex={selectedCardIndex}
                        setSelectedCardIndex={setSelectedCardIndex}
                        onRotationChange={handleCardRotationChange}
                        remove={remove}
                    />

                    </ResizablePanelGroup>
                    </>
                )}
            </FormProvider>

            <ConfirmDialog
                open={canvasDeleteIndex !== null}
                onOpenChange={(open) => {
                    if (!open) setCanvasDeleteIndex(null)
                }}
                title={
                    canvasDeleteIndex !== null
                        ? `Remove Position ${canvasDeleteIndex + 1}?`
                        : ""
                }
                description="This position will be removed from the spread. This cannot be undone."
                cancelLabel="Keep it"
                confirmLabel="Remove"
                onConfirm={handleCanvasDeleteConfirm}
            />
        </div>
    )
}

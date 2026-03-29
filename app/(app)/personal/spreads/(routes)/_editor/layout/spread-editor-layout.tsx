"use client"

import { useDesktopCanvasControlsAnimation } from "./hooks/use-desktop-canvas-controls-animation"
import { useCallback, useRef, useState } from "react"
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { type Layout } from "react-resizable-panels"
import { FormProvider } from "react-hook-form"
import SpreadCanvas, { ZoomControls, UndoRedoControls } from "../canvas"
import { SpreadSettingsPanel, CardSettingsPanel, SpreadFloatingToolbar } from "../panels"
import ConfirmDialog from "@/app/(app)/_components/confirm-dialog"
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
    const toggleLeftPanelRef = useRef<(() => void) | null>(null)
    const canAddCard = !isViewMode && cards.length < 78
    const {
        controlsPositionRef: desktopControlsPositionRef,
        controlsContentRef: desktopControlsContentRef,
        syncToPanelWidth,
        animateForPanelOpen,
        settleAfterPanelOpen,
        animateForPanelClose,
        settleAfterPanelClose,
    } = useDesktopCanvasControlsAnimation()

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

        toggleLeftPanelRef.current?.()
    }, [isMobile, setSpreadSheetOpen])

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
                        <SpreadFloatingToolbar
                            title={isViewMode ? "Spread Details" : "Spread Settings"}
                            onOpenPanel={() => setSpreadSheetOpen(true)}
                            onAddCard={isViewMode ? undefined : addCard}
                            canAddCard={canAddCard}
                            showAddCard={!isViewMode}
                            isMobile
                        />

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
                            togglePanelRef={toggleLeftPanelRef}
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
                        togglePanelRef={toggleLeftPanelRef}
                    />

                    {/* Center Spacer — transparent, passes events to canvas */}
                    <ResizablePanel
                        id="spread-canvas-spacer"
                        style={{ pointerEvents: "none" }}
                    >
                        <div className="relative h-full">
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
                        onDesktopWidthChange={syncToPanelWidth}
                        onBeforeDesktopOpen={() => animateForPanelOpen()}
                        onAfterDesktopOpen={settleAfterPanelOpen}
                        onBeforeDesktopClose={() => animateForPanelClose()}
                        onAfterDesktopClose={settleAfterPanelClose}
                    />

                    </ResizablePanelGroup>
                    <div
                        ref={desktopControlsPositionRef}
                        className="pointer-events-none absolute top-2 right-2 z-10"
                    >
                        <div
                            ref={desktopControlsContentRef}
                            className="pointer-events-auto flex items-center gap-2"
                        >
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

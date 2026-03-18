"use client"

import type { Dispatch, RefObject, SetStateAction } from "react"
import { FormProvider, type UseFormReturn, type UseFieldArrayMove, type UseFieldArrayRemove, type FieldArrayWithId } from "react-hook-form"
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { type PanelImperativeHandle, type Layout } from "react-resizable-panels"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlusSignIcon, Settings02Icon } from "hugeicons-react"
import SpreadCanvas from "../../_canvas"
import ZoomControls from "../../_canvas/components/zoom-controls"
import SpreadSettingsPanel from "./spread-settings-panel"
import CardSettingsPanel from "./card-settings-panel"
import type { SpreadForm } from "@/types/spreads"
import type {
    CanvasCard,
    SpreadCanvasHandle,
    SpreadCanvasPositionUpdate,
    SpreadCanvasViewportRequest,
} from "../../_canvas/types"

interface SpreadEditorLayoutProps {
    // Form
    form: UseFormReturn<SpreadForm>
    // Canvas
    canvasRef: RefObject<SpreadCanvasHandle | null>
    canvasCards: CanvasCard[]
    cardKeys: string[]
    canvasRotationAngles: number[]
    viewportRequest: SpreadCanvasViewportRequest | null
    // Selection
    cards: FieldArrayWithId<SpreadForm, "positions">[]
    selectedCardIndex: number | null
    setSelectedCardIndex: Dispatch<SetStateAction<number | null>>
    // Card actions
    addCard: () => void
    addCardAt?: (x: number, y: number) => void
    remove: UseFieldArrayRemove
    move: UseFieldArrayMove
    handleCardRotationChange: (index: number, value: number) => void
    handleCanvasPositionsCommit: (updates: SpreadCanvasPositionUpdate[]) => void
    // Zoom
    zoomDisplay: number
    minZoomDisplay: number
    setZoomDisplay: (zoom: number) => void
    setMinZoomDisplay: (minZoom: number) => void
    zoomIn: () => void
    zoomOut: () => void
    resetZoom: () => void
    // Panel layout
    groupId: string
    defaultLayout: Layout | undefined
    spreadSettingsPanelRef: RefObject<PanelImperativeHandle | null>
    // Mobile
    isMobile: boolean
    spreadSheetOpen: boolean
    setSpreadSheetOpen: (open: boolean) => void
    // Mode
    isViewMode?: boolean
}

export default function SpreadEditorLayout({
    form,
    canvasRef,
    canvasCards,
    cardKeys,
    canvasRotationAngles,
    viewportRequest,
    cards,
    selectedCardIndex,
    setSelectedCardIndex,
    addCard,
    addCardAt,
    remove,
    move,
    handleCardRotationChange,
    handleCanvasPositionsCommit,
    zoomDisplay,
    minZoomDisplay,
    setZoomDisplay,
    setMinZoomDisplay,
    zoomIn,
    zoomOut,
    resetZoom,
    groupId,
    defaultLayout,
    spreadSettingsPanelRef,
    isMobile,
    spreadSheetOpen,
    setSpreadSheetOpen,
    isViewMode,
}: SpreadEditorLayoutProps) {
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

                        {/* Zoom Controls */}
                        <ZoomControls
                            zoom={zoomDisplay}
                            minZoom={minZoomDisplay}
                            onZoomIn={zoomIn}
                            onZoomOut={zoomOut}
                            onResetZoom={resetZoom}
                        />

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
                            <ZoomControls
                                zoom={zoomDisplay}
                                minZoom={minZoomDisplay}
                                onZoomIn={zoomIn}
                                onZoomOut={zoomOut}
                                onResetZoom={resetZoom}
                                className="pointer-events-auto"
                            />
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
        </div>
    )
}

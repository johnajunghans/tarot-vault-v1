import type { PointerEvent as ReactPointerEvent } from 'react'
import {
    Delete02Icon,
    LayerBringToFrontIcon,
    LayerSendToBackIcon,
    Rotate01Icon,
    RotateTopLeftIcon,
    RotateTopRightIcon,
} from '@hugeicons/core-free-icons'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import CardButton from './card-button'
import {
    PANEL_HEIGHT,
    PANEL_WIDTH,
    TOOLTIP_DELAY,
} from './button-panel-constants'

interface CenteredButtonPanelProps {
    x: number
    y: number
    tooltipAngle: number | null
    isDraggingRotation: boolean
    canReorderCards: boolean
    isAtBack: boolean
    isAtFront: boolean
    onRotateCCW: () => void
    onRotateDragStart: (e: ReactPointerEvent<HTMLButtonElement>) => void
    onRotateDragMove: (e: ReactPointerEvent<HTMLButtonElement>) => void
    onRotateDragEnd: (e: ReactPointerEvent<HTMLButtonElement>) => void
    onRotateCW: () => void
    onSendToBack: () => void
    onBringToFront: () => void
    onDelete: () => void
}

export default function CardButtonGroup({
    x,
    y,
    tooltipAngle,
    isDraggingRotation,
    canReorderCards,
    isAtBack,
    isAtFront,
    onRotateCCW,
    onRotateDragStart,
    onRotateDragMove,
    onRotateDragEnd,
    onRotateCW,
    onSendToBack,
    onBringToFront,
    onDelete,
}: CenteredButtonPanelProps) {
    return (
        <foreignObject
            x={x}
            y={y}
            width={PANEL_WIDTH}
            height={PANEL_HEIGHT}
            style={{ pointerEvents: 'auto', overflow: 'visible' }}
        >
            <div className="relative flex size-full items-center justify-center">
                <TooltipProvider delay={TOOLTIP_DELAY}>
                    {tooltipAngle !== null && (
                        <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2">
                            <div className="flex h-5 w-11 items-center justify-center rounded-full border border-white/15 bg-foreground/88 px-2 shadow-md">
                                <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-background">
                                    {tooltipAngle}&deg;
                                </span>
                            </div>
                        </div>
                    )}
                    <div className="grid size-full grid-cols-3 gap-0">
                        <CardButton
                            label="Rotate left"
                            icon={RotateTopLeftIcon}
                            edgeClassName="rounded-tl-[12px]"
                            onClick={onRotateCCW}
                        />
                        <CardButton
                            label="Drag to rotate"
                            icon={Rotate01Icon}
                            className={cn(
                                isDraggingRotation &&
                                    'border-gold/70 bg-gold/12 text-foreground shadow-md'
                            )}
                            style={{
                                cursor: isDraggingRotation ? 'grabbing' : 'grab',
                            }}
                            onPointerDown={onRotateDragStart}
                            onPointerMove={onRotateDragMove}
                            onPointerUp={onRotateDragEnd}
                        />
                        <CardButton
                            label="Rotate right"
                            icon={RotateTopRightIcon}
                            edgeClassName="rounded-tr-[12px]"
                            onClick={onRotateCW}
                        />
                        <CardButton
                            label="Send to back"
                            icon={LayerSendToBackIcon}
                            edgeClassName="rounded-bl-[12px]"
                            disabled={!canReorderCards || isAtBack}
                            onClick={onSendToBack}
                        />
                        <CardButton
                            label="Bring to front"
                            icon={LayerBringToFrontIcon}
                            disabled={!canReorderCards || isAtFront}
                            onClick={onBringToFront}
                        />
                        <CardButton
                            label="Remove position"
                            icon={Delete02Icon}
                            tone="danger"
                            edgeClassName="rounded-br-[12px]"
                            onClick={onDelete}
                        />
                    </div>
                </TooltipProvider>
            </div>
        </foreignObject>
    )
}
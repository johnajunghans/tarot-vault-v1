'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { MinusSignIcon, PlusSignIcon, Refresh01Icon } from 'hugeicons-react'
import {
    DEFAULT_ZOOM,
    ZOOM_MIN,
    ZOOM_MAX,
    normalizeZoom,
} from '../helpers/zoom'

const TOOLTIP_DELAY = 500

interface ZoomControlsProps {
    zoom: number
    minZoom?: number
    onZoomIn: () => void
    onZoomOut: () => void
    onResetZoom: () => void
    className?: string
}

export default function ZoomControls({
    zoom,
    minZoom = ZOOM_MIN,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    className,
}: ZoomControlsProps) {
    const normalizedZoom = normalizeZoom(zoom, minZoom)
    const defaultZoom = Math.max(DEFAULT_ZOOM, minZoom)
    const isDefaultZoom = normalizedZoom === defaultZoom

    return (
        <div
            className={`flex h-11 absolute top-2 right-2 z-10 items-center gap-1 rounded-xl border border-border/50 bg-background/90 px-1.5 shadow-md backdrop-blur-sm ${className ?? ''}`}
        >
            {!isDefaultZoom && (
                <>
                    <Tooltip delay={TOOLTIP_DELAY}>
                        <TooltipTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={onResetZoom}
                                >
                                    <Refresh01Icon />
                                </Button>
                            }
                        />
                        <TooltipContent>Reset zoom</TooltipContent>
                    </Tooltip>
                    <Separator orientation="vertical" className="my-2" />
                </>
            )}
            <Tooltip delay={TOOLTIP_DELAY}>
                <TooltipTrigger
                    render={
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={onZoomOut}
                            disabled={normalizedZoom <= minZoom}
                        >
                            <MinusSignIcon />
                        </Button>
                    }
                />
                <TooltipContent>Zoom out</TooltipContent>
            </Tooltip>
            <span className="min-w-12 select-none text-center font-mono text-sm text-muted-foreground">
                {Math.round(normalizedZoom * 100)}%
            </span>
            <Tooltip delay={TOOLTIP_DELAY}>
                <TooltipTrigger
                    render={
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={onZoomIn}
                            disabled={normalizedZoom >= ZOOM_MAX}
                        >
                            <PlusSignIcon />
                        </Button>
                    }
                />
                <TooltipContent>Zoom in</TooltipContent>
            </Tooltip>
        </div>
    )
}

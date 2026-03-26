'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    TooltipProvider,
    TooltipRoot,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { MinusSignIcon, PlusSignIcon, Refresh01Icon } from 'hugeicons-react'
import {
    DEFAULT_ZOOM,
    ZOOM_MIN,
    ZOOM_MAX,
    normalizeZoom,
} from '../lib/zoom'

const TOOLTIP_DELAY = 1000

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
        <TooltipProvider delay={TOOLTIP_DELAY}>
            <div
                className={`flex h-11 items-center gap-1 rounded-xl border border-border/50 bg-background/90 px-1.5 shadow-md backdrop-blur-sm ${className ?? 'absolute top-2 right-2 z-10'}`}
            >
                {!isDefaultZoom && (
                    <>
                        <TooltipRoot>
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
                        </TooltipRoot>
                        <Separator orientation="vertical" className="my-2" />
                    </>
                )}
                <TooltipRoot>
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
                </TooltipRoot>
                <span className="min-w-12 select-none text-center font-mono text-sm text-muted-foreground">
                    {Math.round(normalizedZoom * 100)}%
                </span>
                <TooltipRoot>
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
                </TooltipRoot>
            </div>
        </TooltipProvider>
    )
}

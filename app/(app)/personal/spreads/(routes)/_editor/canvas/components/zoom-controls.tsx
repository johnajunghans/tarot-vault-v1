'use client'

import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Separator } from '@/components/ui/separator'
import { useAppHotkey } from '@/hooks/use-app-hotkey'
import {
    TooltipProvider,
    TooltipRoot,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { MinusSignIcon, PlusSignIcon, Refresh01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
    DEFAULT_ZOOM,
    ZOOM_MIN,
    ZOOM_MAX,
    normalizeZoom,
} from '../lib/zoom'

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

    useAppHotkey('Mod+Shift+=', onZoomIn, {
        ignoreInputs: true,
    })

    useAppHotkey('Mod+Shift+-', onZoomOut, {
        ignoreInputs: true,
    })

    useAppHotkey('Mod+Shift+0', onResetZoom, {
        ignoreInputs: true,
    })

    const zoomShortcutClassName = 'ml-1'

    return (
        <TooltipProvider delay={TOOLTIP_DELAY}>
            <div
                className={`flex h-10 items-center gap-0.5 md:gap-1 rounded-xl border border-border/50 bg-background/90 px-1 md:px-1.5 shadow-md backdrop-blur-sm ${className ?? 'absolute top-2 right-2 z-10'}`}
            >     
                <TooltipRoot>
                    <TooltipTrigger
                        render={
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={onResetZoom}
                                disabled={isDefaultZoom}
                            >
                                <HugeiconsIcon icon={Refresh01Icon} />
                            </Button>
                        }
                    />
                    <TooltipContent>
                        Reset zoom
                        <Kbd className={zoomShortcutClassName}>⇧⌘ 0</Kbd>
                    </TooltipContent>
                </TooltipRoot>
                <Separator orientation="vertical" className="my-1.5" /> 
                <TooltipRoot>
                    <TooltipTrigger
                        render={
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={onZoomOut}
                                disabled={normalizedZoom <= minZoom}
                            >
                                <HugeiconsIcon icon={MinusSignIcon} />
                            </Button>
                        }
                    />
                    <TooltipContent>
                        Zoom out
                        <Kbd className={zoomShortcutClassName}>⇧⌘ -</Kbd>
                    </TooltipContent>
                </TooltipRoot>
                <span className="min-w-9 md:min-w-12 select-none text-center font-mono text-sm text-muted-foreground">
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
                                <HugeiconsIcon icon={PlusSignIcon} />
                            </Button>
                        }
                    />
                    <TooltipContent>
                        Zoom in
                        <Kbd className={zoomShortcutClassName}>⇧⌘ +</Kbd>
                    </TooltipContent>
                </TooltipRoot>
            </div>
        </TooltipProvider>
    )
}

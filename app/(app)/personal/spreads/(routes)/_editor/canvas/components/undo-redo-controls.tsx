'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Undo03Icon, Redo03Icon } from 'hugeicons-react'

const TOOLTIP_DELAY = 500

interface UndoRedoControlsProps {
    canUndo: boolean
    canRedo: boolean
    onUndo: () => void
    onRedo: () => void
    className?: string
}

export default function UndoRedoControls({
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    className,
}: UndoRedoControlsProps) {
    return (
        <div
            className={`flex h-11 items-center gap-1 rounded-xl border border-border/50 bg-background/90 px-1.5 shadow-md backdrop-blur-sm ${className ?? ''}`}
        >
            <Tooltip delay={TOOLTIP_DELAY}>
                <TooltipTrigger
                    render={
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={onUndo}
                            disabled={!canUndo}
                        >
                            <Undo03Icon />
                        </Button>
                    }
                />
                <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="my-2" />
            <Tooltip delay={TOOLTIP_DELAY}>
                <TooltipTrigger
                    render={
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={onRedo}
                            disabled={!canRedo}
                        >
                            <Redo03Icon />
                        </Button>
                    }
                />
                <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
            </Tooltip>
        </div>
    )
}

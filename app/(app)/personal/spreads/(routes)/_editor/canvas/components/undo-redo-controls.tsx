'use client'

import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Separator } from '@/components/ui/separator'
import {
    TooltipProvider,
    TooltipRoot,
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
    const shortcutClassName = 'ml-1'

    return (
        <TooltipProvider delay={TOOLTIP_DELAY}>
            <div
                className={`flex h-11 items-center gap-1 rounded-xl border border-border/50 bg-background/90 px-1.5 shadow-md backdrop-blur-sm ${className ?? ''}`}
            >
                <TooltipRoot>
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
                    <TooltipContent>
                        Undo
                        <Kbd className={shortcutClassName}>⌘ Z</Kbd>
                    </TooltipContent>
                </TooltipRoot>
                <Separator orientation="vertical" className="my-2" />
                <TooltipRoot>
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
                    <TooltipContent>
                        Redo
                        <Kbd className={shortcutClassName}>⇧⌘ Z</Kbd>
                    </TooltipContent>
                </TooltipRoot>
            </div>
        </TooltipProvider>
    )
}

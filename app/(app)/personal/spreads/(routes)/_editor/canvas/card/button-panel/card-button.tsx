import type { PointerEvent as ReactPointerEvent } from 'react'
import {
    Delete02Icon
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@/components/ui/button'
import { TooltipRoot, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const BUTTON_ICON_SIZE = 14

interface CardButtonProps {
    label: string
    icon: typeof Delete02Icon
    onClick?: () => void
    disabled?: boolean
    tone?: 'default' | 'danger'
    edgeClassName?: string
    className?: string
    style?: React.CSSProperties
    onPointerDown?: (e: ReactPointerEvent<HTMLButtonElement>) => void
    onPointerMove?: (e: ReactPointerEvent<HTMLButtonElement>) => void
    onPointerUp?: (e: ReactPointerEvent<HTMLButtonElement>) => void
}

export default function CardButton({
    label,
    icon,
    onClick,
    disabled = false,
    tone = 'default',
    edgeClassName,
    className,
    style,
    onPointerDown,
    onPointerMove,
    onPointerUp,
}: CardButtonProps) {
    return (
        <TooltipRoot>
            <TooltipTrigger
                render={
                    <Button
                        type="button"
                        variant={tone === "danger" ? "destructive" : "outline"}
                        size="icon-sm"
                        aria-label={label}
                        disabled={disabled}
                        className={cn(
                            'size-7 rounded-none border-border/60 bg-background/70 text-foreground shadow-sm backdrop-blur-md transition-colors',
                            'hover:bg-background/85',
                            'disabled:border-border/35 disabled:bg-background/35 disabled:text-muted-foreground/70',
                            // tone === 'danger' &&
                            //     'text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:text-destructive/55',
                            edgeClassName,
                            className
                        )}
                        style={style}
                        onClick={(e) => {
                            e.stopPropagation()
                            onClick?.()
                        }}
                        onPointerDown={(e) => {
                            e.stopPropagation()
                            onPointerDown?.(e)
                        }}
                        onPointerMove={(e) => {
                            e.stopPropagation()
                            onPointerMove?.(e)
                        }}
                        onPointerUp={(e) => {
                            e.stopPropagation()
                            onPointerUp?.(e)
                        }}
                    >
                        <HugeiconsIcon
                            icon={icon}
                            size={BUTTON_ICON_SIZE}
                            className="opacity-85"
                        />
                    </Button>
                }
            />
            <TooltipContent side="top">{label}</TooltipContent>
        </TooltipRoot>
    )
}
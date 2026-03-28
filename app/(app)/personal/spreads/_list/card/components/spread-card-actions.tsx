"use client"

import { Button } from "@/components/ui/button"
import { TooltipContent, TooltipRoot, TooltipTrigger } from "@/components/ui/tooltip"
import { Delete02Icon, StarIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

interface SpreadCardActionsProps {
    isDraft?: boolean
    cardsCount: number
    favorite?: boolean
    onDeleteDraft?: () => void
    onToggleFavorite?: () => void
    showFavorite?: boolean
}

export default function SpreadCardActions({
    isDraft,
    cardsCount,
    favorite,
    onDeleteDraft,
    onToggleFavorite,
    showFavorite,
}: SpreadCardActionsProps) {
    return (
        <>
            <span className="text-xs text-muted-foreground/70 font-medium">
                {cardsCount} {cardsCount === 1 ? "card" : "cards"}
            </span>
            {isDraft && (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="relative z-20 text-muted-foreground hover:text-destructive"
                    onClick={onDeleteDraft}
                >
                    <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" />
                </Button>
            )}
            {!isDraft && showFavorite && (
                <TooltipRoot>
                    <TooltipTrigger
                        render={
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="relative z-20"
                                onClick={onToggleFavorite}
                            >
                                <HugeiconsIcon
                                    icon={StarIcon}
                                    className="w-4 h-4"
                                    color="var(--gold)"
                                    fill={favorite ? "var(--gold)": undefined}
                                />
                            </Button>
                        }
                    />
                    <TooltipContent>{favorite ? "Unfavorite" : "Favorite"}</TooltipContent>
                </TooltipRoot>
            )}
        </>
    )
}

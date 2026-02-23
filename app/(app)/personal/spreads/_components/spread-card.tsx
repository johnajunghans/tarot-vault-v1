"use client"

import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardAction,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import ConfirmDialog from "../../../../_components/confirm-dialog"
import SpreadThumbnail from "./spread-thumbnail"
import { CardDB, SpreadDraft } from "@/types/spreads"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Delete02Icon, StarIcon } from "hugeicons-react"
import { Dispatch, SetStateAction, useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { routes } from "@/lib/routes"
import { useViewTransitionRouter } from "@/hooks/use-view-transition-router"

interface SpreadCardProps {
    name: string
    date: number
    isDraft?: boolean
    cards: CardDB[]
    setDrafts: Dispatch<SetStateAction<SpreadDraft[]>>
    id?: Id<"spreads">
    favorite?: boolean
}

export default function SpreadCard({
    name,
    date,
    isDraft,
    cards,
    setDrafts,
    id,
    favorite,
}: SpreadCardProps) {
    const router = useViewTransitionRouter()
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const toggleFavorite = useMutation(api.spreads.toggleFavorite)

    function handleCardClick() {
        if (isDraft) {
            router.push(routes.personal.spreads.new.draft(date))
        } else if (id) {
            router.push(routes.personal.spreads.id(id, "view"))
        }
    }

    function handleDeleteDraft(draftDate: number) {
        localStorage.removeItem(`spread-draft-${draftDate}`)
        setDrafts(prevDrafts => prevDrafts.filter(d => d.date !== draftDate))
        setShowDeleteDialog(false)
    }

    return (
        <>
        <Card
            className="group shadow-none hover:shadow-[0_2px_12px_-4px_var(--gold-muted)] border-border/50 hover:border-gold/30 transition-all duration-300 cursor-pointer overflow-hidden"
            onClick={handleCardClick}
        >
            <CardHeader className="pb-2">
                <CardTitle className="font-display text-base tracking-tight">{name}</CardTitle>
                {isDraft && (
                    <CardAction>
                        <Badge variant="secondary" className="text-[10px] font-medium">DRAFT</Badge>
                    </CardAction>
                )}
            </CardHeader>
            <CardContent className="flex justify-center py-4">
                <div className="transition-transform duration-300 group-hover:scale-105">
                    <SpreadThumbnail cards={cards} width={140} height={140} />
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center pt-2">
                <span className="text-xs text-muted-foreground/70 font-medium">
                    {cards.length} {cards.length === 1 ? "card" : "cards"}
                </span>
                {isDraft && (
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
                    >
                        <Delete02Icon className="w-4 h-4" />
                    </Button>
                )}
                {!isDraft && id !== undefined && (
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleFavorite({ _id: id })
                                    }}
                                >
                                    <StarIcon
                                        className="w-4 h-4"
                                        color="var(--gold)"
                                        fill={favorite ? "var(--gold)" : "none"}
                                    />
                                </Button>
                            }
                        />
                        <TooltipContent>{favorite ? "Unfavorite" : "Favorite"}</TooltipContent>
                    </Tooltip>
                )}
            </CardFooter>
        </Card>

        <ConfirmDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            title="Delete draft?"
            description="This draft will be permanently removed. This cannot be undone."
            cancelLabel="Cancel"
            confirmLabel="Delete"
            onConfirm={() => handleDeleteDraft(date)}
        />
        </>
    )
}

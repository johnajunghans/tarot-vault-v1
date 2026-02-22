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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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

// function formatDate(date: number): string {
//     const dateStr = new Date(date)
//     const month = String(dateStr.getMonth() + 1).padStart(2, "0")
//     const day = String(dateStr.getDate()).padStart(2, "0")
//     const year = dateStr.getFullYear()
//     return `${month}/${day}/${year}`
// }

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
        <Card className="shadow-none hover:shadow-sm -translate-y-0 hover:-translate-y-1 duration-150 cursor-pointer" onClick={handleCardClick}>
            <CardHeader>
                <CardTitle>{name}</CardTitle>
                {isDraft && (
                    <CardAction>
                        <Badge variant="secondary">DRAFT</Badge>
                    </CardAction>
                )}
            </CardHeader>
            <CardContent className="flex justify-center">
                <SpreadThumbnail cards={cards} width={150} height={150} />
            </CardContent>
            <CardFooter className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                    {`${cards.length}-Card`}
                </span>
                {isDraft && (
                    <Button variant="destructive" size="icon" onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}>
                        <Delete02Icon />
                    </Button>
                )}
                {!isDraft && id !== undefined && (
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon-lg"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleFavorite({ _id: id })
                                    }}
                                >
                                    <StarIcon
                                        color="var(--gold)"
                                        fill={favorite ? "var(--gold)" : "none"}
                                    />
                                </Button>
                            }
                        />
                        <TooltipContent>{favorite ? "Unfavorite Spread" : "Favorite Spread"}</TooltipContent>
                    </Tooltip>
                )}
            </CardFooter>
        </Card>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete draft?</DialogTitle>
                    <DialogDescription>
                        This draft will be permanently removed. This cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-end">
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={() => handleDeleteDraft(date)}>
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}

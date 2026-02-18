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

interface SpreadCardProps {
    name: string
    date: number
    isDraft?: boolean
    cards: CardDB[],
    setDrafts: Dispatch<SetStateAction<SpreadDraft[]>>
}

function formatDate(date: number): string {
    const dateStr = new Date(date)
    const month = String(dateStr.getMonth() + 1).padStart(2, "0")
    const day = String(dateStr.getDate()).padStart(2, "0")
    const year = dateStr.getFullYear()
    return `${month}/${day}/${year}`
}

export default function SpreadCard({
    name, 
    date, 
    isDraft,
    cards,
    setDrafts
}: SpreadCardProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    function handleDeleteDraft(draftDate: number) {
        localStorage.removeItem(`spread-draft-${draftDate}`)
        setDrafts(prevDrafts => prevDrafts.filter(d => d.date !== draftDate))
        setShowDeleteDialog(false)
    }

    return (
        <>
        <Card className="shadow-none hover:shadow-sm -translate-y-0 hover:-translate-y-1 duration-150 cursor-pointer">
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
                <span className="text-xs text-muted-foreground">
                    {formatDate(date)}
                </span>
                {isDraft && (
                    <Button variant="destructive" size="icon" onClick={() => setShowDeleteDialog(true)}>
                        <Delete02Icon />
                    </Button>
                )}
                {!isDraft && (
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button variant="ghost" size="icon-lg">
                                    <StarIcon className="stroke-gold" color="var(--gold)" />
                                </Button>
                            }
                        />
                        <TooltipContent>Favorite Spread</TooltipContent>
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

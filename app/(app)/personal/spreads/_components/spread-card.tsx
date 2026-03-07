"use client"

import { Badge } from "@/components/ui/badge"
import {
    Card,
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
import Link from "next/link"

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
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const toggleFavorite = useMutation(api.spreads.toggleFavorite)
    const href = isDraft
        ? routes.personal.spreads.new.draft(date)
        : id
          ? routes.personal.spreads.id(id, "view")
          : ""

    function handleDeleteDraft(draftDate: number) {
        localStorage.removeItem(`spread-draft-${draftDate}`)
        setDrafts(prevDrafts => prevDrafts.filter(d => d.date !== draftDate))
        setShowDeleteDialog(false)
    }

    return (
        <>
            <Card className="group relative hover:shadow-sm shadow-gold-muted/25 -translate-y-0 hover:-translate-y-1 border-border/50 hover:border-gold/30 transition-all duration-300 cursor-pointer overflow-hidden">
                <Link
                    href={href}
                    aria-label={`Open spread ${name}`}
                    className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />

                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                        <CardTitle className="font-display text-base tracking-tight">{name}</CardTitle>
                        {isDraft && (
                            <Badge variant="secondary" className="text-[10px] font-medium">DRAFT</Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="flex justify-center py-4">
                    <div className="transition-transform duration-300 group-hover:scale-105">
                        <SpreadThumbnail cards={cards} width={140} height={140} />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground/70 font-medium">
                        {cards.length} {cards.length === 1 ? "card" : "cards"}
                    </span>
                    {isDraft && (
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="relative z-20 text-muted-foreground hover:text-destructive"
                            onClick={() => setShowDeleteDialog(true)}
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
                                        className="relative z-20"
                                        onClick={() => {
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

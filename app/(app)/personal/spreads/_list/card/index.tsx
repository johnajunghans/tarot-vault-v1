"use client"

import type { Dispatch, SetStateAction } from "react"
import { useState } from "react"
import { useMutation } from "convex/react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import ConfirmDialog from "@/app/_components/confirm-dialog"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { routes } from "@/lib/routes"
import type { CardDB, SpreadDraft } from "@/types/spreads"
import SpreadCardActions from "./components/spread-card-actions"
import SpreadThumbnail from "./components/spread-thumbnail"

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
        setDrafts((prevDrafts) => prevDrafts.filter((draft) => draft.date !== draftDate))
        setShowDeleteDialog(false)
    }

    return (
        <>
            <Card className="group relative hover:shadow-sm shadow-gold-muted/25 -translate-y-0 hover:-translate-y-0.5 border-border/50 hover:border-gold/30 transition-all duration-300 cursor-pointer overflow-hidden">
                <Link
                    href={href}
                    aria-label={`Open spread ${name}`}
                    className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />

                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                        <CardTitle className="font-display text-base tracking-tight">{name}</CardTitle>
                        {isDraft && (
                            <Badge variant="secondary" className="text-[10px] font-medium">
                                DRAFT
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="flex justify-center py-4">
                    <div className="transition-transform duration-300 group-hover:scale-105">
                        <SpreadThumbnail cards={cards} width={140} height={140} />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <SpreadCardActions
                        isDraft={isDraft}
                        cardsCount={cards.length}
                        favorite={favorite}
                        onDeleteDraft={() => setShowDeleteDialog(true)}
                        onToggleFavorite={id ? () => toggleFavorite({ _id: id }) : undefined}
                        showFavorite={id !== undefined}
                    />
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

"use client"

import { useEffect, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import SpreadCard from "./_components/spread-card"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CardDB, SpreadDB, SpreadDraft } from "@/types/spreads"
import { Button } from "@/components/ui/button"
import { PlusSignIcon } from "hugeicons-react"
import { routes } from "@/lib/routes"
import { useLayoutDispatch } from "@/components/providers/layout-provider"
import SpreadsToolbar, { type SpreadFilter } from "./_components/spreads-toolbar"

type SpreadListItem =
    | {
        kind: "draft"
        key: number
        timestamp: number
        name: string
        cards: CardDB[]
      }
    | {
        kind: "saved"
        key: SpreadDB["_id"]
        timestamp: number
        name: string
        cards: CardDB[]
        id: SpreadDB["_id"]
        favorite: boolean | undefined
      }

function getFilter(value: string | null): SpreadFilter {
    if (value === "saved" || value === "drafts" || value === "all") {
        return value
    }

    return "all"
}

function loadDrafts(): SpreadDraft[] {
    const drafts: SpreadDraft[] = []

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key?.startsWith("spread-draft-")) continue

        const timestamp = Number(key.replace("spread-draft-", ""))
        if (isNaN(timestamp)) continue

        let draft: SpreadDraft | undefined = undefined
        try {
            const raw = localStorage.getItem(key)
            if (raw) {
                const parsed = JSON.parse(raw)
                draft = {
                    ...parsed,
                    name: parsed.name || "Untitled Spread",
                }
            }
        } catch (error) {
            console.error(`Error loading spread drafts: ${error}`)
        }

        if (draft) {
            drafts.push(draft)
        }
    }

    return drafts
}

function LoadingGrid() {
    return (
        <div className="">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                    <Card key={index} className="border-border/50">
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-3">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-5 w-14 rounded-full" />
                            </div>
                        </CardHeader>
                        <CardContent className="flex justify-center py-4">
                            <Skeleton className="h-[140px] w-[140px] rounded-xl" />
                        </CardContent>
                        <CardFooter className="justify-between">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-32 px-4 animate-fade-in-scale opacity-0">
            <div className="w-6 h-6 rotate-45 border border-gold/40 mb-8" />
            <h3 className="font-display text-xl font-bold mb-3 tracking-tight">
                Nothing here yet
            </h3>
            <p className="text-muted-foreground text-center max-w-xs mb-8 text-sm leading-relaxed">
                Create a spread to arrange your card positions.
            </p>
            <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={routes.personal.spreads.new.root} />}
                className="border-gold/50 text-gold hover:bg-gold/10 hover:border-gold"
            >
                <PlusSignIcon className="w-4 h-4 mr-1.5" strokeWidth={2} />
                New spread
            </Button>
        </div>
    )
}

export default function Spreads() {
    const spreads = useQuery(api.spreads.list)
    const searchParams = useSearchParams()
    const [drafts, setDrafts] = useState<SpreadDraft[]>(() => (
        typeof window === "undefined" ? [] : loadDrafts()
    ))
    const { setTitle, setActions, reset } = useLayoutDispatch()
    const filter = getFilter(searchParams.get("view"))
    const favoritesOnly = searchParams.get("fav") === "1"

    useEffect(() => {
        return () => reset()
    }, [reset])

    useEffect(() => {
        setTitle({ variant: "page", label: "Your Spreads", icon: "spreads" })
    }, [setTitle])

    useEffect(() => {
        setActions([{
            type: "new",
            label: "New Spread",
            href: routes.personal.spreads.new.root
        }])
    }, [])

    const isEmpty = spreads !== undefined && spreads.length === 0 && drafts.length === 0
    const isLoading = spreads === undefined
    const spreadItems: SpreadListItem[] = [
        ...drafts.map((draft) => ({
            kind: "draft" as const,
            key: draft.date,
            timestamp: draft.date,
            name: draft.name,
            cards: draft.positions,
        })),
        ...(spreads?.map((spread) => ({
            kind: "saved" as const,
            key: spread._id,
            timestamp: spread._creationTime,
            name: spread.name,
            cards: spread.positions,
            id: spread._id,
            favorite: spread.favorite,
        })) ?? []),
    ]
        .filter((item) => {
            if (filter === "saved") return item.kind === "saved"
            if (filter === "drafts") return item.kind === "draft"
            return true
        })
        .filter((item) => {
            if (!favoritesOnly) return true
            return item.kind === "saved" && item.favorite
        })
        .sort((a, b) => b.timestamp - a.timestamp)

    return (
        <div className="h-full min-h-0 overflow-y-auto p-4 pt-3">
            <div className="">
                <SpreadsToolbar filter={filter} favoritesOnly={favoritesOnly} />
            </div>
            {isLoading ? (
                <LoadingGrid />
            ) : isEmpty ? (
                <EmptyState />
            ) : (
                <div className="">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {spreadItems.map((item) => (
                            item.kind === "draft" ? (
                                <SpreadCard
                                    key={item.key}
                                    name={item.name}
                                    date={item.timestamp}
                                    isDraft
                                    cards={item.cards}
                                    setDrafts={setDrafts}
                                />
                            ) : (
                                <SpreadCard
                                    key={item.key}
                                    name={item.name}
                                    date={item.timestamp}
                                    cards={item.cards}
                                    setDrafts={setDrafts}
                                    id={item.id}
                                    favorite={item.favorite}
                                />
                            )
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

"use client"

import { useEffect, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import AppTopbar from "@/components/app/app-topbar"
import SpreadCard from "./spread-card"
import { Spinner } from "@/components/ui/spinner"
import { CardPosition } from "@/types/spreads"
import { cardData, spreadData } from "./spread-schema"

interface DraftSpread {
    name: string,
    description?: string,
    date: number,
    positions: CardPosition[]
}

// interface DraftSpread extends spreadData {
//     date: number
// }

function loadDrafts(): DraftSpread[] {
    const drafts: DraftSpread[] = []

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key?.startsWith("spread-draft-")) continue

        const timestamp = Number(key.replace("spread-draft-", ""))
        if (isNaN(timestamp)) continue

        // let name = "Untitled Spread"
        // let positions: cardData[] = []
        let draft: DraftSpread | undefined = undefined
        try {
            const raw = localStorage.getItem(key)
            if (raw) {
                const parsed = JSON.parse(raw)
                draft = {
                    ...parsed,
                    name: parsed.name || "Untitiled Spread"
                }
                // if (parsed.name) name = parsed.name
                // if (parsed.positions.length > 0) positions = parsed.positions
            }
        } catch {
            // ignore parse errors
        }

        draft && drafts.push(draft)
    }

    return drafts.sort((a, b) => b.date - a.date)
}

export default function Spreads() {
    const spreads = useQuery(api.tables.spreads.list)
    const [drafts, setDrafts] = useState<DraftSpread[]>([])

    useEffect(() => {
        setDrafts(loadDrafts())
    }, [])

    return (
        <>
            <AppTopbar />
            <div className="h-app-content overflow-y-auto p-4 space-y-6">
                {/* Drafts Section */}
                {drafts.length > 0 && (
                    <section>
                        <h2 className="text-sm font-medium text-muted-foreground mb-3">
                            Drafts
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {drafts.map((draft) => (
                                <SpreadCard
                                    key={draft.date}
                                    name={draft.name}
                                    date={new Date(draft.date)}
                                    isDraft
                                    cards={draft.positions}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Saved Spreads Section */}
                <section>
                    <h2 className="text-sm font-medium text-muted-foreground mb-3">
                        Spreads
                    </h2>
                    {spreads === undefined ? (
                        <div className="flex items-center justify-center py-12">
                            <Spinner />
                        </div>
                    ) : spreads.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-12 text-center">
                            No spreads yet. Create one to get started.
                        </p>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {spreads.map((spread) => (
                                <SpreadCard
                                    key={spread._id}
                                    name={spread.name}
                                    date={new Date(spread._creationTime)}
                                    cards={spread.positions}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    )
}

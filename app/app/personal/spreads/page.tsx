"use client"

import { useEffect, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import AppTopbar from "@/components/app/app-topbar"
import SpreadCard from "./spread-card"
import { Spinner } from "@/components/ui/spinner"
import { SpreadDraft } from "@/types/spreads"

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
                    name: parsed.name || "Untitiled Spread",
                }
            }
        } catch (error) {
            console.error(`Error loading spread drafts: ${error}`)
        }

        draft && drafts.push(draft)
    }

    return drafts.sort((a, b) => b.date - a.date)
}

export default function Spreads() {
    const spreads = useQuery(api.tables.spreads.list)
    const [drafts, setDrafts] = useState<SpreadDraft[]>([])

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
                                    date={draft.date}
                                    isDraft
                                    cards={draft.positions}
                                    setDrafts={setDrafts}
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
                                    date={spread._creationTime}
                                    cards={spread.positions}
                                    setDrafts={setDrafts}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    )
}

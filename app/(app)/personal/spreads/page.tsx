"use client"

import { useEffect, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from "next/navigation"
import AppTopbar from "@/app/(app)/_components/app-topbar"
import SpreadCard from "./_components/spread-card"
import { Spinner } from "@/components/ui/spinner"
import { SpreadDraft } from "@/types/spreads"
import { Button } from "@/components/ui/button"
import { Cards01Icon, PlusSignIcon } from "hugeicons-react"
import { routes } from "@/lib/routes"

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

        draft && drafts.push(draft)
    }

    return drafts.sort((a, b) => b.date - a.date)
}

function EmptyState() {
    const router = useRouter()

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
                onClick={() => router.push(routes.personal.spreads.new.root)}
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
    const [drafts, setDrafts] = useState<SpreadDraft[]>([])

    useEffect(() => {
        setDrafts(loadDrafts())
    }, [])

    const isEmpty = spreads !== undefined && spreads.length === 0 && drafts.length === 0
    const isLoading = spreads === undefined

    return (
        <>
            <AppTopbar 
                centerTitle={
                    <div className="flex items-center gap-3">
                        <Cards01Icon strokeWidth={1.25} className="w-5 h-5 text-gold" />
                        <h1 className="font-display text-xl font-bold tracking-tight">
                            Your Spreads
                        </h1>
                    </div>
                }
            />
            <div className="h-app-content overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Spinner />
                    </div>
                ) : isEmpty ? (
                    <EmptyState />
                ) : (
                    <div className="p-4 md:p-6 space-y-8">
                        {/* Quick create bar */}
                        {/* <div className="flex items-center gap-4">
                            
                            <Button
                                variant="primaryOutline"
                                size="sm"
                                onClick={() => router.push(routes.personal.spreads.new.root)}
                            >
                                <PlusSignIcon className="w-3.5 h-3.5 mr-1" strokeWidth={2} />
                                New Spread
                            </Button>
                        </div> */}

                        {/* Drafts Section */}
                        {drafts.length > 0 && (
                            <section>
                                <h2 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-[0.1em] mb-3">
                                    Drafts
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                        {spreads && spreads.length > 0 && (
                            <section>
                                {drafts.length > 0 && (
                                    <h2 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-[0.1em] mb-3">
                                        Saved
                                    </h2>
                                )}
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {spreads.map((spread) => (
                                        <SpreadCard
                                            key={spread._id}
                                            name={spread.name}
                                            date={spread._creationTime}
                                            cards={spread.positions}
                                            setDrafts={setDrafts}
                                            id={spread._id}
                                            favorite={spread.favorite}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}

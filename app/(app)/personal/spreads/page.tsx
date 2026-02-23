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
        <div className="flex flex-col items-center justify-center py-24 px-4 animate-fade-in-scale opacity-0">
            <div className="relative mb-8">
                <div className="flex items-end gap-2">
                    {["-6", "0", "6"].map((rotation, i) => (
                        <div
                            key={i}
                            className="w-16 h-24 rounded-lg border border-gold/20 bg-gradient-to-b from-gold/8 to-gold/3"
                            style={{
                                transform: `rotate(${rotation}deg)`,
                                animationDelay: `${i * 0.15}s`,
                            }}
                        >
                            <div className="absolute inset-1.5 rounded border border-gold/10" />
                        </div>
                    ))}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-3 bg-gold/5 rounded-full blur-md" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2 tracking-tight">
                No spreads yet
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mb-8 leading-relaxed">
                Design your first card layout — arrange positions for a Celtic Cross,
                a simple three-card pull, or something entirely your own.
            </p>
            <Button
                onClick={() => router.push(routes.personal.spreads.new.root)}
                className="bg-gold hover:bg-gold/90 text-background font-semibold rounded-lg shadow-lg shadow-gold/10 transition-all duration-300 hover:shadow-xl hover:shadow-gold/20"
            >
                <PlusSignIcon className="w-4 h-4 mr-1.5" strokeWidth={2} />
                Create your first spread
            </Button>
        </div>
    )
}

export default function Spreads() {
    const spreads = useQuery(api.spreads.list)
    const [drafts, setDrafts] = useState<SpreadDraft[]>([])
    const router = useRouter()

    useEffect(() => {
        setDrafts(loadDrafts())
    }, [])

    const isEmpty = spreads !== undefined && spreads.length === 0 && drafts.length === 0
    const isLoading = spreads === undefined

    return (
        <>
            <AppTopbar />
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
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <Cards01Icon strokeWidth={1.25} className="w-5 h-5 text-gold" />
                                <h1 className="font-display text-xl font-bold tracking-tight">
                                    Your Spreads
                                </h1>
                            </div>
                            {/* <Button
                                variant="primaryOutline"
                                size="sm"
                                onClick={() => router.push(routes.personal.spreads.new.root)}
                            >
                                <PlusSignIcon className="w-3.5 h-3.5 mr-1" strokeWidth={2} />
                                New Spread
                            </Button> */}
                        </div>

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

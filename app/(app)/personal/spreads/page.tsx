"use client"

import { useEffect, useRef, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useSearchParams } from "next/navigation"
import { routes } from "@/lib/routes"
import { useLayoutDispatch } from "@/components/providers/layout-provider"
import type { SpreadDraft } from "@/types/spreads"
import {
    SpreadCard,
    SpreadsToolbar,
    LoadingGrid,
    EmptyState,
    loadDrafts,
    getFilter,
    getSort,
    getSortDir,
    buildSpreadList,
} from "./_list"

export default function Spreads() {
    const spreads = useQuery(api.spreads.list)
    const searchParams = useSearchParams()
    const searchInputRef = useRef<HTMLInputElement>(null)
    const [drafts, setDrafts] = useState<SpreadDraft[]>(() => (
        typeof window === "undefined" ? [] : loadDrafts()
    ))
    const { setTitle, setActions, reset } = useLayoutDispatch()
    const [search, setSearch] = useState("")
    const filter = getFilter(searchParams.get("view"))
    const favoritesOnly = searchParams.get("fav") === "1"
    const sortField = getSort(searchParams.get("sort"))
    const sortDir = getSortDir(searchParams.get("dir"))

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

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented) return
            if (event.key.toLowerCase() !== "k") return
            if (!event.metaKey && !event.ctrlKey) return
            if (event.altKey || event.shiftKey) return

            const target = event.target

            if (target instanceof HTMLElement) {
                const isEditable = (
                    target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.tagName === "SELECT" ||
                    target.isContentEditable
                )

                if (isEditable && target !== searchInputRef.current) {
                    return
                }
            }

            event.preventDefault()
            searchInputRef.current?.focus()
            searchInputRef.current?.select()
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])

    const isEmpty = spreads !== undefined && spreads.length === 0 && drafts.length === 0
    const isLoading = spreads === undefined
    const spreadItems = buildSpreadList(spreads, drafts, filter, favoritesOnly, search, sortField, sortDir)

    return (
        <div className="h-full min-h-0 overflow-y-auto p-4 pt-3">
            <div className="">
                <SpreadsToolbar
                    filter={filter}
                    favoritesOnly={favoritesOnly}
                    sortField={sortField}
                    sortDir={sortDir}
                    search={search}
                    onSearchChange={setSearch}
                    searchInputRef={searchInputRef}
                />
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

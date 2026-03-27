"use client"

import type { RefObject } from "react"
import { useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { SpreadDB, SpreadDraft } from "@/types/spreads"
import SpreadCard from "./card"
import EmptyState from "./components/empty-state"
import LoadingGrid from "./components/loading-grid"
import { loadDrafts } from "./lib/load-drafts"
import SpreadsToolbar from "./toolbar"
import {
    buildSpreadList,
    getFilter,
    getSort,
    getSortDir,
} from "./toolbar"

export interface SpreadsListProps {
    spreads: SpreadDB[] | undefined
    searchInputRef?: RefObject<HTMLInputElement | null>
}

export default function SpreadsList({ spreads, searchInputRef }: SpreadsListProps) {
    const searchParams = useSearchParams()
    const internalSearchInputRef = useRef<HTMLInputElement>(null)
    const toolbarSearchInputRef = searchInputRef ?? internalSearchInputRef
    const [drafts, setDrafts] = useState<SpreadDraft[]>(() => (
        typeof window === "undefined" ? [] : loadDrafts()
    ))
    const [search, setSearch] = useState("")
    const filter = getFilter(searchParams.get("view"))
    const favoritesOnly = searchParams.get("fav") === "1"
    const sortField = getSort(searchParams.get("sort"))
    const sortDir = getSortDir(searchParams.get("dir"))
    const isEmpty = spreads !== undefined && spreads.length === 0 && drafts.length === 0
    const isLoading = spreads === undefined
    const spreadItems = buildSpreadList(spreads, drafts, filter, favoritesOnly, search, sortField, sortDir)

    return (
        <div className="h-full min-h-0 overflow-y-auto p-4 pt-3">
            <SpreadsToolbar
                filter={filter}
                favoritesOnly={favoritesOnly}
                sortField={sortField}
                sortDir={sortDir}
                search={search}
                onSearchChange={setSearch}
                searchInputRef={toolbarSearchInputRef}
            />
            {isLoading ? (
                <LoadingGrid />
            ) : isEmpty ? (
                <EmptyState />
            ) : (
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
            )}
        </div>
    )
}

export { loadDrafts } from "./lib/load-drafts"
export type { SpreadFilter, SpreadSortDir, SpreadSortField, SpreadListItem } from "./toolbar/filter-spreads"
export { getFilter, getSort, getSortDir, buildSpreadList } from "./toolbar"

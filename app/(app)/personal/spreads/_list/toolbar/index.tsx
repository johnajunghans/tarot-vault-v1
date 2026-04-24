"use client"

import type { RefObject } from "react"
import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FilterHorizontalIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import FilterToggleGroup from "./components/filter-toggle-group"
import FavoritesToggle from "./components/favorites-toggle"
import FilterSheet from "./components/filter-sheet"
import SearchInput from "./components/search-input"
import SortMenu from "./components/sort-menu"
import type { SpreadFilter, SpreadSortDir, SpreadSortField } from "./filter-spreads"

interface SpreadsToolbarProps {
    filter: SpreadFilter
    favoritesOnly: boolean
    sortField: SpreadSortField
    sortDir: SpreadSortDir
    search: string
    onSearchChange: (value: string) => void
    searchInputRef?: RefObject<HTMLInputElement | null>
}

export default function SpreadsToolbar({
    filter,
    favoritesOnly,
    sortField,
    sortDir,
    search,
    onSearchChange,
    searchInputRef,
}: SpreadsToolbarProps) {
    const isMobile = useIsMobile()
    const [sheetOpen, setSheetOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()

    function updateParams(updates: Record<string, string | null>) {
        const params = new URLSearchParams(searchParams.toString())

        for (const [key, value] of Object.entries(updates)) {
            if (value === null) {
                params.delete(key)
            } else {
                params.set(key, value)
            }
        }

        const nextUrl = params.toString()
            ? `${pathname}?${params.toString()}`
            : pathname
        router.replace(nextUrl)
    }

    function handleFilterChange(nextFilter: SpreadFilter) {
        const updates: Record<string, string | null> = {
            view: nextFilter === "all" ? null : nextFilter,
        }

        if (nextFilter === "drafts" && favoritesOnly) {
            updates.fav = null
        }

        updateParams(updates)
    }

    function handleReset() {
        updateParams({ view: null, fav: null, sort: null, dir: null })
    }

    return (
        <div className="flex flex-wrap items-center gap-2 w-full pb-4">
            {isMobile ? (
                <>
                    <Button
                        variant="secondary"
                        size="icon-lg"
                        aria-label="Filters and sort"
                        onClick={() => setSheetOpen(true)}
                    >
                        <HugeiconsIcon icon={FilterHorizontalIcon} size={20} strokeWidth={1.25} color="var(--muted-foreground)" className="size-5" />
                    </Button>
                    <FilterSheet
                        open={sheetOpen}
                        onOpenChange={setSheetOpen}
                        filter={filter}
                        favoritesOnly={favoritesOnly}
                        sortField={sortField}
                        sortDir={sortDir}
                        onFilterChange={handleFilterChange}
                        onFavoritesToggle={(pressed) => updateParams({ fav: pressed ? "1" : null })}
                        onSortFieldChange={(field) => updateParams({ sort: field === "date" ? null : field })}
                        onSortDirChange={(dir) => updateParams({ dir: dir === "desc" ? null : dir })}
                        onReset={handleReset}
                    />
                </>
            ) : (
                <>
                    <FilterToggleGroup
                        filter={filter}
                        onChange={handleFilterChange}
                    />
                    <FavoritesToggle
                        favoritesOnly={favoritesOnly}
                        onToggle={(pressed) => updateParams({ fav: pressed ? "1" : null })}
                        disabled={filter === "drafts"}
                    />
                    <SortMenu
                        sortField={sortField}
                        sortDir={sortDir}
                        onSortFieldChange={(field) => updateParams({ sort: field === "date" ? null : field })}
                        onSortDirChange={(dir) => updateParams({ dir: dir === "desc" ? null : dir })}
                    />
                </>
            )}
            <div className="ml-auto flex items-center flex-1 md:flex-0 gap-2">
                <SearchInput
                    search={search}
                    onSearchChange={onSearchChange}
                    inputRef={searchInputRef}
                />
            </div>
        </div>
    )
}

export type { SpreadFilter, SpreadSortDir, SpreadSortField } from "./filter-spreads"
export {
    buildSpreadList,
    getFilter,
    getSort,
    getSortDir,
} from "./filter-spreads"

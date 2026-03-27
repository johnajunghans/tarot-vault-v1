"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import FilterToggleGroup from "./components/filter-toggle-group"
import FavoritesToggle from "./components/favorites-toggle"
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
}

export default function SpreadsToolbar({
    filter,
    favoritesOnly,
    sortField,
    sortDir,
    search,
    onSearchChange,
}: SpreadsToolbarProps) {
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

    return (
        <div className="flex flex-wrap items-center gap-2 w-full pb-4">
            <FilterToggleGroup
                filter={filter}
                onChange={handleFilterChange}
            />
            {filter !== "drafts" && (
                <FavoritesToggle
                    favoritesOnly={favoritesOnly}
                    onToggle={(pressed) => updateParams({ fav: pressed ? "1" : null })}
                />
            )}
            <SortMenu
                    sortField={sortField}
                    sortDir={sortDir}
                    onSortFieldChange={(field) => updateParams({ sort: field === "date" ? null : field })}
                    onSortDirChange={(dir) => updateParams({ dir: dir === "desc" ? null : dir })}
                />
            <div className="ml-auto flex items-center gap-2">
                <SearchInput
                    search={search}
                    onSearchChange={onSearchChange}
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

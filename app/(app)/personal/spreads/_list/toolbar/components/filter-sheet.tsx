"use client"

import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import FilterToggleGroup from "./filter-toggle-group"
import FavoritesToggle from "./favorites-toggle"
import { SortMenuInline } from "./sort-menu"
import type { SpreadFilter, SpreadSortDir, SpreadSortField } from "../filter-spreads"

interface FilterSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    filter: SpreadFilter
    favoritesOnly: boolean
    sortField: SpreadSortField
    sortDir: SpreadSortDir
    onFilterChange: (filter: SpreadFilter) => void
    onFavoritesToggle: (pressed: boolean) => void
    onSortFieldChange: (field: SpreadSortField) => void
    onSortDirChange: (dir: SpreadSortDir) => void
    onReset: () => void
}

const isDefault = (
    filter: SpreadFilter,
    favoritesOnly: boolean,
    sortField: SpreadSortField,
    sortDir: SpreadSortDir,
) =>
    filter === "all" &&
    !favoritesOnly &&
    sortField === "date" &&
    sortDir === "desc"

export default function FilterSheet({
    open,
    onOpenChange,
    filter,
    favoritesOnly,
    sortField,
    sortDir,
    onFilterChange,
    onFavoritesToggle,
    onSortFieldChange,
    onSortDirChange,
    onReset,
}: FilterSheetProps) {
    const atDefault = isDefault(filter, favoritesOnly, sortField, sortDir)

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" showCloseButton className="rounded-t-2xl pb-safe">
                <SheetHeader className="pb-2">
                    <SheetTitle>Filters &amp; Sort</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-5 px-4 pb-4">
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Show</span>
                        <FilterToggleGroup
                            filter={filter}
                            onChange={onFilterChange}
                            isMobile
                        />
                         <FavoritesToggle
                            favoritesOnly={favoritesOnly}
                            onToggle={onFavoritesToggle}
                            disabled={filter === "drafts"}
                            isMobile
                        />
                    </div>

                    <SortMenuInline
                        sortField={sortField}
                        sortDir={sortDir}
                        onSortFieldChange={onSortFieldChange}
                        onSortDirChange={onSortDirChange}
                    />

                    <Button
                        variant="ghost"
                        className="w-full h-12 text-base text-muted-foreground"
                        disabled={atDefault}
                        onClick={onReset}
                    >
                        Reset filters
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

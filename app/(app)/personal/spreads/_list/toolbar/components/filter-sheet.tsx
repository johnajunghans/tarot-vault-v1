"use client"

import { FilterIcon, StarIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
    FILTER_OPTIONS,
    SORT_FIELD_OPTIONS,
    type SpreadFilter,
    type SpreadSortDir,
    type SpreadSortField,
} from "../filter-spreads"

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

    function handleFilterChange(values: unknown[]) {
        if (values.length === 0) return
        onFilterChange(values[0] as SpreadFilter)
    }

    function handleSortFieldChange(values: unknown[]) {
        if (values.length === 0) return
        onSortFieldChange(values[0] as SpreadSortField)
    }

    function handleSortDirChange(values: unknown[]) {
        if (values.length === 0) return
        onSortDirChange(values[0] as SpreadSortDir)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" showCloseButton className="rounded-t-2xl pb-safe">
                <SheetHeader className="pb-2">
                    <SheetTitle>Filters &amp; Sort</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-5 px-4 pb-4">
                    {/* Show */}
                    <section className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Show</span>
                        <ToggleGroup
                            value={[filter]}
                            onValueChange={handleFilterChange}
                            aria-label="Filter spreads by status"
                            className="w-full"
                        >
                            {FILTER_OPTIONS.map((option) => (
                                <ToggleGroupItem
                                    key={option.value}
                                    value={option.value}
                                    className="flex-1 h-12 text-base"
                                >
                                    {option.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </section>

                    {/* Favorites */}
                    <section className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Favorites</span>
                        <Toggle
                            variant="single"
                            pressed={favoritesOnly}
                            onPressedChange={onFavoritesToggle}
                            disabled={filter === "drafts"}
                            aria-label="Show favorites only"
                            className="w-full h-12 text-base justify-start gap-3 data-[pressed]:[&>svg]:fill-gold"
                        >
                            <HugeiconsIcon icon={StarIcon} />
                            <span>Favorites only</span>
                        </Toggle>
                    </section>

                    {/* Sort by */}
                    <section className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sort by</span>
                        <ToggleGroup
                            value={[sortField]}
                            onValueChange={handleSortFieldChange}
                            aria-label="Sort spreads by field"
                            className="w-full"
                        >
                            {SORT_FIELD_OPTIONS.map((option) => (
                                <ToggleGroupItem
                                    key={option.value}
                                    value={option.value}
                                    className="flex-1 h-12 text-base"
                                >
                                    {option.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </section>

                    {/* Direction */}
                    <section className="flex flex-col gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Direction</span>
                        <ToggleGroup
                            value={[sortDir]}
                            onValueChange={handleSortDirChange}
                            aria-label="Sort direction"
                            className="w-full"
                        >
                            <ToggleGroupItem value="desc" className="flex-1 h-12 text-base">
                                Newest first
                            </ToggleGroupItem>
                            <ToggleGroupItem value="asc" className="flex-1 h-12 text-base">
                                Oldest first
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </section>

                    {/* Reset */}
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

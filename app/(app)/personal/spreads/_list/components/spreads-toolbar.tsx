"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Toggle } from "@/components/ui/toggle"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import {
    StarIcon,
    Search01Icon,
    SortByDown01Icon,
    SortByUp01Icon,
    ArrowUp01Icon,
    ArrowDown01Icon,
} from "hugeicons-react"
import type { SpreadSortField, SpreadSortDir } from "../lib/filter-spreads"

export type SpreadFilter = "all" | "saved" | "drafts"

const FILTER_OPTIONS: Array<{ value: SpreadFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "saved", label: "Saved" },
    { value: "drafts", label: "Drafts" },
]

const SORT_FIELD_OPTIONS: Array<{ value: SpreadSortField; label: string }> = [
    { value: "date", label: "Date" },
    { value: "name", label: "Name" },
    { value: "cards", label: "Card count" },
]

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

    function handleFilterChange(groupValue: unknown[]) {
        if (groupValue.length === 0) return

        const nextFilter = groupValue[0] as SpreadFilter
        const updates: Record<string, string | null> = {
            view: nextFilter === "all" ? null : nextFilter,
        }

        // Clear favorites when switching to drafts
        if (nextFilter === "drafts" && favoritesOnly) {
            updates.fav = null
        }

        updateParams(updates)
    }

    function handleFavoritesToggle(pressed: boolean) {
        updateParams({ fav: pressed ? "1" : null })
    }

    function handleSortFieldChange(value: unknown) {
        const field = value as SpreadSortField
        updateParams({ sort: field === "date" ? null : field })
    }

    function handleSortDirChange(value: unknown) {
        const dir = value as SpreadSortDir
        updateParams({ dir: dir === "desc" ? null : dir })
    }

    const SortIcon = sortDir === "desc" ? SortByDown01Icon : SortByUp01Icon
    const currentSortLabel = SORT_FIELD_OPTIONS.find((o) => o.value === sortField)?.label ?? "Date"

    return (
        <div className="flex flex-wrap items-center gap-2 w-full pb-4">
            <ToggleGroup
                value={[filter]}
                onValueChange={handleFilterChange}
                size="sm"
                spacing={1}
            >
                {FILTER_OPTIONS.map((option) => (
                    <ToggleGroupItem
                        key={option.value}
                        value={option.value}
                        className="px-2"
                    >
                        {option.label}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
            {filter !== "drafts" && (
                <Toggle
                    variant="single"
                    pressed={favoritesOnly}
                    onPressedChange={handleFavoritesToggle}
                    aria-label="Show favorites only"
                    className="h-[34px]"
                >
                    <StarIcon
                        className="w-4 h-4"
                        strokeWidth={1.5}
                        fill={favoritesOnly ? "var(--gold)" : "none"}
                        color={favoritesOnly ? "var(--gold)" : "currentColor"}
                    />
                    <span>Favorites</span>
                </Toggle>
            )}
            <div className="ml-auto flex items-center gap-2">
                <InputGroup className="w-48 h-8.5">
                    <InputGroupAddon>
                        <Search01Icon className="w-4 h-4" strokeWidth={1.5} />
                    </InputGroupAddon>
                    <InputGroupInput
                        placeholder="Search spreads..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </InputGroup>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button variant="outline" className="h-8.5">
                                <SortIcon className="w-4 h-4" strokeWidth={1.5} />
                                <span>{currentSortLabel}</span>
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                                value={sortField}
                                onValueChange={handleSortFieldChange}
                            >
                                {SORT_FIELD_OPTIONS.map((option) => (
                                    <DropdownMenuRadioItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Direction</DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                                value={sortDir}
                                onValueChange={handleSortDirChange}
                            >
                                <DropdownMenuRadioItem value="asc">
                                    <span>Ascending</span>
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="desc">
                                    <span>Descending</span>
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

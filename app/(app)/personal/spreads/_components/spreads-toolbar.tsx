"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Toggle } from "@/components/ui/toggle"
import { StarIcon } from "hugeicons-react"

export type SpreadFilter = "all" | "saved" | "drafts"

const FILTER_OPTIONS: Array<{ value: SpreadFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "saved", label: "Saved" },
    { value: "drafts", label: "Drafts" },
]

interface SpreadsToolbarProps {
    filter: SpreadFilter
    favoritesOnly: boolean
}

export default function SpreadsToolbar({ filter, favoritesOnly }: SpreadsToolbarProps) {
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

    return (
        <div className="flex items-center gap-2 w-full pb-4">
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
                        className="px-2 pt-0.5"
                    >
                        {option.label}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
            {filter !== "drafts" && (
                <Toggle
                    // size="sm"
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
                    <span className="pt-0.5">Favorites</span>
                </Toggle>
            )}
        </div>
    )
}

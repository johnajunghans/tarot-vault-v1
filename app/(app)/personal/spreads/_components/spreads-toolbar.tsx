"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export type SpreadFilter = "all" | "saved" | "drafts"

const FILTER_OPTIONS: Array<{ value: SpreadFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "saved", label: "Saved" },
    { value: "drafts", label: "Drafts" },
]

interface SpreadsToolbarProps {
    filter: SpreadFilter
}

export default function SpreadsToolbar({ filter }: SpreadsToolbarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()

    function handleFilterChange(groupValue: unknown[]) {
        if (groupValue.length === 0) return

        const nextFilter = groupValue[0] as SpreadFilter
        const params = new URLSearchParams(searchParams.toString())

        if (nextFilter === "all") {
            params.delete("view")
        } else {
            params.set("view", nextFilter)
        }

        const nextUrl = params.toString()
            ? `${pathname}?${params.toString()}`
            : pathname
        router.replace(nextUrl)
    }

    return (
        <div className="flex items-center gap-3 pb-4">
            <ToggleGroup
                value={[filter]}
                onValueChange={handleFilterChange}
                // size="sm"
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
        </div>
    )
}

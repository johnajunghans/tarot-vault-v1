import { SortByDown01Icon, SortByUp01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import {
    ResponsiveMenu,
    ResponsiveMenuTrigger,
    ResponsiveMenuContent,
    ResponsiveMenuRadioGroup,
    ResponsiveMenuRadioItem,
    ResponsiveMenuSeparator,
    ResponsiveMenuLabel,
    ResponsiveMenuGroup,
} from "@/components/ui/responsive-menu"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
    SORT_FIELD_OPTIONS,
    type SpreadSortDir,
    type SpreadSortField,
} from "../filter-spreads"

interface SortMenuProps {
    sortField: SpreadSortField
    sortDir: SpreadSortDir
    onSortFieldChange: (field: SpreadSortField) => void
    onSortDirChange: (dir: SpreadSortDir) => void
}

export default function SortMenu({
    sortField,
    sortDir,
    onSortFieldChange,
    onSortDirChange,
}: SortMenuProps) {
    const sortIcon = sortDir === "desc" ? SortByDown01Icon : SortByUp01Icon
    const currentSortLabel = SORT_FIELD_OPTIONS.find((option) => option.value === sortField)?.label ?? "Date"

    return (
        <ResponsiveMenu>
            <ResponsiveMenuTrigger
                render={
                    <Button
                        variant="secondary"
                        className="h-9 text-muted-foreground hover:text-foreground hover:bg-secondary data-popup-open:text-foreground"
                        aria-label={`Sort spreads by ${currentSortLabel}, ${sortDir === "desc" ? "descending" : "ascending"}`}
                    >
                        <HugeiconsIcon icon={sortIcon} className="w-4 h-4" strokeWidth={1.5} />
                        <span>{currentSortLabel}</span>
                    </Button>
                }
            />
            <ResponsiveMenuContent title="Sort" align="end">
                <ResponsiveMenuGroup>
                    <ResponsiveMenuLabel>Sort by</ResponsiveMenuLabel>
                    <ResponsiveMenuRadioGroup
                        value={sortField}
                        onValueChange={(value) => onSortFieldChange(value as SpreadSortField)}
                    >
                        {SORT_FIELD_OPTIONS.map((option) => (
                            <ResponsiveMenuRadioItem
                                key={option.value}
                                value={option.value}
                            >
                                {option.label}
                            </ResponsiveMenuRadioItem>
                        ))}
                    </ResponsiveMenuRadioGroup>
                </ResponsiveMenuGroup>
                <ResponsiveMenuSeparator className="opacity-50 dark:opacity-100" />
                <ResponsiveMenuGroup>
                    <ResponsiveMenuLabel>Direction</ResponsiveMenuLabel>
                    <ResponsiveMenuRadioGroup
                        value={sortDir}
                        onValueChange={(value) => onSortDirChange(value as SpreadSortDir)}
                    >
                        <ResponsiveMenuRadioItem value="asc">
                            <span>Ascending</span>
                        </ResponsiveMenuRadioItem>
                        <ResponsiveMenuRadioItem value="desc">
                            <span>Descending</span>
                        </ResponsiveMenuRadioItem>
                    </ResponsiveMenuRadioGroup>
                </ResponsiveMenuGroup>
            </ResponsiveMenuContent>
        </ResponsiveMenu>
    )
}

export function SortMenuInline({
    sortField,
    sortDir,
    onSortFieldChange,
    onSortDirChange,
}: SortMenuProps) {
    function handleFieldChange(values: unknown[]) {
        if (values.length === 0) return
        onSortFieldChange(values[0] as SpreadSortField)
    }

    function handleDirChange(values: unknown[]) {
        if (values.length === 0) return
        onSortDirChange(values[0] as SpreadSortDir)
    }

    return (
        <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sort by</span>
            <ToggleGroup
                value={[sortField]}
                onValueChange={handleFieldChange}
                aria-label="Sort spreads by field"
                size="mobile-lg"
                spacing={1}
                className="w-full"
            >
                {SORT_FIELD_OPTIONS.map((option) => (
                    <ToggleGroupItem
                        key={option.value}
                        value={option.value}
                        className="flex-1"
                    >
                        {option.label}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
            <ToggleGroup
                value={[sortDir]}
                onValueChange={handleDirChange}
                aria-label="Sort direction"
                size="mobile-lg"
                spacing={1}
                className="w-full"
            >
                <ToggleGroupItem value="asc" className="flex-1">
                    Ascending
                </ToggleGroupItem>
                <ToggleGroupItem value="desc" className="flex-1">
                    Descending
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    )
}

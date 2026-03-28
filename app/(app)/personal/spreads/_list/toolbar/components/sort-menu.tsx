import { SortByDown01Icon, SortByUp01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
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
        <DropdownMenu>
            <DropdownMenuTrigger
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
            <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                        value={sortField}
                        onValueChange={(value) => onSortFieldChange(value as SpreadSortField)}
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
                <DropdownMenuSeparator className="opacity-50 dark:opacity-100" />
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Direction</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                        value={sortDir}
                        onValueChange={(value) => onSortDirChange(value as SpreadSortDir)}
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
    )
}

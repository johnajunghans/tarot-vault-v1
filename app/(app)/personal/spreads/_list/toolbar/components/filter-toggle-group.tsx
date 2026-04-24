import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { FILTER_OPTIONS, type SpreadFilter } from "../filter-spreads"

interface FilterToggleGroupProps {
    filter: SpreadFilter
    onChange: (filter: SpreadFilter) => void
    isMobile?: boolean
}

export default function FilterToggleGroup({
    filter,
    onChange,
    isMobile = false,
}: FilterToggleGroupProps) {
    function handleValueChange(groupValue: unknown[]) {
        if (groupValue.length === 0) return
        onChange(groupValue[0] as SpreadFilter)
    }

    return (
        <ToggleGroup
            value={[filter]}
            onValueChange={handleValueChange}
            aria-label="Filter spreads by status"
            size={isMobile ? "mobile-lg" : "sm"}
            spacing={1}
            className={isMobile ? "w-full" : "h-9 px-1"}
        >
            {FILTER_OPTIONS.map((option) => (
                <ToggleGroupItem
                    key={option.value}
                    value={option.value}
                    className={isMobile ? "flex-1" : undefined}
                >
                    {option.label}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    )
}

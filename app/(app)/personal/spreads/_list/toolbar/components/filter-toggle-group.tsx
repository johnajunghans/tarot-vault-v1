import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { FILTER_OPTIONS, type SpreadFilter } from "../filter-spreads"

interface FilterToggleGroupProps {
    filter: SpreadFilter
    onChange: (filter: SpreadFilter) => void
}

export default function FilterToggleGroup({
    filter,
    onChange,
}: FilterToggleGroupProps) {
    function handleValueChange(groupValue: unknown[]) {
        if (groupValue.length === 0) return
        onChange(groupValue[0] as SpreadFilter)
    }

    return (
        <ToggleGroup
            value={[filter]}
            onValueChange={handleValueChange}
            size="sm"
            spacing={1}
            className="h-9 px-1"
            // className="bg-transparent border border-border"
            // variant="single"
        >
            {FILTER_OPTIONS.map((option) => (
                <ToggleGroupItem
                    key={option.value}
                    value={option.value}
                    // className="bg-transparent data-[pressed]:bg-secondary"
                >
                    {option.label}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    )
}

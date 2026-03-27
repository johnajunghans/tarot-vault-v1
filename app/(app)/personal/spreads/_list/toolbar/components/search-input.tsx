import { Search01Icon } from "hugeicons-react"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"

interface SearchInputProps {
    search: string
    onSearchChange: (value: string) => void
}

export default function SearchInput({
    search,
    onSearchChange,
}: SearchInputProps) {
    return (
        <InputGroup className="w-48 h-9">
            <InputGroupAddon>
                <Search01Icon className="w-4 h-4" strokeWidth={1.5} />
            </InputGroupAddon>
            <InputGroupInput
                aria-label="Search spreads"
                placeholder="Search spreads..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </InputGroup>
    )
}

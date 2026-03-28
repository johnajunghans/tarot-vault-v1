import type { RefObject } from "react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"

interface SearchInputProps {
    search: string
    onSearchChange: (value: string) => void
    inputRef?: RefObject<HTMLInputElement | null>
}

export default function SearchInput({
    search,
    onSearchChange,
    inputRef,
}: SearchInputProps) {
    return (
        <InputGroup className="h-9 w-full sm:w-64 md:w-72">
            <InputGroupAddon>
                <HugeiconsIcon icon={Search01Icon} className="w-4 h-4" strokeWidth={1.5} />
            </InputGroupAddon>
            <InputGroupInput
                aria-label="Search spreads"
                placeholder="Search spreads"
                ref={inputRef}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
            />
            <InputGroupAddon
                align="inline-end"
                aria-hidden="true"
                className="hidden pr-2.5 sm:flex"
            >
                <Kbd>
                    ⌘ K
                </Kbd>
            </InputGroupAddon>
        </InputGroup>
    )
}

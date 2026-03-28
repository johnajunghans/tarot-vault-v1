import { StarIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Toggle } from "@/components/ui/toggle"

interface FavoritesToggleProps {
    favoritesOnly: boolean
    onToggle: (pressed: boolean) => void
    disabled?: boolean
}

export default function FavoritesToggle({
    favoritesOnly,
    onToggle,
    disabled=false
}: FavoritesToggleProps) {
    return (
        <Toggle
            variant="single"
            pressed={favoritesOnly}
            onPressedChange={onToggle}
            aria-label="Show favorites only"
            className="h-9"
            disabled={disabled}
        >
            <HugeiconsIcon icon={StarIcon} />
            <span>Favorites</span>
        </Toggle>
    )
}

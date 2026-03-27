import { StarIcon } from "hugeicons-react"
import { Toggle } from "@/components/ui/toggle"

interface FavoritesToggleProps {
    favoritesOnly: boolean
    onToggle: (pressed: boolean) => void
}

export default function FavoritesToggle({
    favoritesOnly,
    onToggle,
}: FavoritesToggleProps) {
    return (
        <Toggle
            variant="single"
            pressed={favoritesOnly}
            onPressedChange={onToggle}
            aria-label="Show favorites only"
            className="h-9"
        >
            <StarIcon
                className="w-4 h-4"
                strokeWidth={1.5}
                fill={favoritesOnly ? "var(--gold)" : "none"}
                color={favoritesOnly ? "var(--gold)" : "currentColor"}
            />
            <span>Favorites</span>
        </Toggle>
    )
}

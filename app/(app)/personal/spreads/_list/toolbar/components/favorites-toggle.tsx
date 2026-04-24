import { StarIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Toggle } from "@/components/ui/toggle"

interface FavoritesToggleProps {
    favoritesOnly: boolean
    onToggle: (pressed: boolean) => void
    disabled?: boolean
    isMobile?: boolean
}

export default function FavoritesToggle({
    favoritesOnly,
    onToggle,
    disabled = false,
    isMobile = false,
}: FavoritesToggleProps) {
    return (
        <Toggle
            variant="single"
            size={isMobile ? "mobile-lg" : "lg"}
            pressed={favoritesOnly}
            onPressedChange={onToggle}
            aria-label="Show favorites only"
            className={
                isMobile
                    ? "w-full data-[pressed]:[&>svg]:fill-gold"
                    : "data-[pressed]:[&>svg]:fill-gold"
            }
            disabled={disabled}
        >
            <HugeiconsIcon icon={StarIcon} />
            <span>Favorites</span>
        </Toggle>
    )
}

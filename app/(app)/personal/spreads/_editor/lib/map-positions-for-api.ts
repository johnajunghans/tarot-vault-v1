import type { SpreadForm } from "@/types/spreads"

/**
 * Maps form positions to the API format expected by Convex mutations.
 */
export function mapPositionsForApi(positions: SpreadForm["positions"]) {
    return positions.map((card, index) => ({
        position: index + 1,
        name: card.name,
        description: card.description,
        allowReverse: card.allowReverse,
        x: card.x,
        y: card.y,
        r: card.r,
        z: card.z,
    }))
}

import type { CardDB, SpreadDB, SpreadDraft } from "@/types/spreads"
import type { SpreadFilter } from "../components/spreads-toolbar"

export type SpreadListItem =
    | {
        kind: "draft"
        key: number
        timestamp: number
        name: string
        cards: CardDB[]
      }
    | {
        kind: "saved"
        key: SpreadDB["_id"]
        timestamp: number
        name: string
        cards: CardDB[]
        id: SpreadDB["_id"]
        favorite: boolean | undefined
      }

/** Parse a search param value into a valid SpreadFilter, defaulting to "all". */
export function getFilter(value: string | null): SpreadFilter {
    if (value === "saved" || value === "drafts" || value === "all") {
        return value
    }

    return "all"
}

/** Merge drafts and saved spreads into a single sorted, filtered list. */
export function buildSpreadList(
    spreads: SpreadDB[] | undefined,
    drafts: SpreadDraft[],
    filter: SpreadFilter,
    favoritesOnly: boolean,
): SpreadListItem[] {
    return [
        ...drafts.map((draft) => ({
            kind: "draft" as const,
            key: draft.date,
            timestamp: draft.date,
            name: draft.name,
            cards: draft.positions,
        })),
        ...(spreads?.map((spread) => ({
            kind: "saved" as const,
            key: spread._id,
            timestamp: spread._creationTime,
            name: spread.name,
            cards: spread.positions,
            id: spread._id,
            favorite: spread.favorite,
        })) ?? []),
    ]
        .filter((item) => {
            if (filter === "saved") return item.kind === "saved"
            if (filter === "drafts") return item.kind === "draft"
            return true
        })
        .filter((item) => {
            if (!favoritesOnly) return true
            return item.kind === "saved" && item.favorite
        })
        .sort((a, b) => b.timestamp - a.timestamp)
}

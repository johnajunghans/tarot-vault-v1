import type { CardDB, SpreadDB, SpreadDraft } from "@/types/spreads"

export type SpreadFilter = "all" | "saved" | "drafts"
export type SpreadSortField = "date" | "name" | "cards"
export type SpreadSortDir = "asc" | "desc"

export type SpreadListItem =
    | {
        kind: "draft"
        key: number
        timestamp: number
        name: string
        description?: string
        cards: CardDB[]
      }
    | {
        kind: "saved"
        key: SpreadDB["_id"]
        timestamp: number
        name: string
        description?: string
        cards: CardDB[]
        id: SpreadDB["_id"]
        favorite: boolean | undefined
      }

export const FILTER_OPTIONS: Array<{ value: SpreadFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "saved", label: "Saved" },
    { value: "drafts", label: "Drafts" },
]

export const SORT_FIELD_OPTIONS: Array<{ value: SpreadSortField; label: string }> = [
    { value: "date", label: "Date" },
    { value: "name", label: "Name" },
    { value: "cards", label: "Card count" },
]

/** Parse a search param value into a valid SpreadFilter, defaulting to "all". */
export function getFilter(value: string | null): SpreadFilter {
    if (value === "saved" || value === "drafts" || value === "all") {
        return value
    }

    return "all"
}

/** Parse a search param value into a valid SpreadSortField, defaulting to "date". */
export function getSort(value: string | null): SpreadSortField {
    if (value === "date" || value === "name" || value === "cards") {
        return value
    }

    return "date"
}

/** Parse a search param value into a valid SpreadSortDir, defaulting to "desc". */
export function getSortDir(value: string | null): SpreadSortDir {
    if (value === "asc" || value === "desc") {
        return value
    }

    return "desc"
}

/** Merge drafts and saved spreads into a single sorted, filtered list. */
export function buildSpreadList(
    spreads: SpreadDB[] | undefined,
    drafts: SpreadDraft[],
    filter: SpreadFilter,
    favoritesOnly: boolean,
    search: string,
    sortField: SpreadSortField,
    sortDir: SpreadSortDir,
): SpreadListItem[] {
    const lowerSearch = search.toLowerCase().trim()

    return [
        ...drafts.map((draft) => ({
            kind: "draft" as const,
            key: draft.date,
            timestamp: draft.date,
            name: draft.name,
            description: draft.description,
            cards: draft.positions,
        })),
        ...(spreads?.map((spread) => ({
            kind: "saved" as const,
            key: spread._id,
            timestamp: spread._creationTime,
            name: spread.name,
            description: spread.description,
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
        .filter((item) => {
            if (!lowerSearch) return true
            return (
                item.name.toLowerCase().includes(lowerSearch) ||
                (item.description?.toLowerCase().includes(lowerSearch) ?? false)
            )
        })
        .sort((a, b) => {
            let cmp: number
            switch (sortField) {
                case "name":
                    cmp = a.name.localeCompare(b.name)
                    break
                case "cards":
                    cmp = a.cards.length - b.cards.length
                    break
                case "date":
                default:
                    cmp = a.timestamp - b.timestamp
                    break
            }
            return sortDir === "asc" ? cmp : -cmp
        })
}

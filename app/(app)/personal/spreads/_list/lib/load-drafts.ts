import type { SpreadDraft } from "@/types/spreads"

/**
 * Reads all spread drafts from localStorage.
 * Each draft is stored under a key like "spread-draft-<timestamp>".
 */
export function loadDrafts(): SpreadDraft[] {
    const drafts: SpreadDraft[] = []

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key?.startsWith("spread-draft-")) continue

        const timestamp = Number(key.replace("spread-draft-", ""))
        if (isNaN(timestamp)) continue

        let draft: SpreadDraft | undefined = undefined
        try {
            const raw = localStorage.getItem(key)
            if (raw) {
                const parsed = JSON.parse(raw)
                draft = {
                    ...parsed,
                    name: parsed.name || "Untitled Spread",
                }
            }
        } catch (error) {
            console.error(`Error loading spread drafts: ${error}`)
        }

        if (draft) {
            drafts.push(draft)
        }
    }

    return drafts
}

// Generate a unique timestamp for a new draft, avoiding collisions with
// existing drafts already in localStorage.
export function createDraftTimestamp() {
    const timestamp = Date.now()
    if (typeof window === "undefined") return timestamp

    let uniqueTimestamp = timestamp
    while (window.localStorage.getItem(`spread-draft-${uniqueTimestamp}`) !== null) {
        uniqueTimestamp += 1
    }

    return uniqueTimestamp
}

export const DRAFT_KEY_PREFIX = "spread-draft-"

export function getCardNameFontSize(name: string): number {
    const length = name.trim().length

    if (length <= 12) return 14
    if (length <= 20) return 12.5
    if (length <= 30) return 11
    return 9.5
}

export function splitCardNameIntoLines(name: string): string[] {
    const trimmed = name.trim()
    if (!trimmed) return []

    const words = trimmed.split(/\s+/)
    const lines: string[] = []
    const maxCharsPerLine =
        trimmed.length <= 18 ? 12 : trimmed.length <= 30 ? 14 : 16

    let currentLine = ''

    const pushCurrentLine = () => {
        if (currentLine) {
            lines.push(currentLine)
            currentLine = ''
        }
    }

    for (const word of words) {
        if (lines.length === 2) break

        const nextLine = currentLine ? `${currentLine} ${word}` : word
        if (nextLine.length <= maxCharsPerLine) {
            currentLine = nextLine
            continue
        }

        if (!currentLine) {
            lines.push(word.slice(0, maxCharsPerLine))
            continue
        }

        pushCurrentLine()
        currentLine = word
    }

    pushCurrentLine()

    if (lines.length > 2) {
        return lines.slice(0, 2)
    }

    if (lines.length === 2) {
        const consumed = lines.join(' ').length
        if (consumed < trimmed.length) {
            lines[1] = `${lines[1].slice(0, Math.max(lines[1].length - 1, 0))}…`
        }
    }

    if (lines.length === 1 && lines[0].length < trimmed.length) {
        lines[0] = `${lines[0].slice(0, Math.max(lines[0].length - 1, 0))}…`
    }

    return lines
}

export function normalizeRotationForDisplay(rotation: number, FULL_ROTATION: number): number {
    return ((rotation % FULL_ROTATION) + FULL_ROTATION) % FULL_ROTATION
}

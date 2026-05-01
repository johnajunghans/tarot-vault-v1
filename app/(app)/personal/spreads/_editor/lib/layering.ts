type LayeredCard = { z: number }

export function clampLayer(value: number, maxLayer = Number.POSITIVE_INFINITY): number {
    if (!Number.isFinite(value)) return 1

    const roundedMax = Math.round(maxLayer)
    if (roundedMax < 1) return 0

    const upperBound = Number.isFinite(roundedMax)
        ? roundedMax
        : Number.POSITIVE_INFINITY

    return Math.min(upperBound, Math.max(1, Math.round(value)))
}

export function normalizeLayerValues(layers: readonly number[]): number[] {
    const nextLayers = new Array<number>(layers.length)

    layers
        .map((layer, index) => ({
            index,
            layer: Number.isFinite(layer) ? layer : 0,
        }))
        .sort((a, b) => {
            if (a.layer !== b.layer) return a.layer - b.layer
            return a.index - b.index
        })
        .forEach(({ index }, rankIndex) => {
            nextLayers[index] = rankIndex + 1
        })

    return nextLayers
}

export function normalizeCardLayers<T extends LayeredCard>(cards: readonly T[]): T[] {
    const layers = normalizeLayerValues(cards.map((card) => card.z))

    return cards.map((card, index) => ({
        ...card,
        z: layers[index] ?? index + 1,
    }))
}

export function areCanonicalLayerValues(layers: readonly number[]): boolean {
    if (layers.length === 0) return true

    const seen = new Set<number>()
    for (const layer of layers) {
        if (!Number.isInteger(layer) || layer < 1 || layer > layers.length) {
            return false
        }
        seen.add(layer)
    }

    return seen.size === layers.length
}

export function moveCardToLayer(
    layers: readonly number[],
    selectedIndex: number,
    targetLayer: number
): number[] {
    const normalizedLayers = normalizeLayerValues(layers)
    if (selectedIndex < 0 || selectedIndex >= normalizedLayers.length) {
        return normalizedLayers
    }

    const targetRank = clampLayer(targetLayer, normalizedLayers.length)
    const orderedIndices = normalizedLayers
        .map((layer, index) => ({ layer, index }))
        .sort((a, b) => a.layer - b.layer)
        .map(({ index }) => index)

    const currentOrderIndex = orderedIndices.indexOf(selectedIndex)
    if (currentOrderIndex === -1) return normalizedLayers

    orderedIndices.splice(currentOrderIndex, 1)
    orderedIndices.splice(targetRank - 1, 0, selectedIndex)

    const nextLayers = new Array<number>(normalizedLayers.length)
    orderedIndices.forEach((index, rankIndex) => {
        nextLayers[index] = rankIndex + 1
    })

    return nextLayers
}

export function isUniqueHighestLayer(layers: readonly number[], selectedIndex: number): boolean {
    const normalizedLayers = normalizeLayerValues(layers)
    return normalizedLayers[selectedIndex] === normalizedLayers.length
}

export function isUniqueLowestLayer(layers: readonly number[], selectedIndex: number): boolean {
    const normalizedLayers = normalizeLayerValues(layers)
    return normalizedLayers[selectedIndex] === 1
}

export function getLayersWithFrontCard(layers: readonly number[], selectedIndex: number): number[] {
    return moveCardToLayer(layers, selectedIndex, layers.length)
}

export function getLayersWithBackCard(layers: readonly number[], selectedIndex: number): number[] {
    return moveCardToLayer(layers, selectedIndex, 1)
}

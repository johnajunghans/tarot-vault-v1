export function clampLayer(value: number): number {
    return Math.max(0, Math.round(value))
}

export function isUniqueHighestLayer(layers: number[], selectedIndex: number): boolean {
    const selectedLayer = layers[selectedIndex]
    if (selectedLayer === undefined) return true

    return layers.every((layer, index) =>
        index === selectedIndex || selectedLayer > layer
    )
}

export function isUniqueLowestLayer(layers: number[], selectedIndex: number): boolean {
    const selectedLayer = layers[selectedIndex]
    if (selectedLayer === undefined) return true

    return layers.every((layer, index) =>
        index === selectedIndex || selectedLayer < layer
    )
}

export function getLayersWithFrontCard(layers: number[], selectedIndex: number): number[] {
    const maxLayer = layers.reduce((max, layer) => Math.max(max, layer), 0)
    const nextLayers = [...layers]
    nextLayers[selectedIndex] = maxLayer + 1
    return nextLayers
}

export function getLayersWithBackCard(layers: number[], selectedIndex: number): number[] {
    if (layers.length === 0) return layers

    const minLayer = layers.reduce((min, layer) => Math.min(min, layer), layers[0] ?? 0)
    const nextLayers = [...layers]

    if (minLayer > 0) {
        nextLayers[selectedIndex] = minLayer - 1
        return nextLayers
    }

    return nextLayers.map((layer, index) =>
        index === selectedIndex ? 0 : layer + 1
    )
}

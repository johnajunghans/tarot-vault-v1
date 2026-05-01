type LayeredPosition = { z: number };

export function normalizeLayerValues(layers: readonly number[]): number[] {
  const nextLayers = new Array<number>(layers.length);

  layers
    .map((layer, index) => ({
      index,
      layer: Number.isFinite(layer) ? layer : 0,
    }))
    .sort((a, b) => {
      if (a.layer !== b.layer) return a.layer - b.layer;
      return a.index - b.index;
    })
    .forEach(({ index }, rankIndex) => {
      nextLayers[index] = rankIndex + 1;
    });

  return nextLayers;
}

export function normalizePositionLayers<T extends LayeredPosition>(
  positions: readonly T[],
): T[] {
  const layers = normalizeLayerValues(positions.map((position) => position.z));

  return positions.map((position, index) => ({
    ...position,
    z: layers[index] ?? index + 1,
  }));
}

export function areCanonicalLayerValues(layers: readonly number[]): boolean {
  if (layers.length === 0) return true;

  const seen = new Set<number>();
  for (const layer of layers) {
    if (!Number.isInteger(layer) || layer < 1 || layer > layers.length) {
      return false;
    }
    seen.add(layer);
  }

  return seen.size === layers.length;
}

export function positionsHaveCanonicalLayers(
  positions: readonly LayeredPosition[],
): boolean {
  return areCanonicalLayerValues(positions.map((position) => position.z));
}

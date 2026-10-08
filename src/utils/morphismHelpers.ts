import { Tile } from '../types/game';

export type MorphismScope = 'all' | 'layer' | 'selected';
export type MorphismTransformType = 'rotate90cw' | 'rotate90ccw' | 'rotate180' | 'flipH' | 'flipV';
export type MorphismSymmetryType = 'radial4' | 'rotational2' | 'mirrorH' | 'mirrorV';

const BOARD_CENTER_X = 12;
const BOARD_CENTER_Y = 12;
const BOARD_GRID_LIMIT = 24;

/**
 * Transforms a single tile around board center (12, 12).
 */
export const transformTile = (
  tile: Tile,
  type: MorphismTransformType,
  cx = BOARD_CENTER_X,
  cy = BOARD_CENTER_Y
): Tile => {
  const w = tile.giftCols && tile.isGift ? tile.giftCols : 2;
  const h = tile.giftRows && tile.isGift ? tile.giftRows : 2;

  // Tile center relative to board center
  const tileCx = tile.x + w / 2;
  const tileCy = tile.y + h / 2;
  const dx = tileCx - cx;
  const dy = tileCy - cy;

  let newDx = dx;
  let newDy = dy;
  let newW = w;
  let newH = h;

  switch (type) {
    case 'rotate90cw':
      newDx = -dy;
      newDy = dx;
      newW = h;
      newH = w;
      break;
    case 'rotate90ccw':
      newDx = dy;
      newDy = -dx;
      newW = h;
      newH = w;
      break;
    case 'rotate180':
      newDx = -dx;
      newDy = -dy;
      break;
    case 'flipH':
      newDx = -dx;
      newDy = dy;
      break;
    case 'flipV':
      newDx = dx;
      newDy = -dy;
      break;
  }

  const newTileCx = cx + newDx;
  const newTileCy = cy + newDy;

  let newX = Math.round(newTileCx - newW / 2);
  let newY = Math.round(newTileCy - newH / 2);

  // Clamp within 0..24
  newX = Math.max(0, Math.min(BOARD_GRID_LIMIT - newW, newX));
  newY = Math.max(0, Math.min(BOARD_GRID_LIMIT - newH, newY));

  const updated: Tile = {
    ...tile,
    x: newX,
    y: newY,
  };

  if (tile.isGift) {
    updated.giftCols = newW;
    updated.giftRows = newH;
  }

  return updated;
};

/**
 * Transforms tiles matching scope ('all' | 'layer' | 'selected').
 */
export const transformTileList = (
  tiles: Tile[],
  type: MorphismTransformType,
  scope: MorphismScope,
  activeLayer?: number,
  selectedTileIds?: Set<string>
): Tile[] => {
  return tiles.map(t => {
    let shouldTransform = false;
    if (scope === 'all') {
      shouldTransform = true;
    } else if (scope === 'layer') {
      shouldTransform = t.z === activeLayer;
    } else if (scope === 'selected') {
      shouldTransform = selectedTileIds ? selectedTileIds.has(t.id) : false;
    }

    return shouldTransform ? transformTile(t, type) : t;
  });
};

/**
 * Generates symmetric cloned tiles (radial 4-way, 180 2-way, or bilateral mirror).
 */
export const generateSymmetricTiles = (
  tiles: Tile[],
  type: MorphismSymmetryType,
  scope: MorphismScope,
  activeLayer?: number,
  selectedTileIds?: Set<string>
): { newTiles: Tile[]; addedCount: number } => {
  // Determine source tiles to replicate
  const sourceTiles = tiles.filter(t => {
    if (scope === 'all') return true;
    if (scope === 'layer') return t.z === activeLayer;
    if (scope === 'selected') return selectedTileIds ? selectedTileIds.has(t.id) : false;
    return true;
  });

  if (sourceTiles.length === 0) {
    return { newTiles: tiles, addedCount: 0 };
  }

  // Set of existing tile coordinates (x, y, z) to prevent exact duplicates
  const existingCoords = new Set(tiles.map(t => `${t.x},${t.y},${t.z}`));
  const generatedClones: Tile[] = [];

  const transformTypesToApply: MorphismTransformType[] = (() => {
    switch (type) {
      case 'radial4':
        return ['rotate90cw', 'rotate180', 'rotate90ccw'];
      case 'rotational2':
        return ['rotate180'];
      case 'mirrorH':
        return ['flipH'];
      case 'mirrorV':
        return ['flipV'];
    }
  })();

  transformTypesToApply.forEach((trType, trIdx) => {
    sourceTiles.forEach(src => {
      const cloned = transformTile(src, trType);
      const coordKey = `${cloned.x},${cloned.y},${cloned.z}`;

      // Only add if not already occupied by existing tile or already generated clone
      if (!existingCoords.has(coordKey)) {
        existingCoords.add(coordKey);
        const uniqueSuffix = `sym-${type}-${trIdx}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        cloned.id = `${src.id}-${uniqueSuffix}`;
        if (src.tripletGroupId) {
          cloned.tripletGroupId = `${src.tripletGroupId}-sym${trIdx + 1}`;
        }
        generatedClones.push(cloned);
      }
    });
  });

  return {
    newTiles: [...tiles, ...generatedClones],
    addedCount: generatedClones.length,
  };
};

/**
 * Permanently bakes spin angle (90, 180, 270) and horizontal mirror into all tile positions.
 */
export const bakeMorphismToTiles = (
  tiles: Tile[],
  spinAngle: number,
  mirroredHorizons: boolean
): Tile[] => {
  let result = [...tiles];

  if (mirroredHorizons) {
    result = result.map(t => transformTile(t, 'flipH'));
  }

  const normalizedAngle = ((spinAngle % 360) + 360) % 360;
  if (normalizedAngle === 90) {
    result = result.map(t => transformTile(t, 'rotate90cw'));
  } else if (normalizedAngle === 180) {
    result = result.map(t => transformTile(t, 'rotate180'));
  } else if (normalizedAngle === 270) {
    result = result.map(t => transformTile(t, 'rotate90ccw'));
  }

  return result;
};

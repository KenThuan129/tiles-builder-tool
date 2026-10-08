import { BYTES_VERSION, BYTES_ID_RANGE_START, BYTES_ID_RANGE_END } from '../constants/gameConfig';

export const deriveDifficultyLabel = (difficultyModBand?: string): string => {
  if (!difficultyModBand) return "EASY";
  let label = difficultyModBand;
  if (label.toLowerCase().startsWith("mod")) {
    label = label.substring(3);
  }
  return label ? label.toUpperCase() : "EASY";
};

export const buildZToIzMap = (entities: Array<{ z: number }>): Record<number, number> => {
  const distinctZ = [...new Set(entities.map(e => e.z))].sort((a, b) => a - b);
  const mapping: Record<number, number> = {};
  distinctZ.forEach((z, idx) => {
    mapping[z] = idx + 1;
  });
  return mapping;
};

export const buildIconColorIdMap = (tileEntities: any[]): Record<string, number> => {
  const mapping: Record<string, number> = {};
  let nextId = BYTES_ID_RANGE_START;

  const uniqueKeys = [
    ...new Set(
      tileEntities.map(t => {
        const themeId = t.themeID || 'theme00';
        const colorPart = t.color ?? 'null';
        return `${t.icon}_${colorPart}_${themeId}`;
      })
    )
  ].sort();

  for (const key of uniqueKeys) {
    if (nextId > BYTES_ID_RANGE_END) {
      throw new Error(
        `Too many (icon, color, theme) combinations: ` +
        `${uniqueKeys.length} exceeds range [${BYTES_ID_RANGE_START}, ${BYTES_ID_RANGE_END}].`
      );
    }
    mapping[key] = nextId++;
  }

  return mapping;
};

export const convertTileToBytes = (tile: any, iconColorMap: Record<string, number>, zToIzMap: Record<number, number>) => {
  const themeId = tile.themeID || 'theme00';
  const colorPart = tile.color ?? 'null';
  const key = `${tile.icon}_${colorPart}_${themeId}`;

  const out: any = {
    id: iconColorMap[key],
    ix: tile.x,
    iy: tile.y,
    iz: zToIzMap[tile.z]
  };

  const mechanic = tile.special_mechanic;
  if (mechanic) {
    const name = mechanic.name;

    if (name === "hidden") {
      out.isBackUp = true;
    } else if (name === "eventItem") {
      out.indexBreakTileStart = 0;
    }
  }

  return out;
};

export const convertGiftToBytes = (gift: any, zToIzMap: Record<number, number>) => {
  const size = gift.size || {};
  const cols = size.cols || 0;
  const rows = size.rows || 0;

  return {
    ix: gift.x,
    iy: gift.y,
    iz: zToIzMap[gift.z],
    visual: gift.visual ?? 0,
    size: Math.max(cols, rows)
  };
};

export const convertToBytes = (levelExport: any) => {
  const entities = levelExport.map_info?.tiles || [];

  const tileEntities = entities.filter((e: any) =>
    !e.entity_type || e.entity_type === "tile"
  );
  const giftEntities = entities.filter((e: any) =>
    e.entity_type === "gift"
  );

  const zToIzMap = buildZToIzMap(entities);
  const iconColorMap = buildIconColorIdMap(tileEntities);

  const outTiles = tileEntities.map((t: any) => convertTileToBytes(t, iconColorMap, zToIzMap));
  const outGifts = giftEntities.map((g: any) => convertGiftToBytes(g, zToIzMap));

  const difficultyBand = levelExport.difficulty?.difficulty_mod_band;

  return {
    bytes_version: BYTES_VERSION,
    tiles: outTiles,
    gifts: outGifts,
    DifficultyNew: deriveDifficultyLabel(difficultyBand)
  };
};

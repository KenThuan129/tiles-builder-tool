import { Tile, SuggestParams } from '../types/game';
import { COMBINE_SHAPES, GIFT_SIZES, GIFT_THEMES, DEFAULT_GIFT_THEME } from '../constants/gameConfig';
import { generateId } from './gameHelpers';

export interface TopGameArchetypeInfo {
  id: string;
  name: string;
  gameInspiration: string;
  description: string;
  tag: string;
  accentColor: string;
}

export const TOP_GAME_ARCHETYPES: TopGameArchetypeInfo[] = [
  {
    id: 'tapTile_mandala',
    name: 'Sacred Mandala',
    gameInspiration: 'Tap Tile',
    description: '4-Quadrant radial symmetry with concentric petal rings and center gem core.',
    tag: 'Symmetric Petals',
    accentColor: 'text-amber-400 border-amber-500/50 bg-amber-950/30'
  },
  {
    id: 'tilesExplorer_terrace',
    name: 'Stepped Terraces',
    gameInspiration: 'Tiles Explorer',
    description: 'Ancient temple terraces with broad perimeter plazas stepping inward to a shrine.',
    tag: 'Ziggurat Tiers',
    accentColor: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/30'
  },
  {
    id: 'tilesTravel_hourglass',
    name: 'Hourglass & Twin Towers',
    gameInspiration: 'Tiles Travel',
    description: 'Balanced upper & lower tower peaks connected by a narrow central transit bridge.',
    tag: 'Twin Peaks',
    accentColor: 'text-cyan-400 border-cyan-500/50 bg-cyan-950/30'
  },
  {
    id: 'matchingTiles_butterfly',
    name: 'Butterfly Wings',
    gameInspiration: 'Matching Tiles',
    description: 'Bilateral symmetric butterfly wings with fanned upper lobes and spine corridor.',
    tag: 'Bilateral Symmetry',
    accentColor: 'text-purple-400 border-purple-500/50 bg-purple-950/30'
  },
  {
    id: 'tapTile_fortress',
    name: 'Fortress Ramparts',
    gameInspiration: 'Tap Tile',
    description: 'Outer defensive curtain wall with corner bastions and nested inner keep.',
    tag: 'Castle Keep',
    accentColor: 'text-rose-400 border-rose-500/50 bg-rose-950/30'
  },
  {
    id: 'tilesExplorer_cross',
    name: 'Celtic Sunken Cross',
    gameInspiration: 'Tiles Explorer',
    description: 'Cruciform 4-wing cardinal corridors with a circular stepped altar crossing.',
    tag: 'Cruciform Ring',
    accentColor: 'text-indigo-400 border-indigo-500/50 bg-indigo-950/30'
  },
  {
    id: 'pyramid_cascade',
    name: 'Pyramid Cascades',
    gameInspiration: 'Classic Match 3',
    description: 'Stepped elevation tiers with smooth concentric unlocking progression.',
    tag: 'Cascading Tiers',
    accentColor: 'text-yellow-400 border-yellow-500/50 bg-yellow-950/30'
  },
  {
    id: 'cluster_islands',
    name: 'Satellite Archipelago',
    gameInspiration: 'Tiles Explorer',
    description: 'Floating satellite islands surrounding a dense central mothership cluster.',
    tag: 'Island Clusters',
    accentColor: 'text-teal-400 border-teal-500/50 bg-teal-950/30'
  },
  {
    id: 'spiral_galaxy',
    name: 'Spiral Galaxy',
    gameInspiration: 'Tiles Travel',
    description: 'Curved logarithmic dual-arm spiral revolving around a luminous galactic hub.',
    tag: 'Whirlpool Curve',
    accentColor: 'text-fuchsia-400 border-fuchsia-500/50 bg-fuchsia-950/30'
  }
];

export interface LevelRangePresetInfo {
  id: string;
  label: string;
  levelRangeLabel: string;
  recommendedTiles: number;
  recommendedLayers: number;
  difficultyBand: string;
  description: string;
  suggestedArchetype: string;
  specialMechanics: {
    hiddenPct: number;
    chained1Pct: number;
    chained2Pct: number;
    icePct: number;
    combinedPct: number;
    leaf: boolean;
    includeGifts: boolean;
    giftCount: number;
  };
  boardMechanics: {
    timerEnabled: boolean;
    timerDuration: number;
    morphismEnabled: boolean;
    morphismSymmetry: 'none' | 'horizontal' | 'vertical' | 'quad' | 'rot90';
    bossEnabled: boolean;
    bossHP: number;
    deliveryEnabled: boolean;
    deliveryOrders: number;
    deliveryEndless: boolean;
    shuffleEnabled: boolean;
  };
}

export const LEVEL_RANGE_PRESETS: LevelRangePresetInfo[] = [
  {
    id: '1-10',
    label: 'Levels 1–10 (Early Stage / Tutorial)',
    levelRangeLabel: 'Lv 1 - 10',
    recommendedTiles: 30,
    recommendedLayers: 2,
    difficultyBand: 'modEasy',
    description: 'Gentle introduction. Clean footprint with normal tiles and relaxed pacing.',
    suggestedArchetype: 'matchingTiles_butterfly',
    specialMechanics: {
      hiddenPct: 0,
      chained1Pct: 0,
      chained2Pct: 0,
      icePct: 0,
      combinedPct: 0,
      leaf: false,
      includeGifts: false,
      giftCount: 0
    },
    boardMechanics: {
      timerEnabled: false,
      timerDuration: 120,
      morphismEnabled: false,
      morphismSymmetry: 'none',
      bossEnabled: false,
      bossHP: 40,
      deliveryEnabled: false,
      deliveryOrders: 4,
      deliveryEndless: false,
      shuffleEnabled: true
    }
  },
  {
    id: '11-30',
    label: 'Levels 11–30 (Intro Progression)',
    levelRangeLabel: 'Lv 11 - 30',
    recommendedTiles: 45,
    recommendedLayers: 3,
    difficultyBand: 'modMedium',
    description: 'Introduces Chain Lv1, Ice 2, Safe Hidden items, with moderate Board Timer.',
    suggestedArchetype: 'tapTile_mandala',
    specialMechanics: {
      hiddenPct: 10,
      chained1Pct: 10,
      chained2Pct: 0,
      icePct: 10,
      combinedPct: 0,
      leaf: true,
      includeGifts: false,
      giftCount: 0
    },
    boardMechanics: {
      timerEnabled: true,
      timerDuration: 90,
      morphismEnabled: false,
      morphismSymmetry: 'none',
      bossEnabled: false,
      bossHP: 50,
      deliveryEnabled: false,
      deliveryOrders: 4,
      deliveryEndless: false,
      shuffleEnabled: true
    }
  },
  {
    id: '31-80',
    label: 'Levels 31–80 (Journey & Travel Exploration)',
    levelRangeLabel: 'Lv 31 - 80',
    recommendedTiles: 63,
    recommendedLayers: 3,
    difficultyBand: 'modHard',
    description: 'Mid-game complexity. Multi-tier chains, ice, combined clusters, sweet delivery.',
    suggestedArchetype: 'tilesTravel_hourglass',
    specialMechanics: {
      hiddenPct: 15,
      chained1Pct: 10,
      chained2Pct: 10,
      icePct: 15,
      combinedPct: 10,
      leaf: true,
      includeGifts: true,
      giftCount: 1
    },
    boardMechanics: {
      timerEnabled: true,
      timerDuration: 75,
      morphismEnabled: true,
      morphismSymmetry: 'horizontal',
      bossEnabled: false,
      bossHP: 60,
      deliveryEnabled: true,
      deliveryOrders: 6,
      deliveryEndless: false,
      shuffleEnabled: true
    }
  },
  {
    id: '81-150',
    label: 'Levels 81–150 (Advanced Boss & Terraces)',
    levelRangeLabel: 'Lv 81 - 150',
    recommendedTiles: 84,
    recommendedLayers: 4,
    difficultyBand: 'modExpert',
    description: 'High intensity. BOSS Battle (tray capacity capping), Ice 3, Chain Lv2, goal gifts.',
    suggestedArchetype: 'tilesExplorer_terrace',
    specialMechanics: {
      hiddenPct: 15,
      chained1Pct: 10,
      chained2Pct: 15,
      icePct: 20,
      combinedPct: 15,
      leaf: true,
      includeGifts: true,
      giftCount: 2
    },
    boardMechanics: {
      timerEnabled: true,
      timerDuration: 60,
      morphismEnabled: true,
      morphismSymmetry: 'quad',
      bossEnabled: true,
      bossHP: 80,
      deliveryEnabled: true,
      deliveryOrders: 8,
      deliveryEndless: false,
      shuffleEnabled: true
    }
  },
  {
    id: '151+',
    label: 'Levels 151+ (Grandmaster Gauntlet)',
    levelRangeLabel: 'Lv 151+',
    recommendedTiles: 108,
    recommendedLayers: 5,
    difficultyBand: 'modMaster',
    description: 'Pinnacle mastery. All board & tile mechanisms active in elaborate fortress layouts.',
    suggestedArchetype: 'tapTile_fortress',
    specialMechanics: {
      hiddenPct: 20,
      chained1Pct: 15,
      chained2Pct: 15,
      icePct: 20,
      combinedPct: 15,
      leaf: true,
      includeGifts: true,
      giftCount: 2
    },
    boardMechanics: {
      timerEnabled: true,
      timerDuration: 60,
      morphismEnabled: true,
      morphismSymmetry: 'quad',
      bossEnabled: true,
      bossHP: 100,
      deliveryEnabled: true,
      deliveryOrders: 10,
      deliveryEndless: true,
      shuffleEnabled: true
    }
  }
];

/**
 * Generates candidate grid coordinates [2..20] for a given top game archetype and layer z.
 */
export const generateArchetypeCandidates = (
  archetype: string,
  layerZ: number,
  totalLayers: number,
  isLayer0Sample: boolean = false
): Array<{ x: number; y: number }> => {
  const coords: Array<{ x: number; y: number }> = [];
  const coordKey = (x: number, y: number) => `${x},${y}`;
  const seen = new Set<string>();

  const add = (x: number, y: number) => {
    // Snap to valid board grid
    const sx = Math.max(2, Math.min(20, Math.round(x / 2) * 2));
    const sy = Math.max(2, Math.min(20, Math.round(y / 2) * 2));
    const key = coordKey(sx, sy);
    if (!seen.has(key)) {
      seen.add(key);
      coords.push({ x: sx, y: sy });
    }
  };

  const center = 11;
  const zStep = isLayer0Sample ? 0 : layerZ;

  switch (archetype) {
    case 'tapTile_mandala': {
      // Tap Tile: Symmetrical 4-quadrant & radial petals
      // At layer 0: Outer petals + ring. Higher layers: inner core petals
      const rOuter = Math.max(4, 9 - zStep * 2);
      const rInner = Math.max(2, rOuter - 2);

      // Petal centers (8 directions)
      const angles = [0, 45, 90, 135, 180, 225, 270, 315];
      angles.forEach(deg => {
        const rad = (deg * Math.PI) / 180;
        const cx = Math.round(center + Math.cos(rad) * rOuter);
        const cy = Math.round(center + Math.sin(rad) * rOuter);
        add(cx, cy);
        add(cx + 2, cy);
        add(cx, cy + 2);

        if (rInner >= 2) {
          const icx = Math.round(center + Math.cos(rad) * rInner);
          const icy = Math.round(center + Math.sin(rad) * rInner);
          add(icx, icy);
        }
      });

      // Center diamond core
      if (zStep > 0 || isLayer0Sample) {
        add(10, 10); add(12, 10);
        add(10, 12); add(12, 12);
      }
      break;
    }

    case 'tilesExplorer_terrace': {
      // Tiles Explorer: Stepped Ziggurat Terraces
      const inset = isLayer0Sample ? 2 : Math.min(8, 2 + zStep * 2);
      const start = inset;
      const end = 22 - inset;

      // Outer border of this terrace
      for (let x = start; x <= end; x += 2) {
        add(x, start);
        add(x, end);
      }
      for (let y = start; y <= end; y += 2) {
        add(start, y);
        add(end, y);
      }

      // Fill in courtyard if layer 0 sample or upper tiers
      if (isLayer0Sample || zStep >= 2) {
        for (let x = start + 2; x <= end - 2; x += 4) {
          for (let y = start + 2; y <= end - 2; y += 4) {
            add(x, y);
          }
        }
      }
      break;
    }

    case 'tilesTravel_hourglass': {
      // Tiles Travel: Hourglass & Twin Towers with connecting waist
      const towerInset = Math.min(4, zStep * 2);

      // Top Tower (y: 2..8)
      for (let y = 2 + towerInset; y <= 8; y += 2) {
        const spread = Math.max(2, 6 - (y - 2));
        for (let x = center - spread; x <= center + spread; x += 2) {
          add(x, y);
        }
      }

      // Connecting Bridge (y: 10..12)
      add(10, 10); add(12, 10);
      add(10, 12); add(12, 12);

      // Bottom Tower (y: 14..20)
      for (let y = 14; y <= 20 - towerInset; y += 2) {
        const spread = Math.max(2, (y - 14));
        for (let x = center - spread; x <= center + spread; x += 2) {
          add(x, y);
        }
      }
      break;
    }

    case 'matchingTiles_butterfly': {
      // Matching Tiles: Butterfly Wings (Bilateral symmetry)
      const wingReduction = Math.min(4, zStep * 2);

      // Central spine thorax
      for (let y = 4; y <= 18; y += 2) {
        add(10, y);
        add(12, y);
      }

      // Left Wing (x: 4..8) & Right Wing (x: 14..18)
      for (let y = 4 + wingReduction; y <= 18 - wingReduction; y += 2) {
        // Upper wing fan (broader)
        const xDist = (y <= 11) ? 6 : 4;
        for (let dx = 2; dx <= xDist; dx += 2) {
          add(10 - dx, y);
          add(12 + dx, y);
        }
      }
      break;
    }

    case 'tapTile_fortress': {
      // Tap Tile: Fortress Ramparts with 4 corner towers & central keep
      const fMargin = Math.min(6, zStep * 2);
      const minX = 4 + fMargin, maxX = 18 - fMargin;
      const minY = 4 + fMargin, maxY = 18 - fMargin;

      // 4 Corner Bastions
      add(minX, minY); add(maxX, minY);
      add(minX, maxY); add(maxX, maxY);

      // Walls connecting bastions
      for (let x = minX; x <= maxX; x += 2) {
        add(x, minY);
        add(x, maxY);
      }
      for (let y = minY; y <= maxY; y += 2) {
        add(minX, y);
        add(maxX, y);
      }

      // Inner Keep
      add(10, 10); add(12, 10);
      add(10, 12); add(12, 12);
      break;
    }

    case 'tilesExplorer_cross': {
      // Tiles Explorer: Celtic Cross
      const crossRadius = Math.max(2, 8 - zStep * 2);

      // Vertical Corridor
      for (let y = 4; y <= 18; y += 2) {
        add(10, y); add(12, y);
      }
      // Horizontal Corridor
      for (let x = 4; x <= 18; x += 2) {
        add(x, 10); add(x, 12);
      }

      // Crossing Halo Ring
      const ringAngles = [45, 135, 225, 315];
      ringAngles.forEach(deg => {
        const rad = (deg * Math.PI) / 180;
        const rx = Math.round(center + Math.cos(rad) * crossRadius);
        const ry = Math.round(center + Math.sin(rad) * crossRadius);
        add(rx, ry);
      });
      break;
    }

    case 'cluster_islands': {
      // Archipelago of distinct satellite islands + center
      const islands = [
        { cx: 6, cy: 6 },
        { cx: 16, cy: 6 },
        { cx: 6, cy: 16 },
        { cx: 16, cy: 16 },
        { cx: 11, cy: 11 }
      ];

      const activeIslands = (zStep === 0 || isLayer0Sample)
        ? islands
        : [islands[zStep % 4], islands[4]];

      activeIslands.forEach(isl => {
        for (let dx = -2; dx <= 2; dx += 2) {
          for (let dy = -2; dy <= 2; dy += 2) {
            add(isl.cx + dx, isl.cy + dy);
          }
        }
      });
      break;
    }

    case 'spiral_galaxy': {
      // Dual-Arm Spiral Galaxy
      const spiralPoints = isLayer0Sample ? 36 : Math.max(16, 28 - zStep * 4);
      for (let i = 0; i < spiralPoints; i++) {
        const theta = 0.45 * i + (zStep * 0.5);
        const r = 2.5 + (0.35 * i);
        // Arm 1
        const x1 = center + Math.cos(theta) * r;
        const y1 = center + Math.sin(theta) * r;
        add(x1, y1);

        // Arm 2 (180 deg offset)
        const x2 = center + Math.cos(theta + Math.PI) * r;
        const y2 = center + Math.sin(theta + Math.PI) * r;
        add(x2, y2);
      }
      break;
    }

    case 'pyramid_cascade':
    default: {
      // Standard pyramid cascade
      const margin = isLayer0Sample ? 2 : Math.min(8, 2 + zStep * 2);
      const start = margin;
      const end = 22 - margin;
      for (let y = start; y <= end; y += 2) {
        for (let x = start; x <= end; x += 2) {
          add(x, y);
        }
      }
      break;
    }
  }

  return coords;
};

/**
 * Procedurally generates a complete, playable level based on SuggestParams.
 */
export const buildProceduralLevel = (
  params: SuggestParams,
  activeThemes: string[]
): {
  tiles: Tile[];
  targetTileCount: number;
  layersCount: number;
  archetypeUsed: string;
} => {
  const generatedTiles: Tile[] = [];
  let id = 0;

  const isLayer0Only = !!params.layer0SampleOnly;
  const numLayers = isLayer0Only ? 1 : Math.min(Math.max(Number(params.layers) || 3, 2), 5);
  const targetCount = Math.min(Math.max(Number(params.targetTiles) || 45, 9), 180);
  const adjustedTarget = Math.floor(targetCount / 3) * 3;

  const archetype = params.layoutShape || 'tapTile_mandala';
  const stackRatioVal = Number(params.stackRatio) || 30;
  const diagonalRatioVal = Number(params.diagonalRatio) || 30;
  const combinedMaxSize = Math.min(Math.max(Number(params.combinedMaxSize) || 4, 2), 5);

  const perLayerCount = isLayer0Only ? adjustedTarget : Math.ceil(adjustedTarget / numLayers);

  for (let z = 0; z < numLayers; z++) {
    const layerTiles: Tile[] = [];
    let placedThisLayer = 0;
    const targetForThisLayer = (z === numLayers - 1)
      ? (adjustedTarget - generatedTiles.length)
      : Math.min(perLayerCount, adjustedTarget - generatedTiles.length);

    if (targetForThisLayer <= 0) break;

    // Generate candidates for this archetype & layer
    const candidateCoords = generateArchetypeCandidates(archetype, z, numLayers, isLayer0Only);
    const coordKey = (x: number, y: number) => `${x},${y}`;
    const candidateSet = new Set(candidateCoords.map(c => coordKey(c.x, c.y)));

    // Pick seed coordinate near center
    const seed = candidateCoords.reduce((closest, current) => {
      const distClosest = Math.abs(closest.x - 11) + Math.abs(closest.y - 11);
      const distCurrent = Math.abs(current.x - 11) + Math.abs(current.y - 11);
      return distCurrent < distClosest ? current : closest;
    }, candidateCoords[0] || { x: 10, y: 10 });

    const chosen: Array<{ x: number; y: number }> = [seed];
    const chosenKeys = new Set([coordKey(seed.x, seed.y)]);
    const frontier = [seed];

    const GROW_OFFSETS = [
      { dx: 2, dy: 0 }, { dx: -2, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: -2 },
      { dx: 2, dy: 2 }, { dx: -2, dy: -2 }, { dx: 2, dy: -2 }, { dx: -2, dy: 2 }
    ];

    while (chosen.length < targetForThisLayer && frontier.length > 0) {
      const idx = Math.floor(Math.random() * frontier.length);
      const current = frontier.splice(idx, 1)[0];
      const shuffledOffsets = [...GROW_OFFSETS].sort(() => Math.random() - 0.5);

      for (const offset of shuffledOffsets) {
        if (chosen.length >= targetForThisLayer) break;
        const nx = current.x + offset.dx;
        const ny = current.y + offset.dy;
        if (nx >= 2 && nx <= 20 && ny >= 2 && ny <= 20) {
          const key = coordKey(nx, ny);
          if (candidateSet.has(key) && !chosenKeys.has(key)) {
            chosen.push({ x: nx, y: ny });
            chosenKeys.add(key);
            frontier.push({ x: nx, y: ny });
          }
        }
      }
    }

    if (chosen.length < targetForThisLayer) {
      const remaining = candidateCoords
        .filter(c => !chosenKeys.has(coordKey(c.x, c.y)))
        .sort(() => Math.random() - 0.5);
      for (const c of remaining) {
        if (chosen.length >= targetForThisLayer) break;
        chosen.push(c);
        chosenKeys.add(coordKey(c.x, c.y));
      }
    }

    // Now instantiate tiles
    for (let i = 0; i < chosen.length && placedThisLayer < targetForThisLayer; i++) {
      const coord = chosen[i];
      if (layerTiles.some(t => t.x === coord.x && t.y === coord.y)) continue;

      let posX = coord.x;
      let posY = coord.y;

      if (!isLayer0Only && z > 0 && generatedTiles.filter(t => t.z === z - 1).length > 0) {
        const lowerLayerTiles = generatedTiles.filter(t => t.z === z - 1);
        const baseTile = lowerLayerTiles[Math.floor(Math.random() * lowerLayerTiles.length)];

        const rollCover = Math.random() * 100;
        if (rollCover < stackRatioVal) {
          posX = baseTile.x;
          posY = baseTile.y;
        } else if (rollCover < stackRatioVal + diagonalRatioVal) {
          const offsets = [{ dx: 1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }];
          const offset = offsets[Math.floor(Math.random() * offsets.length)];
          posX = Math.max(2, Math.min(20, baseTile.x + offset.dx));
          posY = Math.max(2, Math.min(20, baseTile.y + offset.dy));
        }
      }

      // Roll mechanics
      let mech = 'normal';
      let clusterCells: Array<{ x: number; y: number }> | null = null;
      const rollMech = Math.random() * 100;
      const pHidden = Number(params.hiddenPct) || 0;
      const pChained1 = Number(params.chained1Pct) || 0;
      const pChained2 = Number(params.chained2Pct) || 0;
      const pIce = Number(params.icePct) || 0;
      const pCombined = Number(params.combinedPct) || 0;

      if ((z > 0 || isLayer0Only) && rollMech < pHidden) {
        mech = 'hidden';
      } else if (rollMech < pHidden + pChained1) {
        mech = 'chained1';
      } else if (rollMech < pHidden + pChained1 + pChained2) {
        mech = 'chained2';
      } else if (rollMech < pHidden + pChained1 + pChained2 + pIce) {
        mech = Math.random() > 0.5 ? 'ice2' : 'ice3';
      } else if (rollMech < pHidden + pChained1 + pChained2 + pIce + pCombined) {
        const remainingSlots = targetForThisLayer - placedThisLayer;
        const matchingShapes = COMBINE_SHAPES.filter(s => s.size <= combinedMaxSize && s.size <= remainingSlots);
        if (matchingShapes.length > 0) {
          const shape = matchingShapes[Math.floor(Math.random() * matchingShapes.length)];
          const valid = shape.offsets.every(o => {
            const cx = posX + o.dx;
            const cy = posY + o.dy;
            return cx >= 2 && cx <= 20 && cy >= 2 && cy <= 20 && !layerTiles.some(t => t.x === cx && t.y === cy);
          });
          if (valid) {
            clusterCells = shape.offsets.map(o => ({ x: posX + o.dx, y: posY + o.dy }));
            mech = 'combined';
          }
        }
      }

      if (clusterCells) {
        const cGroupId = `combo-gen-${id}`;
        clusterCells.forEach(cell => {
          layerTiles.push({
            id: `gen-${id++}`,
            x: cell.x,
            y: cell.y,
            z,
            mechanic: 'combined',
            combineGroupId: cGroupId,
            themeID: activeThemes[0] || 'theme00'
          });
          placedThisLayer++;
        });
      } else {
        const isHidden = mech === 'hidden';
        layerTiles.push({
          id: `gen-${id++}`,
          x: posX,
          y: posY,
          z,
          mechanic: mech,
          hiddenState: isHidden ? (params.hiddenSafetyMode || 'safe') : undefined,
          isRevealed: !isHidden,
          chainLevel: mech === 'chained2' ? 2 : mech === 'chained1' ? 1 : undefined,
          iceMatchesRemaining: mech === 'ice3' ? 3 : mech === 'ice2' ? 2 : undefined,
          themeID: activeThemes[0] || 'theme00'
        });
        placedThisLayer++;
      }
    }

    generatedTiles.push(...layerTiles);
  }

  // Ensure strict multiple of 3
  let remainder = generatedTiles.length % 3;
  if (remainder !== 0) {
    for (let i = generatedTiles.length - 1; i >= 0 && remainder > 0; i--) {
      generatedTiles.splice(i, 1);
      remainder--;
    }
  }

  // Apply event leaf items if enabled
  if (params.enableeventItemLeaf && !isLayer0Only) {
    const normalTiles = generatedTiles.filter(t => t.mechanic === 'normal');
    if (normalTiles.length >= 3) {
      const shuffled = [...normalTiles].sort(() => Math.random() - 0.5);
      for (let i = 0; i < 3; i++) {
        const target = generatedTiles.find(t => t.id === shuffled[i].id);
        if (target) {
          target.mechanic = 'eventItem';
          target.movesRemaining = 4;
          target.isEventItemActive = true;
        }
      }
    }
  }

  // Place goal gifts if requested
  if (params.includeGifts && !isLayer0Only) {
    const giftCount = Math.min(Math.max(Number(params.giftCount) || 1, 1), 3);
    const giftSizes = ['gift2x2', 'gift2x1', 'gift1x2'];
    const giftTypes = Object.keys(GIFT_THEMES);

    for (let g = 0; g < giftCount; g++) {
      const sizeKey = giftSizes[g % giftSizes.length];
      const gSize = GIFT_SIZES[sizeKey] || { cols: 2, rows: 2 };
      const gType = giftTypes[g % giftTypes.length] || DEFAULT_GIFT_THEME;
      const gVisual = GIFT_THEMES[gType]?.visualId ?? 0;

      // Position near quadrant centers
      const giftOffsets = [{ x: 6, y: 6 }, { x: 14, y: 14 }, { x: 14, y: 6 }];
      const pos = giftOffsets[g % giftOffsets.length];

      generatedTiles.push({
        id: `gen-gift-${generateId()}`,
        x: pos.x,
        y: pos.y,
        z: 0.5, // fractional layer below main board
        mechanic: sizeKey,
        isGift: true,
        giftCols: gSize.cols,
        giftRows: gSize.rows,
        giftType: gType,
        giftVisual: gVisual,
        isRevealedInPlay: false
      });
    }
  }

  return {
    tiles: generatedTiles,
    targetTileCount: generatedTiles.filter(t => !t.isGift).length,
    layersCount: numLayers,
    archetypeUsed: archetype
  };
};

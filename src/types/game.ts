import { ComponentType } from 'react';

export type ViewportPresetKey = 'default' | 'mobile' | 'tablet' | 'desktop';
export type EditorTool = 'place' | 'erase' | 'select';

export interface ViewportPreset {
  label: string;
  width: number;
  cellSize: number;
}

export interface Tile {
  id: string;
  x: number;
  y: number;
  z: number;
  mechanic?: string;
  themeID?: string;
  baseIcon?: string;
  color?: string;
  assignedIconId?: number | null;
  tripletGroupId?: string;
  chainLinks?: string[];
  chainLevel?: number;
  chainClearedCount?: number;
  iceMatchesRemaining?: number;
  combineGroupId?: string;
  movesRemaining?: number;
  isEventItemActive?: boolean;
  isRevealed?: boolean;

  // Gift specific fields
  isGift?: boolean;
  giftCols?: number;
  giftRows?: number;
  isRevealedInPlay?: boolean;

  // Internal export helpers
  _assignedIconId?: number | null;
  _assignedTheme?: string;
  _assignedIcon?: string;
  _assignedColor?: string;

  // Cluster grouping
  clusterId?: string;
}

export interface ClusterTileItem {
  relX: number;
  relY: number;
  relZ: number;
  mechanic?: string;
  themeID?: string;
  baseIcon?: string;
  color?: string;
}

export interface TileCluster {
  id: string;
  name: string;
  color: string;
  tileIds: string[];
  items?: ClusterTileItem[];
}

export type BotPersona = 'casual' | 'veteran' | 'hardcore';

export interface MoveLogItem {
  step: number;
  tileId: string;
  x: number;
  y: number;
  z: number;
  icon?: string;
  color?: string;
  mechanic?: string;
  timestamp: string;
  personaUsed?: BotPersona | 'human';
  actionType: 'tile_click' | 'booster_undo' | 'booster_magnet' | 'booster_swap' | 'booster_slotExpand';
  explanation: string;
  trayStateAfter: { icon?: string; color?: string }[];
  boardTilesRemaining: number;
}

export interface MoveSequencePayload {
  levelId: number;
  createdAt: string;
  persona?: BotPersona | 'human';
  totalMoves: number;
  completed: boolean;
  moves: MoveLogItem[];
  levelSnapshot?: {
    tilesCount: number;
    difficultyBand?: string;
  };
}

export interface DifficultyMod {
  label: string;
  multiplier: number;
  variants: number;
  startingMatches: number;
  targetMAI: string;
}

export interface DistributionPatternConfig {
  label: string;
  iconWeightFactor: number;
  defaultRatio: {
    themeIconRatio: number;
    colorIconRatio: number;
  };
}

export interface BoosterConfig {
  label: string;
  description: string;
  weight: number;
  category: 'tray' | 'board';
  diminishing: boolean;
}

export interface BoosterAvailability {
  undo: number;
  magnet: number;
  swap: number;
  slotExpand: number;
}

export interface ThemeWeights {
  [themeId: string]: number;
}

export interface IconPoolEntry {
  themeId: string;
  iconId: number;
  weight: number;
}

export interface ThemeIconRegistry {
  [themeId: string]: number[];
}

export interface SuggestParams {
  targetTiles: number | string;
  layers: number | string;
  stackRatio: number | string;
  diagonalRatio: number | string;
  layoutShape: string;
  hiddenPct: number | string;
  chained1Pct: number | string;
  chained2Pct: number | string;
  icePct: number | string;
  combinedPct: number | string;
  combinedMaxSize: number | string;
  enableeventItemLeaf: boolean;
}

export interface DifficultyStats {
  total: number;
  staticTotal: number;
  coreSubtotal: number;
  specialSubtotal: number;
  breakdown: {
    tileCount: number;
    icons: number;
    colors: number;
    stackCovers: number;
    diagCovers: number;
    mechanics: number;
    maiPenalty: number;
  };
  mai: string;
  startingMatchesCount: number;
  stackCoversCount: number;
  diagCoversCount: number;
  iconQuantities: Record<string, number>;
  colorQuantities: Record<string, number>;
  mechanicCounts: Record<string, number>;
  boosterBand: string;
  baseRelief: number;
  baseMultiplier: number;
  baseBoosterScore: number;
  medianRelief: number;
  medianMultiplier: number;
  medianBoosterScore: number;
  capRelief: number;
  capMultiplier: number;
  capBoosterScore: number;
  baseAvailability: BoosterAvailability;
  medianInventory: BoosterAvailability;
  capInventory: BoosterAvailability;
  comboTriplets: Record<string, { themeId: string; iconId: number; tiles: number; triplets: number; remainder: number }>;
  iconAggregated: Record<string, { iconId: number; tiles: number; triplets: number; remainder: number; themes: string[] }>;
  boardSpecialMechanics?: {
    timerScore: number;
    randomScore: number;
    bossScore: number;
    deliveryScore: number;
    total: number;
  };
}

export interface ImportWarning {
  type: string;
  title: string;
  detail: string;
}

export interface ValidatedImportData {
  parsed: any;
  tiles: any[];
  gifts?: any[];
  isRegistryFormat: boolean;
  formatSource?: string;
}

export interface BoardMorphismConfig {
  enabled: boolean;
  spinAngle: number;
  mirroredHorizons: boolean;
}

export interface BoardTimerConfig {
  enabled: boolean;
  duration: number; // in seconds
}

export interface BoardRandomConfig {
  enabled: boolean;
  interval: 5 | 10 | 15;
}

export interface BossBattleConfig {
  enabled: boolean;
  maxHP: number;
}

export interface SweetDeliveryConfig {
  enabled: boolean;
  orders: string[]; // List of 4 icon names that represent active orders
}

export type TileSpectrumBenefit = 'bonus_score' | 'wildcard_match' | 'clear_surrounding' | 'double_booster';
export type TileSpectrumDuration = 'entire_level' | 'moves_5' | 'moves_10';

export interface TileSpectrumEntry {
  id: string;
  targetType: 'theme' | 'icon';
  targetValue: string;
  benefit: TileSpectrumBenefit;
  duration: TileSpectrumDuration;
}

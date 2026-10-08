import { ComponentType } from 'react';
import {
  Star, Heart, Sun, Moon, Flower, Fish, Cloud, Flame, Zap, Droplet,
  Box, Link, Layers, Eye, Leaf, Boxes, Gift, Sparkles, Gem, Award, Package
} from 'lucide-react';
import {
  ViewportPreset,
  DifficultyMod,
  DistributionPatternConfig,
  BoosterConfig,
  BoosterAvailability,
  GiftSizeConfig,
  GiftThemeConfig,
  Tile
} from '../types/game';

export const VIEWPORT_PRESETS: Record<string, ViewportPreset> = {
  default: { label: 'Default', width: 480, cellSize: 20 },
  mobile: { label: 'Mobile', width: 320, cellSize: 20 },
  tablet: { label: 'Tablet', width: 640, cellSize: 20 },
  desktop: { label: 'Desktop', width: 800, cellSize: 20 },
};

export const INTRINSIC_BOARD_SIZE = 480;
export const STACK_OFFSET_PX = 4;

export const WEIGHTS = {
  tileCount: { base: 0.05, earlyLevel: 0.03, highCount: 0.08 },
  iconCount: { theme: 1.50, color: 0.80 },
  layerCount: { diagonal: 1.00, stack: 1.80 },
  mai: { base: 0.50, dangerMultiplier: 2.00, sweetSpot: 3.50, dangerThreshold: 2.00 },
  mechanics: {
    normal: 0,
    chained: 1.80,
    chained1: 1.60,
    chained2: 2.10,
    ice: 1.70,
    ice2: 1.20,
    ice3: 2.20,
    combined: 1.40,
    hidden: 0.03,
    eventItem: 2.50,
    gift2x1: 0,
    gift1x2: 0,
    gift2x2: 0,
    gift2x3: 0,
    gift3x2: 0,
    gift3x3: 0,
    gift4x4: 0,
  }
};

export const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Star, Heart, Sun, Moon, Flower, Fish, Cloud, Flame, Zap, Droplet
};

export const COLORS = [
  { id: 'red', class: 'text-red-500', bg: 'bg-red-100', border: 'border-red-300' },
  { id: 'blue', class: 'text-blue-500', bg: 'bg-blue-100', border: 'border-blue-300' },
  { id: 'green', class: 'text-green-500', bg: 'bg-green-100', border: 'border-green-300' },
  { id: 'yellow', class: 'text-yellow-500', bg: 'bg-yellow-100', border: 'border-yellow-300' },
  { id: 'purple', class: 'text-purple-500', bg: 'bg-purple-100', border: 'border-purple-300' }
];

export const ALL_THEMES = ['theme00', 'theme01', 'theme02'];

export const THEME_DOT_COLORS: Record<string, string> = {
  theme00: 'bg-emerald-400',
  theme01: 'bg-blue-400',
  theme02: 'bg-purple-400',
};

export const MECHANICS = [
  { id: 'normal', label: 'Normal', icon: Box },
  { id: 'chained', label: 'Chain', icon: Link },
  { id: 'ice', label: 'Ice', icon: Layers },
  { id: 'combined', label: 'Combined', icon: Boxes },
  { id: 'gift', label: 'Gift', icon: Gift },
  { id: 'hidden', label: 'Hidden', icon: Eye },
  { id: 'eventItem', label: 'Event Item', icon: Leaf },
];

export interface ConvertibleMechanic {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  badgeClass: string;
  description: string;
}

// Special mechanic types that can be converted in Select mode (strictly excluding Gift)
export const CONVERTIBLE_MECHANICS: ConvertibleMechanic[] = [
  {
    id: 'normal',
    label: 'Normal (Standard)',
    shortLabel: 'Normal',
    icon: Box,
    colorClass: 'text-slate-300 border-slate-700 bg-slate-900/80 hover:bg-slate-800',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    description: 'Removes special mechanic; returns to regular matchable tile'
  },
  {
    id: 'chained1',
    label: 'Chain Restraint Lv1',
    shortLabel: 'Chain 1',
    icon: Link,
    colorClass: 'text-cyan-300 border-cyan-600/60 bg-cyan-950/40 hover:bg-cyan-900/50',
    badgeClass: 'bg-cyan-950 text-cyan-300 border-cyan-600',
    description: 'Restrained tile, requires 1 adjacent match to break chains'
  },
  {
    id: 'chained2',
    label: 'Chain Restraint Lv2',
    shortLabel: 'Chain 2',
    icon: Link,
    colorClass: 'text-blue-300 border-blue-600/60 bg-blue-950/40 hover:bg-blue-900/50',
    badgeClass: 'bg-blue-950 text-blue-300 border-blue-600',
    description: 'Heavy chains, requires 2 adjacent matches to break'
  },
  {
    id: 'ice2',
    label: 'Ice Layer (2 Matches)',
    shortLabel: 'Ice 2❄',
    icon: Layers,
    colorClass: 'text-sky-300 border-sky-600/60 bg-sky-950/40 hover:bg-sky-900/50',
    badgeClass: 'bg-sky-950 text-sky-300 border-sky-600',
    description: 'Frozen tile, needs 2 matches to shatter ice'
  },
  {
    id: 'ice3',
    label: 'Ice Layer (3 Matches)',
    shortLabel: 'Ice 3❄',
    icon: Layers,
    colorClass: 'text-indigo-300 border-indigo-600/60 bg-indigo-950/40 hover:bg-indigo-900/50',
    badgeClass: 'bg-indigo-950 text-indigo-300 border-indigo-600',
    description: 'Dense freeze, needs 3 matches to shatter ice'
  },
  {
    id: 'hidden',
    label: 'Hidden (Safe Layer)',
    shortLabel: 'Hidden Safe',
    icon: Eye,
    colorClass: 'text-purple-300 border-purple-600/60 bg-purple-950/40 hover:bg-purple-900/50',
    badgeClass: 'bg-purple-950 text-purple-300 border-purple-600',
    description: 'Spreads available icons strictly on sitting layer'
  },
  {
    id: 'hidden-unsafe',
    label: 'Hidden (Unsafe Random)',
    shortLabel: 'Hidden Unsafe',
    icon: Eye,
    colorClass: 'text-amber-300 border-amber-600/60 bg-amber-950/40 hover:bg-amber-900/50',
    badgeClass: 'bg-amber-950 text-amber-300 border-amber-600',
    description: 'Global pool icons with higher randomness'
  },
  {
    id: 'eventItem',
    label: 'Event Item (Countdown)',
    shortLabel: 'Event',
    icon: Leaf,
    colorClass: 'text-emerald-300 border-emerald-600/60 bg-emerald-950/40 hover:bg-emerald-900/50',
    badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-600',
    description: 'Countdown item with 4 moves remaining'
  },
];

/**
 * Transforms a single tile into another mechanic.
 * Strictly guarantees that Gift tiles are NOT modified.
 */
export function applyMechanicToTile(tile: Tile, targetMech: string): Tile {
  if (tile.isGift) return tile; // Gifts strictly preserved & excluded

  if (targetMech === 'normal') {
    const { chainLevel, chainLinks, chainClearedCount, iceMatchesRemaining, movesRemaining, isEventItemActive, isRevealed, hiddenState, ...rest } = tile;
    return {
      ...rest,
      mechanic: undefined,
      hiddenState: undefined,
    };
  }

  if (targetMech === 'chained1' || targetMech === 'chained') {
    return {
      ...tile,
      mechanic: 'chained1',
      chainLevel: 1,
      chainClearedCount: 0,
      iceMatchesRemaining: undefined,
      movesRemaining: undefined,
      hiddenState: undefined,
    };
  }

  if (targetMech === 'chained2') {
    return {
      ...tile,
      mechanic: 'chained2',
      chainLevel: 2,
      chainClearedCount: 0,
      iceMatchesRemaining: undefined,
      movesRemaining: undefined,
      hiddenState: undefined,
    };
  }

  if (targetMech === 'ice2' || targetMech === 'ice') {
    return {
      ...tile,
      mechanic: 'ice2',
      iceMatchesRemaining: 2,
      chainLevel: undefined,
      chainClearedCount: undefined,
      movesRemaining: undefined,
      hiddenState: undefined,
    };
  }

  if (targetMech === 'ice3') {
    return {
      ...tile,
      mechanic: 'ice3',
      iceMatchesRemaining: 3,
      chainLevel: undefined,
      chainClearedCount: undefined,
      movesRemaining: undefined,
      hiddenState: undefined,
    };
  }

  if (targetMech === 'hidden' || targetMech === 'hidden-safe') {
    return {
      ...tile,
      mechanic: 'hidden',
      hiddenState: 'safe',
      isRevealed: false,
      chainLevel: undefined,
      chainClearedCount: undefined,
      iceMatchesRemaining: undefined,
      movesRemaining: undefined,
    };
  }

  if (targetMech === 'hidden-unsafe') {
    return {
      ...tile,
      mechanic: 'hidden',
      hiddenState: 'unsafe',
      isRevealed: false,
      chainLevel: undefined,
      chainClearedCount: undefined,
      iceMatchesRemaining: undefined,
      movesRemaining: undefined,
    };
  }

  if (targetMech === 'eventItem') {
    return {
      ...tile,
      mechanic: 'eventItem',
      movesRemaining: 4,
      chainLevel: undefined,
      chainClearedCount: undefined,
      iceMatchesRemaining: undefined,
      hiddenState: undefined,
    };
  }

  return {
    ...tile,
    mechanic: targetMech,
  };
}

export const INITIAL_DIFFICULTY_MODS: Record<string, DifficultyMod> = {
  modEasy: { label: 'Easy (Relaxed Flow)', multiplier: 0.8, variants: 6, startingMatches: 4, targetMAI: '> 3.50' },
  modMedium: { label: 'Medium (Balanced)', multiplier: 1.0, variants: 12, startingMatches: 3, targetMAI: '3.0 - 3.5' },
  modHard: { label: 'Tight Pacing', multiplier: 1.25, variants: 18, startingMatches: 2, targetMAI: '2.0 - 2.9' },
  modVeryHard: { label: 'Scarcity', multiplier: 1.5, variants: 26, startingMatches: 1, targetMAI: '1.5 - 1.9' },
  modExpert: { label: 'Danger Zone', multiplier: 1.8, variants: 35, startingMatches: 0, targetMAI: '< 1.50' }
};

export const DISTRIBUTION_PATTERNS: Record<string, DistributionPatternConfig> = {
  themeFocus: { label: 'Theme Focus', iconWeightFactor: 1.1, defaultRatio: { themeIconRatio: 85, colorIconRatio: 15 } },
  colorScatter: { label: 'Color Scatter', iconWeightFactor: 1.3, defaultRatio: { themeIconRatio: 30, colorIconRatio: 70 } },
  heavyStack: { label: 'Heavy Stacking', iconWeightFactor: 1.0, defaultRatio: { themeIconRatio: 60, colorIconRatio: 40 } },
  pyramidCascades: { label: 'Pyramid Cascades', iconWeightFactor: 1.0, defaultRatio: { themeIconRatio: 75, colorIconRatio: 25 } },
  hybrid: { label: 'Hybrid (Blend 2)', iconWeightFactor: 1.2, defaultRatio: { themeIconRatio: 50, colorIconRatio: 50 } },
  random: { label: 'Random (Pure Stochastic)', iconWeightFactor: 1.0, defaultRatio: { themeIconRatio: 50, colorIconRatio: 50 } }
};

export interface CombineShapeConfig {
  id: string;
  category: 'Straight Line' | 'T Shape' | 'Square Shape' | 'L Shape' | 'Z Shape';
  size: number;
  name: string;
  offsets: { dx: number; dy: number }[];
}

export const COMBINE_SHAPES: CombineShapeConfig[] = [
  // 1. Straight Line (Horizontal & Vertical, max 4 tiles)
  { id: '2-line-h', category: 'Straight Line', size: 2, name: '2-Line (Horizontal)', offsets: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }] },
  { id: '2-line-v', category: 'Straight Line', size: 2, name: '2-Line (Vertical)', offsets: [{ dx: 0, dy: 0 }, { dx: 0, dy: 2 }] },
  { id: '3-line-h', category: 'Straight Line', size: 3, name: '3-Line (Horizontal)', offsets: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }, { dx: 4, dy: 0 }] },
  { id: '3-line-v', category: 'Straight Line', size: 3, name: '3-Line (Vertical)', offsets: [{ dx: 0, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: 4 }] },
  { id: '4-line-h', category: 'Straight Line', size: 4, name: '4-Line (Horizontal)', offsets: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }, { dx: 4, dy: 0 }, { dx: 6, dy: 0 }] },
  { id: '4-line-v', category: 'Straight Line', size: 4, name: '4-Line (Vertical)', offsets: [{ dx: 0, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: 4 }, { dx: 0, dy: 6 }] },

  // 2. T Shape (Max 4 tiles)
  { id: '4-t-shape', category: 'T Shape', size: 4, name: '4-T-Shape', offsets: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }, { dx: 4, dy: 0 }, { dx: 2, dy: 2 }] },

  // 3. Square Shape (Max 4 tiles)
  { id: '4-square', category: 'Square Shape', size: 4, name: '4-Square', offsets: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }, { dx: 0, dy: 2 }, { dx: 2, dy: 2 }] },

  // 4. L Shape (3 & 4 tiles)
  { id: '3-l-shape', category: 'L Shape', size: 3, name: '3-L-Shape', offsets: [{ dx: 0, dy: 0 }, { dx: 0, dy: 2 }, { dx: 2, dy: 2 }] },
  { id: '4-l-shape', category: 'L Shape', size: 4, name: '4-L-Shape', offsets: [{ dx: 0, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: 4 }, { dx: 2, dy: 4 }] },

  // 5. Z Shape (Max 4 tiles)
  { id: '4-z-shape', category: 'Z Shape', size: 4, name: '4-Z-Shape', offsets: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }, { dx: 2, dy: 2 }, { dx: 4, dy: 2 }] },
];

export const GIFT_SIZES: Record<string, GiftSizeConfig> = {
  // 1. Mini Gift (Single cell)
  gift1x1: { cols: 1, rows: 1, name: 'Gift 1x1 (Mini)', category: 'Mini' },

  // 2. Compact Gifts
  gift2x1: { cols: 2, rows: 1, name: 'Gift 2x1', category: 'Compact' },
  gift1x2: { cols: 1, rows: 2, name: 'Gift 1x2', category: 'Compact' },
  gift2x2: { cols: 2, rows: 2, name: 'Gift 2x2', category: 'Compact' },

  // 3. Strips & Linear Bars
  gift3x1: { cols: 3, rows: 1, name: 'Gift 3x1 (Bar)', category: 'Strip' },
  gift1x3: { cols: 1, rows: 3, name: 'Gift 1x3 (Column)', category: 'Strip' },
  gift4x1: { cols: 4, rows: 1, name: 'Gift 4x1 (Wide Strip)', category: 'Strip' },
  gift1x4: { cols: 1, rows: 4, name: 'Gift 1x4 (Tall Strip)', category: 'Strip' },

  // 4. Standard Shapes
  gift3x2: { cols: 3, rows: 2, name: 'Gift 3x2', category: 'Standard' },
  gift2x3: { cols: 2, rows: 3, name: 'Gift 2x3', category: 'Standard' },
  gift3x3: { cols: 3, rows: 3, name: 'Gift 3x3', category: 'Standard' },

  // 5. Large & Towers
  gift4x2: { cols: 4, rows: 2, name: 'Gift 4x2 (Wide Plate)', category: 'Large' },
  gift2x4: { cols: 2, rows: 4, name: 'Gift 2x4 (Tower)', category: 'Large' },

  // 6. Grand Vaults
  gift4x3: { cols: 4, rows: 3, name: 'Gift 4x3 (Grand)', category: 'Grand' },
  gift3x4: { cols: 3, rows: 4, name: 'Gift 3x4 (High Grand)', category: 'Grand' },
  gift4x4: { cols: 4, rows: 4, name: 'Gift 4x4 (Grand Square)', category: 'Grand' },

  // 7. Mega & Colossal
  gift5x5: { cols: 5, rows: 5, name: 'Gift 5x5 (Mega Vault)', category: 'Mega' },
  gift6x6: { cols: 6, rows: 6, name: 'Gift 6x6 (Colossal)', category: 'Mega' }
};

export const DEFAULT_GIFT_THEME = 'golden';

export const GIFT_THEMES: Record<string, GiftThemeConfig> = {
  golden: {
    id: 'golden',
    visualId: 0,
    label: 'Gold Royal',
    description: 'Classic royal gold box with crimson satin ribbon & gold bow',
    accent: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.9)',
    editBg: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 border-amber-300 text-amber-950',
    playCoveredBg: 'border-amber-700/60 bg-amber-950/75',
    playRevealedBg: 'bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 border-yellow-200',
    ribbonColor: 'bg-rose-600/90 border-rose-400/80',
    sparkleColor: 'text-amber-200',
    iconName: 'Gift'
  },
  mystery: {
    id: 'mystery',
    visualId: 1,
    label: 'Mystery Star',
    description: 'Cosmic purple celestial chest with nebula starlight',
    accent: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.9)',
    editBg: 'bg-gradient-to-br from-purple-500 via-fuchsia-600 to-indigo-700 border-purple-300 text-purple-100',
    playCoveredBg: 'border-purple-800/60 bg-purple-950/75',
    playRevealedBg: 'bg-gradient-to-br from-purple-400 via-fuchsia-500 to-indigo-600 border-purple-200',
    ribbonColor: 'bg-indigo-900/90 border-purple-400/80',
    sparkleColor: 'text-purple-200',
    iconName: 'Sparkles'
  },
  crystal: {
    id: 'crystal',
    visualId: 2,
    label: 'Ice Crystal',
    description: 'Crystalline arctic diamond box with frost glimmer',
    accent: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.9)',
    editBg: 'bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-600 border-cyan-200 text-cyan-950',
    playCoveredBg: 'border-cyan-800/60 bg-cyan-950/75',
    playRevealedBg: 'bg-gradient-to-br from-cyan-300 via-teal-400 to-sky-500 border-cyan-100',
    ribbonColor: 'bg-sky-800/90 border-cyan-300/80',
    sparkleColor: 'text-cyan-200',
    iconName: 'Gem'
  },
  ruby: {
    id: 'ruby',
    visualId: 3,
    label: 'Ruby Velvet',
    description: 'Deep crimson velvet luxury box with gold regal trim',
    accent: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.9)',
    editBg: 'bg-gradient-to-br from-rose-500 via-red-600 to-rose-700 border-rose-300 text-rose-100',
    playCoveredBg: 'border-rose-800/60 bg-rose-950/75',
    playRevealedBg: 'bg-gradient-to-br from-rose-400 via-red-500 to-rose-600 border-yellow-200',
    ribbonColor: 'bg-amber-400/90 border-amber-300/80',
    sparkleColor: 'text-rose-200',
    iconName: 'Heart'
  },
  emerald: {
    id: 'emerald',
    visualId: 4,
    label: 'Emerald Vault',
    description: 'Vibrant jade fortune vault with gold coin accents',
    accent: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.9)',
    editBg: 'bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 border-emerald-300 text-emerald-100',
    playCoveredBg: 'border-emerald-800/60 bg-emerald-950/75',
    playRevealedBg: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 border-emerald-200',
    ribbonColor: 'bg-amber-500/90 border-yellow-300/80',
    sparkleColor: 'text-emerald-200',
    iconName: 'Award'
  },
  chest: {
    id: 'chest',
    visualId: 5,
    label: 'Wood Chest',
    description: 'Rustic pirate treasure chest with brass fittings & lock',
    accent: '#b45309',
    glowColor: 'rgba(180, 83, 9, 0.9)',
    editBg: 'bg-gradient-to-br from-amber-700 via-yellow-900 to-stone-900 border-amber-500 text-amber-200',
    playCoveredBg: 'border-amber-900/60 bg-stone-950/80',
    playRevealedBg: 'bg-gradient-to-br from-amber-600 via-yellow-700 to-stone-800 border-yellow-400',
    ribbonColor: 'bg-stone-800/90 border-amber-600/80',
    sparkleColor: 'text-amber-300',
    iconName: 'Package'
  },
  tech: {
    id: 'tech',
    visualId: 6,
    label: 'Cyber Cache',
    description: 'Futuristic high-tech energy cell with pulsing neon lines',
    accent: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.9)',
    editBg: 'bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 border-cyan-400 text-cyan-200',
    playCoveredBg: 'border-blue-900/60 bg-slate-950/80',
    playRevealedBg: 'bg-gradient-to-br from-blue-500 via-cyan-600 to-indigo-700 border-cyan-300',
    ribbonColor: 'bg-fuchsia-600/90 border-cyan-400/80',
    sparkleColor: 'text-cyan-200',
    iconName: 'Zap'
  }
};

export const GIFT_LAYERS = [0.5, 1.5, 2.5, 3.5, 4.5];
export const BYTES_VERSION = "1.0";
export const BYTES_ID_RANGE_START = 1001;
export const BYTES_ID_RANGE_END = 9999;

export const BOOSTER_TYPES: Record<string, BoosterConfig> = {
  undo: {
    label: 'Undo',
    description: 'Revert last tile from tray',
    weight: -0.4,
    category: 'tray',
    diminishing: false
  },
  magnet: {
    label: 'Magnet',
    description: 'Create free match with tray tiles',
    weight: -0.8,
    category: 'tray',
    diminishing: false
  },
  swap: {
    label: 'Swap',
    description: 'Shuffle all icons (keep layout)',
    weight: -1.5,
    category: 'board',
    diminishing: true
  },
  slotExpand: {
    label: 'Slot Expand',
    description: '+1 tray slot until level ends',
    weight: -1.2,
    category: 'tray',
    diminishing: false
  }
};

export const BOOSTER_PRESETS: Record<string, { label: string; availability: BoosterAvailability | null }> = {
  none: {
    label: 'None (Levels 1-10)',
    availability: { undo: 0, magnet: 0, swap: 0, slotExpand: 0 }
  },
  forgiving: {
    label: 'Forgiving (Levels 11-30)',
    availability: { undo: 3, magnet: 2, swap: 2, slotExpand: 2 }
  },
  balance: {
    label: 'Balance (Levels 11-30)',
    availability: { undo: 2, magnet: 1, swap: 1, slotExpand: 1 }
  },
  tryHard: {
    label: 'Try-hard (Levels 11-30)',
    availability: { undo: 1, magnet: 1, swap: 1, slotExpand: 0 }
  },
  standard: {
    label: 'Standard (Levels 31+)',
    availability: { undo: 2, magnet: 1, swap: 1, slotExpand: 0 }
  },
  custom: {
    label: 'Custom',
    availability: null
  }
};

export const BOOSTER_CAPS: Record<string, BoosterAvailability> = {
  '11-30': { undo: 5, magnet: 3, swap: 3, slotExpand: 2 },
  '31-50': { undo: 7, magnet: 4, swap: 4, slotExpand: 3 },
  '51-80': { undo: 10, magnet: 6, swap: 6, slotExpand: 4 },
  '81-120': { undo: 15, magnet: 8, swap: 8, slotExpand: 5 },
  '121+': { undo: 20, magnet: 10, swap: 10, slotExpand: 6 }
};

export const BOOSTER_MEDIANS: Record<string, BoosterAvailability> = {
  '11-30': { undo: 1, magnet: 0, swap: 0, slotExpand: 0 },
  '31-50': { undo: 3, magnet: 1, swap: 1, slotExpand: 0 },
  '51-80': { undo: 5, magnet: 2, swap: 2, slotExpand: 1 },
  '81-120': { undo: 8, magnet: 4, swap: 3, slotExpand: 2 },
  '121+': { undo: 10, magnet: 5, swap: 4, slotExpand: 3 }
};

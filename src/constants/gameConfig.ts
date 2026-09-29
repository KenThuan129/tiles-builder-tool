import { ComponentType } from 'react';
import {
  Star, Heart, Sun, Moon, Flower, Fish, Cloud, Flame, Zap, Droplet,
  Box, Link, Layers, Eye, Leaf, Boxes, Gift
} from 'lucide-react';
import {
  ViewportPreset,
  DifficultyMod,
  DistributionPatternConfig,
  BoosterConfig,
  BoosterAvailability
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
    gift2x2: 0,
    gift2x3: 0,
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

export const GIFT_SIZES: Record<string, { cols: number; rows: number; name: string }> = {
  gift2x2: { cols: 2, rows: 2, name: 'Gift 2x2' },
  gift2x3: { cols: 2, rows: 3, name: 'Gift 2x3' },
  gift3x3: { cols: 3, rows: 3, name: 'Gift 3x3' },
  gift4x4: { cols: 4, rows: 4, name: 'Gift 4x4' }
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

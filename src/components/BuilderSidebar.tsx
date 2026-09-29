import React from 'react';
import {
  Pickaxe, RefreshCw, Shuffle, Square, Trash2, Edit3, Sliders, Layers,
  Upload, Zap, Boxes, X, Lock, RotateCcw, RotateCw, Gift, Link, Sparkles, MousePointer
} from 'lucide-react';
import {
  Tile, DifficultyMod, ThemeWeights, IconPoolEntry, ThemeIconRegistry,
  BoosterAvailability, DifficultyStats, TileCluster,
  BoardMorphismConfig, TileSpectrumEntry, TileSpectrumBenefit, TileSpectrumDuration,
  EditorTool
} from '../types/game';
import {
  ALL_THEMES, THEME_DOT_COLORS, MECHANICS, GIFT_LAYERS, GIFT_SIZES,
  DISTRIBUTION_PATTERNS, BOOSTER_PRESETS, BOOSTER_TYPES, COMBINE_SHAPES
} from '../constants/gameConfig';
import { IconPoolEditor } from './IconPoolEditor';
import { ClusterManager } from './ClusterManager';
import { LicenseData } from '../utils/licenseService';

interface BuilderSidebarProps {
  mode: 'edit' | 'play';
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  levelNum: number;
  setLevelNum: (val: number) => void;
  selectedTool: EditorTool;
  setSelectedTool: (tool: EditorTool) => void;
  giftPlacementMode: string | null;
  setGiftPlacementMode: (mode: string | null) => void;
  activeLayer: number;
  setActiveLayer: (layer: number) => void;
  activeGiftLayer: number;
  setActiveGiftLayer: (layer: number) => void;
  layerViewMode: 'all' | 'cumulative' | 'isolated';
  setLayerViewMode: (mode: 'all' | 'cumulative' | 'isolated') => void;
  difficultyMod: string;
  setDifficultyMod: (mod: string) => void;
  difficultyMods: Record<string, DifficultyMod>;
  setDifficultyMods: React.Dispatch<React.SetStateAction<Record<string, DifficultyMod>>>;
  isModEditorOpen: boolean;
  setIsModEditorOpen: (open: boolean) => void;
  distributionPattern: string;
  setDistributionPattern: (pattern: string) => void;
  hybridSub1: string;
  setHybridSub1: (val: string) => void;
  hybridSub2: string;
  setHybridSub2: (val: string) => void;
  iconColorRatio: { themeIconRatio: number; colorIconRatio: number };
  setIconColorRatio: (ratio: { themeIconRatio: number; colorIconRatio: number }) => void;
  themeWeights: ThemeWeights;
  setThemeWeights: React.Dispatch<React.SetStateAction<ThemeWeights>>;
  activeThemes: string[];
  themeIconRegistry: ThemeIconRegistry | null;
  distributionMode: 'theme' | 'icon';
  setDistributionMode: (mode: 'theme' | 'icon') => void;
  iconPool: IconPoolEntry[];
  setIconPool: (pool: IconPoolEntry[]) => void;
  iconBudgetOverride: number | null;
  setIconBudgetOverride: (val: number | null) => void;
  currentIconBudget: { maxIcons: number; minRepeat: number };
  showOnlyUnbalanced: boolean;
  setShowOnlyUnbalanced: (show: boolean) => void;
  selectedMechanic: string;
  setSelectedMechanic: (mech: string) => void;
  selectedCombineShapeId: string;
  setSelectedCombineShapeId: (id: string) => void;
  combineTileCountFilter: number | 'all';
  setCombineTileCountFilter: (val: number | 'all') => void;
  chainLevel: number;
  setChainLevel: (lvl: number) => void;
  iceMatchReq: number;
  setIceMatchReq: (val: number) => void;
  boardMorphism: BoardMorphismConfig;
  setBoardMorphism: React.Dispatch<React.SetStateAction<BoardMorphismConfig>>;
  tileSpectrums: TileSpectrumEntry[];
  setTileSpectrums: React.Dispatch<React.SetStateAction<TileSpectrumEntry[]>>;
  boosterPreset: string;
  setBoosterPreset: (preset: string) => void;
  boosterCustom: BoosterAvailability;
  setBoosterCustom: React.Dispatch<React.SetStateAction<BoosterAvailability>>;
  baseAvailability: BoosterAvailability;
  tiles: Tile[];
  playTiles: Tile[];
  setTiles: React.Dispatch<React.SetStateAction<Tile[]>>;
  generateRandomLayout: () => void;
  setIsSuggestModalOpen: (open: boolean) => void;
  setIsThemeImportModalOpen: (open: boolean) => void;
  handleClearThemeRegistry: () => void;
  redistributeThemes: () => void;
  difficultyStats: DifficultyStats;
  // Clusters
  clusters: TileCluster[];
  setClusters: React.Dispatch<React.SetStateAction<TileCluster[]>>;
  clusterSelectionMode: string | null;
  setClusterSelectionMode: (mode: string | null) => void;
  clusterPlacementMode: string | null;
  setClusterPlacementMode: (mode: string | null) => void;
  highlightedClusterId: string | null;
  setHighlightedClusterId: (id: string | null) => void;
  // License Gating Props
  activeLicense: LicenseData | null;
  onRequirePro: (featureName: string, featureDescription: string) => void;
  // Undo / Redo for Tile Editor
  onUndoEdit?: () => void;
  onRedoEdit?: () => void;
  canUndoEdit?: boolean;
  canRedoEdit?: boolean;
}

const SpectrumAddForm: React.FC<{
  activeThemes: string[];
  onAdd: (entry: TileSpectrumEntry) => void;
}> = ({ activeThemes, onAdd }) => {
  const [targetType, setTargetType] = React.useState<'theme' | 'icon'>('theme');
  const [targetValue, setTargetValue] = React.useState<string>(activeThemes[0] || 'theme00');
  const [benefit, setBenefit] = React.useState<TileSpectrumBenefit>('bonus_score');
  const [duration, setDuration] = React.useState<TileSpectrumDuration>('entire_level');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: `spectrum-${Date.now()}`,
      targetType,
      targetValue,
      benefit,
      duration,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 p-2 rounded border border-slate-800 space-y-1.5 text-[10px]">
      <div className="grid grid-cols-2 gap-1">
        <div>
          <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Target Type</label>
          <select
            value={targetType}
            onChange={(e) => {
              const tt = e.target.value as 'theme' | 'icon';
              setTargetType(tt);
              setTargetValue(tt === 'theme' ? (activeThemes[0] || 'theme00') : 'Star');
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-white cursor-pointer"
          >
            <option value="theme">Theme</option>
            <option value="icon">Icon ID</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Target Value</label>
          {targetType === 'theme' ? (
            <select
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-white cursor-pointer"
            >
              {ALL_THEMES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          ) : (
            <select
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-white cursor-pointer"
            >
              {['Star', 'Heart', 'Sun', 'Moon', 'Flower', 'Fish', 'Cloud', 'Flame', 'Zap', 'Droplet'].map(ic => (
                <option key={ic} value={ic}>{ic}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <div>
          <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Benefit</label>
          <select
            value={benefit}
            onChange={(e) => setBenefit(e.target.value as TileSpectrumBenefit)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-amber-300 font-bold cursor-pointer"
          >
            <option value="bonus_score">Bonus Score (2x)</option>
            <option value="wildcard_match">Wildcard Match</option>
            <option value="clear_surrounding">Clear Surrounding</option>
            <option value="double_booster">Double Booster Fill</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Duration</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value as TileSpectrumDuration)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-cyan-300 font-bold cursor-pointer"
          >
            <option value="entire_level">Entire Level</option>
            <option value="moves_5">First 5 Moves</option>
            <option value="moves_10">First 10 Moves</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-1 rounded transition-colors cursor-pointer text-[10px] mt-1 shadow"
      >
        + Add Tiles-spectrum
      </button>
    </form>
  );
};

export const BuilderSidebar: React.FC<BuilderSidebarProps> = ({
  mode,
  isOpenMobile,
  onCloseMobile,
  levelNum,
  setLevelNum,
  selectedTool,
  setSelectedTool,
  giftPlacementMode,
  setGiftPlacementMode,
  activeLayer,
  setActiveLayer,
  activeGiftLayer,
  setActiveGiftLayer,
  layerViewMode,
  setLayerViewMode,
  difficultyMod,
  setDifficultyMod,
  difficultyMods,
  setDifficultyMods,
  isModEditorOpen,
  setIsModEditorOpen,
  distributionPattern,
  setDistributionPattern,
  hybridSub1,
  setHybridSub1,
  hybridSub2,
  setHybridSub2,
  iconColorRatio,
  setIconColorRatio,
  themeWeights,
  setThemeWeights,
  activeThemes,
  themeIconRegistry,
  distributionMode,
  setDistributionMode,
  iconPool,
  setIconPool,
  iconBudgetOverride,
  setIconBudgetOverride,
  currentIconBudget,
  showOnlyUnbalanced,
  setShowOnlyUnbalanced,
  selectedMechanic,
  setSelectedMechanic,
  selectedCombineShapeId,
  setSelectedCombineShapeId,
  combineTileCountFilter,
  setCombineTileCountFilter,
  chainLevel,
  setChainLevel,
  iceMatchReq,
  setIceMatchReq,
  boardMorphism,
  setBoardMorphism,
  tileSpectrums,
  setTileSpectrums,
  boosterPreset,
  setBoosterPreset,
  boosterCustom,
  setBoosterCustom,
  baseAvailability,
  tiles,
  playTiles,
  setTiles,
  generateRandomLayout,
  setIsSuggestModalOpen,
  setIsThemeImportModalOpen,
  handleClearThemeRegistry,
  redistributeThemes,
  difficultyStats,
  clusters,
  setClusters,
  clusterSelectionMode,
  setClusterSelectionMode,
  clusterPlacementMode,
  setClusterPlacementMode,
  highlightedClusterId,
  setHighlightedClusterId,
  activeLicense,
  onRequirePro,
  onUndoEdit,
  onRedoEdit,
  canUndoEdit = false,
  canRedoEdit = false,
}) => {
  const matchableCount = tiles.filter(t => !t.isGift).length;
  const isPlayable = matchableCount > 0 && matchableCount % 3 === 0;
  const isPro = !!activeLicense;

  const handleSuggestClick = () => {
    if (!isPro) {
      onRequirePro(
        'Procedural Level Generator',
        'Generating procedural level shapes (cascading pyramids, cluster islands, spirals) with custom parameter ratios is a Pro Studio feature.'
      );
      return;
    }
    setIsSuggestModalOpen(true);
  };

  const handleRandomClick = () => {
    if (!isPro) {
      onRequirePro(
        'Random Layout Generator',
        'Procedural level layout generation requires a Pro Studio License.'
      );
      return;
    }
    generateRandomLayout();
  };

  const handleTuneBandsClick = () => {
    if (!isPro) {
      onRequirePro(
        'Custom Difficulty Band Tuning',
        'Customizing starting match quotas, variant pool sizes, and difficulty band multipliers requires a Pro Studio License.'
      );
      return;
    }
    setIsModEditorOpen(!isModEditorOpen);
  };

  const handleImportThemeClick = () => {
    if (!isPro) {
      onRequirePro(
        'Theme Icon Registry Importer',
        'Importing custom Theme Registries with numeric icon IDs requires a Pro Studio License.'
      );
      return;
    }
    setIsThemeImportModalOpen(true);
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`
          fixed lg:static top-0 left-0 bottom-0 z-40
          w-80 max-w-[85vw] bg-slate-800/95 backdrop-blur-md border-r border-slate-700/80 p-4 flex flex-col gap-4 transition-transform duration-300 overflow-y-auto shrink-0 shadow-2xl lg:shadow-none
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${mode === 'play' ? 'lg:-ml-80' : 'lg:ml-0'}
        `}
      >
        <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-700">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Pickaxe className="w-4 h-4" /> Builder Tools
          </span>
          <button
            onClick={onCloseMobile}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <div className="hidden lg:flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Pickaxe className="w-4 h-4 text-amber-400" /> Builder Tools
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={onUndoEdit}
                disabled={!canUndoEdit}
                title="Undo tile edit (Ctrl+Z)"
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  canUndoEdit
                    ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200'
                    : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRedoEdit}
                disabled={!canRedoEdit}
                title="Redo tile edit (Ctrl+Y or Ctrl+Shift+Z)"
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  canRedoEdit
                    ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200'
                    : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRandomClick}
                title="Generate New Random Layout (Pro)"
                className="flex items-center justify-center gap-1 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                {!isPro && <Lock className="w-3 h-3 text-amber-400" />}
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSuggestClick}
                title="Configure Generator Settings"
                className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                {!isPro && <Lock className="w-3 h-3 text-amber-400" />}
                <Shuffle className="w-3 h-3" /> Suggest Level
              </button>
            </div>
          </div>

          <div className="flex lg:hidden gap-1.5 mb-3">
            <button
              onClick={onUndoEdit}
              disabled={!canUndoEdit}
              title="Undo tile edit (Ctrl+Z)"
              className={`p-1.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                canUndoEdit
                  ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200'
                  : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedoEdit}
              disabled={!canRedoEdit}
              title="Redo tile edit (Ctrl+Y or Ctrl+Shift+Z)"
              className={`p-1.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                canRedoEdit
                  ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200'
                  : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRandomClick}
              className="flex-1 flex items-center justify-center gap-1 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
            >
              {!isPro && <Lock className="w-3.5 h-3.5 text-amber-400" />}
              <RefreshCw className="w-3.5 h-3.5" /> Random
            </button>
            <button
              onClick={handleSuggestClick}
              className="flex-1 flex items-center justify-center gap-1 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
            >
              {!isPro && <Lock className="w-3.5 h-3.5 text-amber-400" />}
              <Shuffle className="w-3.5 h-3.5" /> Generator
            </button>
          </div>

          <div className="flex bg-slate-900/80 rounded-lg p-1 mb-3 border border-slate-700/50 gap-1">
            <button
              onClick={() => setSelectedTool('place')}
              title="Place Tile Tool (P)"
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                selectedTool === 'place'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Square className="w-3.5 h-3.5 shrink-0" /> Place
            </button>
            <button
              onClick={() => setSelectedTool('erase')}
              title="Erase Tile Tool (E)"
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                selectedTool === 'erase'
                  ? 'bg-red-500 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" /> Erase
            </button>
            <button
              onClick={() => setSelectedTool('select')}
              title="Marquee Selection Tool: Drag to select tiles on active layer (S/V)"
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                selectedTool === 'select'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5 shrink-0" /> Select
            </button>
          </div>
        </div>

        <div className="space-y-3.5 pr-0.5 pb-6">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">Level Target</label>
              <input
                type="number"
                min="1"
                max="9999"
                value={levelNum}
                onChange={e => setLevelNum(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-500 outline-none text-xs"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">
                {giftPlacementMode ? '🎁 Gift Layer' : 'Z-Layer'}
              </label>

              {giftPlacementMode ? (
                <div className="flex gap-0.5 bg-slate-900 p-1 rounded border border-amber-600/50 mb-1.5">
                  {GIFT_LAYERS.map(z => (
                    <button
                      key={z}
                      onClick={() => setActiveGiftLayer(z)}
                      className={`flex-1 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        activeGiftLayer === z
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-amber-300/60 hover:bg-slate-800'
                      }`}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-0.5 bg-slate-900 p-1 rounded border border-slate-700 mb-1.5">
                  {[0, 1, 2, 3, 4, 5].map(z => (
                    <button
                      key={z}
                      onClick={() => setActiveLayer(z)}
                      className={`flex-1 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        activeLayer === z ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex bg-slate-900/80 rounded-md p-0.5 border border-slate-700/50">
                <button
                  onClick={() => setLayerViewMode('all')}
                  title="Show all layers with active layer highlighted"
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    layerViewMode === 'all' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setLayerViewMode('cumulative')}
                  title="Show layers up to active (view build-up)"
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    layerViewMode === 'cumulative' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Stack
                </button>
                <button
                  onClick={() => setLayerViewMode('isolated')}
                  title="Show ONLY the active layer (clean check)"
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    layerViewMode === 'isolated' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Solo
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">Difficulty Mod Band</label>
              <button
                onClick={handleTuneBandsClick}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                {!isPro && <Lock className="w-3 h-3 text-amber-400" />}
                <Edit3 className="w-3 h-3" /> {isModEditorOpen ? 'Close Editor' : 'Tune Bands'}
              </button>
            </div>
            <select
              value={difficultyMod}
              onChange={(e) => setDifficultyMod(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-amber-500 text-xs font-medium cursor-pointer"
            >
              {Object.entries(difficultyMods).map(([k, v]) => (
                <option key={k} value={k}>{v.label} (Var: {v.variants})</option>
              ))}
            </select>

            {isModEditorOpen && (
              <div className="space-y-2 pt-2 border-t border-slate-800 mt-2">
                <p className="text-[10px] text-slate-400 font-medium">Customize starting match quota &amp; variants pool per tier:</p>
                {Object.entries(difficultyMods).map(([key, mod]) => (
                  <div key={key} className="bg-slate-800/80 p-2 rounded border border-slate-700 flex items-center justify-between gap-2">
                    <div className="flex-1 truncate">
                      <p className="text-xs font-bold text-slate-200 truncate">{mod.label.split('(')[0]}</p>
                      <span className="text-[10px] text-slate-400">Mult: {mod.multiplier}x | Target MAI: {mod.targetMAI}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-slate-400">Var</span>
                        <input
                          type="number"
                          min="2"
                          max="35"
                          value={mod.variants}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseInt(e.target.value);
                            setDifficultyMods(prev => ({ ...prev, [key]: { ...prev[key], variants: val === '' ? 4 : val } }));
                          }}
                          className="w-10 bg-slate-900 border border-slate-700 rounded py-0.5 px-1 text-cyan-400 font-bold text-center text-xs outline-none"
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-slate-400">Starts</span>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={mod.startingMatches}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseInt(e.target.value);
                            setDifficultyMods(prev => ({ ...prev, [key]: { ...prev[key], startingMatches: val === '' ? 0 : val } }));
                          }}
                          className="w-10 bg-slate-900 border border-slate-700 rounded py-0.5 px-1 text-amber-400 font-bold text-center text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">Distribution Pattern</label>
            <select
              value={distributionPattern}
              onChange={(e) => setDistributionPattern(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-amber-500 text-xs mb-2 cursor-pointer"
            >
              {Object.entries(DISTRIBUTION_PATTERNS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            {distributionPattern === 'hybrid' && (
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-700 space-y-2 mb-2">
                <p className="text-[10px] uppercase font-bold text-amber-400">Hybrid Blend Sub-Patterns</p>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={hybridSub1}
                    onChange={(e) => setHybridSub1(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-white cursor-pointer"
                  >
                    {Object.entries(DISTRIBUTION_PATTERNS).filter(([k]) => k !== 'hybrid' && k !== 'random').map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <select
                    value={hybridSub2}
                    onChange={(e) => setHybridSub2(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-white cursor-pointer"
                  >
                    {Object.entries(DISTRIBUTION_PATTERNS).filter(([k]) => k !== 'hybrid' && k !== 'random').map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300 flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-cyan-400" /> Icon Ratios
                </span>
                <span className="text-cyan-400 font-mono">T: {iconColorRatio.themeIconRatio}% | C: {iconColorRatio.colorIconRatio}%</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Theme Icons Ratio</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={iconColorRatio.themeIconRatio}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                      setIconColorRatio({ themeIconRatio: val, colorIconRatio: 100 - val });
                    }}
                    className="w-12 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-white font-mono text-center"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Color Theme Icons Ratio</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={iconColorRatio.colorIconRatio}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                      setIconColorRatio({ themeIconRatio: 100 - val, colorIconRatio: val });
                    }}
                    className="w-12 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-white font-mono text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1">
                <Layers className="w-3 h-3" /> Theme Weights
              </label>
              <div className="flex items-center gap-2">
                {themeIconRegistry ? (
                  <>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      ✓ Registry ({Object.keys(themeIconRegistry).length})
                    </span>
                    <button
                      onClick={handleClearThemeRegistry}
                      className="text-[10px] text-red-400 hover:text-red-300 font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleImportThemeClick}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30 text-purple-300 cursor-pointer"
                  >
                    {!isPro && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                    <Upload className="w-3 h-3" /> Import Theme
                  </button>
                )}
                <button
                  onClick={redistributeThemes}
                  disabled={tiles.filter(t => !t.isGift).length === 0}
                  title="Re-roll theme distribution on existing tiles (layout preserved)"
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                    tiles.filter(t => !t.isGift).length === 0
                      ? 'bg-slate-900 border-slate-700 text-slate-600 cursor-not-allowed'
                      : 'bg-cyan-500/20 border-cyan-500/40 hover:bg-cyan-500/30 text-cyan-300 cursor-pointer'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" /> Redistribute
                </button>
              </div>
            </div>

            {themeIconRegistry && (
              <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-700/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Distribution Mode
                  </span>
                  <span className="text-[9px] text-slate-500 italic">
                    {distributionMode === 'icon' ? 'Chọn cặp (theme, icon)' : 'Chọn theme'}
                  </span>
                </div>
                <div className="flex bg-slate-900 rounded p-0.5 border border-slate-700">
                  <button
                    onClick={() => setDistributionMode('theme')}
                    className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      distributionMode === 'theme'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Theme
                  </button>
                  <button
                    onClick={() => setDistributionMode('icon')}
                    className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      distributionMode === 'icon'
                        ? 'bg-purple-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Icon Pool
                  </button>
                </div>
              </div>
            )}

            {themeIconRegistry && (
              <p className="text-[10px] text-slate-400">
                {distributionMode === 'icon'
                  ? '🟣 Redistribute dùng Icon Pool (weight-based), bỏ qua Icon Budget.'
                  : '🟡 Redistribute dùng theme pool từ registry (Icon Budget áp dụng).'}
              </p>
            )}

            {themeIconRegistry && distributionMode === 'icon' && (
              <IconPoolEditor
                registry={themeIconRegistry}
                pool={iconPool}
                setPool={setIconPool}
                totalTriplets={Math.floor(tiles.filter(t => !t.isGift).length / 3)}
              />
            )}

            {distributionMode === 'theme' && ALL_THEMES.map(theme => {
              const weight = themeWeights[theme];
              const isActive = weight > 0;
              const totalWeight = Object.values(themeWeights).reduce((a, b) => a + b, 0);
              const pct = totalWeight > 0 ? Math.round((weight / totalWeight) * 100) : 0;

              return (
                <div key={theme} className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setThemeWeights(prev => {
                        const next = { ...prev, [theme]: prev[theme] > 0 ? 0 : 100 };
                        const anyActive = Object.values(next).some(v => v > 0);
                        return anyActive ? next : prev;
                      });
                    }}
                    className={`w-12 text-left text-[11px] font-bold transition-colors cursor-pointer ${
                      isActive ? 'text-amber-300' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {theme}
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="10"
                    value={weight}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setThemeWeights(prev => {
                        const next = { ...prev, [theme]: val };
                        const anyActive = Object.values(next).some(v => v > 0);
                        return anyActive ? next : { ...prev, [theme]: 1 };
                      });
                    }}
                    className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white font-mono text-center text-[11px] outline-none focus:border-amber-500"
                  />
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono w-8 text-right">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}

            {distributionMode === 'theme' && activeThemes.length === 1 && (
              <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                Single theme — all tiles will be <span className="text-amber-300">{activeThemes[0]}</span>
              </p>
            )}
          </div>

          {themeIconRegistry && (
            <div className="bg-slate-800/60 border border-purple-500/30 rounded-xl p-3 mb-3 shadow-lg">
              <h3 className="text-xs font-bold text-purple-300 uppercase border-b border-slate-700 pb-1 mb-2 flex items-center gap-1">
                <Boxes className="w-3 h-3" /> Combo Inventory
                <span className="ml-auto text-[9px] text-slate-500 font-mono normal-case">
                  {Object.keys(difficultyStats.comboTriplets ?? {}).length} combos
                </span>
                <button
                  onClick={() => setShowOnlyUnbalanced(!showOnlyUnbalanced)}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                    showOnlyUnbalanced
                      ? 'bg-red-500/20 border-red-500/50 text-red-300'
                      : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {showOnlyUnbalanced ? 'All' : 'Lệch'}
                </button>
              </h3>

              {Object.keys(difficultyStats.comboTriplets ?? {}).length === 0 ? (
                <p className="text-[10px] text-slate-500 italic text-center py-2">
                  Chưa có combo nào. Nhấn Redistribute để gán icon.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-1 text-[9px] text-slate-500 font-bold uppercase mb-1 px-1">
                    <div>Combo</div>
                    <div className="text-center w-10">Tiles</div>
                    <div className="text-center w-10">Bộ</div>
                    <div className="text-center w-10">Dư</div>
                  </div>

                  <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
                    {Object.values(difficultyStats.comboTriplets ?? {})
                      .filter(c => !showOnlyUnbalanced || c.remainder > 0)
                      .sort((a, b) => {
                        if ((a.remainder > 0) !== (b.remainder > 0)) {
                          return a.remainder > 0 ? -1 : 1;
                        }
                        if (a.themeId !== b.themeId) return a.themeId.localeCompare(b.themeId);
                        return a.iconId - b.iconId;
                      })
                      .map(c => {
                        const isUnbalanced = c.remainder !== 0;
                        const themeColor = THEME_DOT_COLORS[c.themeId] || 'bg-slate-500';

                        return (
                          <div
                            key={`${c.themeId}_${c.iconId}`}
                            className={`grid grid-cols-[1fr_auto_auto_auto] gap-1 items-center px-1 py-0.5 rounded text-[10px] font-mono ${
                              isUnbalanced ? 'bg-red-950/40 border border-red-800/50' : 'hover:bg-slate-900/50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <div className={`w-2 h-2 rounded-full ${themeColor} shrink-0`} />
                              <span className="text-slate-300 truncate">
                                {c.themeId}
                              </span>
                              <span className="text-cyan-400">#{c.iconId}</span>
                            </div>
                            <div className="text-center w-10 text-slate-400">{c.tiles}</div>
                            <div className={`text-center w-10 font-bold ${isUnbalanced ? 'text-red-400' : 'text-green-400'}`}>
                              {c.triplets}
                            </div>
                            <div className={`text-center w-10 ${isUnbalanced ? 'text-red-400 font-bold' : 'text-slate-600'}`}>
                              {c.remainder === 0 ? '—' : c.remainder}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-between text-[10px]">
                    <span className="text-slate-500">
                      Tổng: <span className="text-white font-mono font-bold">
                        {Object.values(difficultyStats.comboTriplets).reduce((s, c) => s + c.triplets, 0)}
                      </span> bộ
                    </span>
                    {Object.values(difficultyStats.comboTriplets).some(c => c.remainder > 0) ? (
                      <span className="text-red-400 font-bold">
                        ⚠ {Object.values(difficultyStats.comboTriplets).filter(c => c.remainder > 0).length} lệch
                      </span>
                    ) : (
                      <span className="text-green-400 font-bold">✓ Balanced</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <ClusterManager
            tiles={tiles}
            setTiles={setTiles}
            clusters={clusters}
            setClusters={setClusters}
            isPro={isPro}
            onRequirePro={onRequirePro}
            clusterSelectionMode={clusterSelectionMode}
            setClusterSelectionMode={setClusterSelectionMode}
            clusterPlacementMode={clusterPlacementMode}
            setClusterPlacementMode={setClusterPlacementMode}
            highlightedClusterId={highlightedClusterId}
            setHighlightedClusterId={setHighlightedClusterId}
          />

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">Special Mechanic</label>
            <div className="grid grid-cols-2 gap-1.5">
              {MECHANICS.map(mech => {
                const isNormal = mech.id === 'normal';
                const isSelected = selectedMechanic === mech.id;
                return (
                  <button
                    key={mech.id}
                    onClick={() => {
                      if (!isNormal && !isPro) {
                        onRequirePro(
                          `${mech.label} Mechanic`,
                          'Special tile mechanics (chains, ice, combined tiles, gifts, event items) are restricted to Premium members. Normal Tiles remain free for all users.'
                        );
                        return;
                      }
                      if (mech.id === 'gift') {
                        setSelectedMechanic('gift');
                        setGiftPlacementMode(giftPlacementMode && giftPlacementMode in GIFT_SIZES ? giftPlacementMode : 'gift2x2');
                      } else {
                        setSelectedMechanic(mech.id);
                        setGiftPlacementMode(null);
                      }
                    }}
                    className={`px-2 py-1.5 rounded text-xs font-bold border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <mech.icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{mech.label}</span>
                    </div>
                    {!isNormal && !isPro && (
                      <Lock className="w-3 h-3 text-amber-400 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedMechanic === 'gift' && (
              <div className="mt-2 bg-amber-950/80 border border-amber-500/60 p-2.5 rounded-lg text-[10px] space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-amber-300 font-bold border-b border-amber-700/60 pb-1">
                  <span className="flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 text-amber-400" />
                    Gift Box Size Selector
                  </span>
                  <span className="bg-amber-900 border border-amber-400 text-amber-200 px-1.5 py-0.5 rounded font-black text-[9px]">
                    Layer {activeGiftLayer}
                  </span>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-amber-400 uppercase mb-1 block">
                    Select Gift Box Dimensions:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'gift2x2', label: '2 × 2', desc: '4 Grid Cells' },
                      { id: 'gift2x3', label: '2 × 3', desc: '6 Grid Cells' },
                      { id: 'gift3x3', label: '3 × 3', desc: '9 Grid Cells' },
                      { id: 'gift4x4', label: '4 × 4', desc: '16 Grid Cells' },
                    ].map(gSize => {
                      const isSelected = giftPlacementMode === gSize.id;
                      return (
                        <button
                          key={gSize.id}
                          onClick={() => {
                            setGiftPlacementMode(gSize.id);
                            setSelectedMechanic('gift');
                          }}
                          className={`p-2 rounded-md border flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-black border-amber-300 ring-2 ring-amber-400 shadow-md scale-102'
                              : 'bg-amber-950/40 hover:bg-amber-900/60 border-amber-700/60 text-amber-200 font-bold'
                          }`}
                        >
                          <span className="text-xs">{gSize.label}</span>
                          <span className={`text-[9px] font-mono ${isSelected ? 'text-slate-900 font-bold' : 'text-amber-400/80'}`}>
                            {gSize.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-amber-950/90 p-2 rounded border border-amber-600/50 text-[10px] text-amber-200 font-medium leading-tight flex items-center gap-1.5">
                  <span className="text-yellow-300 font-bold shrink-0">👉 Click Grid:</span>
                  <span>Click anywhere on grid canvas to place this {GIFT_SIZES[giftPlacementMode || 'gift2x2']?.name || 'Gift'}.</span>
                </div>
              </div>
            )}

            {selectedMechanic === 'chained' && (
              <div className="mt-2 bg-slate-900 border border-cyan-500/50 p-2.5 rounded-lg text-[10px] space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-cyan-300 font-bold border-b border-slate-700 pb-1">
                  <span className="flex items-center gap-1">
                    <Link className="w-3.5 h-3.5 text-cyan-400" /> Chain Restraint Level
                  </span>
                  <span className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono font-bold text-[9px]">
                    Lv{chainLevel}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2].map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setChainLevel(lvl)}
                      className={`flex-1 py-1.5 rounded border text-xs font-bold transition-all cursor-pointer ${
                        chainLevel === lvl
                          ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black shadow'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      Level {lvl}
                    </button>
                  ))}
                </div>
                <p className="text-slate-400 text-[9px]">
                  {chainLevel === 1 ? '🔗 Chain Lv1: Restrained. Requires 1 adjacent match to break.' : '🔗 Chain Lv2: Heavily Restrained. Requires 2 adjacent matches to break.'}
                </p>
              </div>
            )}

            {selectedMechanic === 'ice' && (
              <div className="mt-2 bg-slate-900 border border-cyan-500/50 p-2.5 rounded-lg text-[10px] space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-cyan-300 font-bold border-b border-slate-700 pb-1">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" /> Ice Matches Required
                  </span>
                  <span className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono font-bold text-[9px]">
                    {iceMatchReq}❄
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[2, 3, 4].map(req => (
                    <button
                      key={req}
                      onClick={() => setIceMatchReq(req)}
                      className={`flex-1 py-1 rounded border text-xs font-bold transition-all cursor-pointer ${
                        iceMatchReq === req
                          ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black shadow'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {req} Matches
                    </button>
                  ))}
                  <div className="flex items-center gap-1 bg-slate-800 px-1.5 py-1 rounded border border-slate-700 shrink-0">
                    <span className="text-[9px] text-slate-400 font-bold">Custom:</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={iceMatchReq}
                      onChange={(e) => setIceMatchReq(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-10 bg-slate-950 text-cyan-300 font-bold text-center rounded border border-slate-700 text-xs py-0.5 outline-none"
                    />
                  </div>
                </div>
                <p className="text-slate-400 text-[9px]">
                  🧊 Ice Tile: Requires {iceMatchReq} matches involving this tile to thaw completely.
                </p>
              </div>
            )}

            {selectedMechanic === 'combined' && (
              <div className="mt-2 bg-emerald-950/80 border border-emerald-500/60 p-2.5 rounded-lg text-[10px] space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-emerald-300 font-bold border-b border-emerald-700/60 pb-1">
                  <span className="flex items-center gap-1">
                    <Boxes className="w-3.5 h-3.5 text-emerald-400" />
                    Combined Cluster Selector
                  </span>
                  <span className="bg-emerald-900 border border-emerald-400 text-emerald-200 px-1.5 py-0.5 rounded font-black text-[9px]">
                    Green C
                  </span>
                </div>

                {/* Option to choose number of tiles per combined cluster */}
                <div>
                  <label className="text-[9px] font-bold text-emerald-400 uppercase mb-1 block">
                    1. Choose Tile Count per Cluster:
                  </label>
                  <div className="flex bg-emerald-950 p-0.5 rounded border border-emerald-800 gap-0.5">
                    {(['all', 2, 3, 4] as const).map(option => (
                      <button
                        key={option}
                        onClick={() => {
                          setCombineTileCountFilter(option);
                          // Auto select first shape matching filter if current doesn't match
                          const matchingShapes = COMBINE_SHAPES.filter(s => option === 'all' || s.size === option);
                          if (matchingShapes.length > 0 && !matchingShapes.some(s => s.id === selectedCombineShapeId)) {
                            setSelectedCombineShapeId(matchingShapes[0].id);
                          }
                        }}
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          combineTileCountFilter === option
                            ? 'bg-emerald-500 text-slate-950 shadow font-black'
                            : 'text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-900/50'
                        }`}
                      >
                        {option === 'all' ? 'All' : `${option} Tiles`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Predetermined list of available types of Combined shapes */}
                <div>
                  <label className="text-[9px] font-bold text-emerald-400 uppercase mb-1 block">
                    2. Select Combine Cluster Type:
                  </label>
                  <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                    {COMBINE_SHAPES
                      .filter(s => combineTileCountFilter === 'all' || s.size === combineTileCountFilter)
                      .map(shape => {
                        const isSelected = selectedCombineShapeId === shape.id;
                        return (
                          <button
                            key={shape.id}
                            onClick={() => setSelectedCombineShapeId(shape.id)}
                            className={`p-1.5 rounded-md border flex items-center justify-between text-[10px] font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-800/90 border-emerald-300 text-white ring-2 ring-emerald-400 shadow-md'
                                : 'bg-emerald-900/40 hover:bg-emerald-900/80 border-emerald-700/60 text-emerald-200'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-emerald-300 animate-pulse' : 'bg-emerald-600'}`} />
                              <span className="truncate">{shape.name}</span>
                            </div>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 shrink-0">
                              {shape.size} tiles
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div className="bg-emerald-950/90 p-2 rounded border border-emerald-600/50 text-[10px] text-emerald-200 font-medium leading-tight flex items-center gap-1.5">
                  <span className="text-amber-300 font-bold shrink-0">👉 Click Grid:</span>
                  <span>Click anywhere on grid canvas to place this Combine cluster shape.</span>
                </div>
              </div>
            )}
          </div>

          {/* Board Mechanisms Section */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-purple-500/40 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
              <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Board Mechanisms</span>
              </div>
              <span className="text-[9px] text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800 font-bold">
                Level Gimmick
              </span>
            </div>

            {/* 1. Board-morphism */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={boardMorphism.enabled}
                    onChange={(e) => setBoardMorphism(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-slate-700 text-purple-500 focus:ring-purple-400 cursor-pointer"
                  />
                  <span>Board-morphism</span>
                </label>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${boardMorphism.enabled ? 'bg-purple-900 text-purple-200 border border-purple-600' : 'bg-slate-800 text-slate-500'}`}>
                  {boardMorphism.enabled ? 'Active' : 'Off'}
                </span>
              </div>

              {boardMorphism.enabled && (
                <div className="space-y-2 pt-1 border-t border-slate-800/80 text-[10px] animate-in fade-in duration-150">
                  {/* Spin the board */}
                  <div>
                    <div className="flex justify-between text-slate-300 font-bold mb-1">
                      <span>Spin the Board Angle:</span>
                      <span className="text-purple-300 font-mono">{boardMorphism.spinAngle}°</span>
                    </div>
                    <div className="flex gap-1 mb-1.5">
                      {[0, 90, 180, 270].map(angle => (
                        <button
                          key={angle}
                          onClick={() => setBoardMorphism(prev => ({ ...prev, spinAngle: angle }))}
                          className={`flex-1 py-1 rounded font-bold border transition-colors cursor-pointer ${
                            boardMorphism.spinAngle === angle
                              ? 'bg-purple-600 text-white border-purple-300 font-black'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {angle}°
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="15"
                      value={boardMorphism.spinAngle}
                      onChange={(e) => setBoardMorphism(prev => ({ ...prev, spinAngle: parseInt(e.target.value) || 0 }))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  {/* Mirrored The Horizons */}
                  <label className="flex items-center gap-2 p-1.5 rounded bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-800/60">
                    <input
                      type="checkbox"
                      checked={boardMorphism.mirroredHorizons}
                      onChange={(e) => setBoardMorphism(prev => ({ ...prev, mirroredHorizons: e.target.checked }))}
                      className="rounded border-slate-700 text-purple-500 focus:ring-purple-400 cursor-pointer"
                    />
                    <span className="font-bold text-purple-200">Mirrored The Horizons (Horizontal Flip)</span>
                  </label>
                </div>
              )}
            </div>

            {/* 2. Tiles-spectrum */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Tiles-spectrum
                </span>
                <span className="text-[9px] font-mono text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800">
                  {tileSpectrums.length} / 3 Max
                </span>
              </div>

              {/* Existing Entries */}
              <div className="space-y-1.5">
                {tileSpectrums.map((entry, idx) => (
                  <div key={entry.id} className="bg-slate-900 p-2 rounded border border-purple-500/40 text-[10px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300 truncate">
                        #{idx + 1} {entry.targetType.toUpperCase()}: <span className="text-white">{entry.targetValue}</span>
                      </span>
                      <button
                        onClick={() => setTileSpectrums(prev => prev.filter(s => s.id !== entry.id))}
                        className="text-red-400 hover:text-red-300 p-0.5 rounded cursor-pointer"
                        title="Remove Tiles-spectrum"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-[9px] text-slate-400 flex flex-wrap gap-1">
                      <span className="bg-purple-950 text-purple-300 px-1 rounded border border-purple-800 font-bold">
                        {entry.benefit.replace('_', ' ')}
                      </span>
                      <span className="bg-slate-800 text-slate-300 px-1 rounded border border-slate-700">
                        {entry.duration.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Form */}
              {tileSpectrums.length < 3 ? (
                <SpectrumAddForm
                  activeThemes={activeThemes}
                  onAdd={(newEntry) => setTileSpectrums(prev => [...prev, newEntry])}
                />
              ) : (
                <p className="text-[9px] text-amber-400 italic text-center">
                  Maximum 3 Tiles-spectrum applied per level reached.
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
            <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1">
              <Zap className="w-3 h-3" /> Booster Preset
            </label>

            <select
              value={boosterPreset}
              onChange={(e) => setBoosterPreset(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-amber-500 text-xs font-medium cursor-pointer"
            >
              {Object.entries(BOOSTER_PRESETS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>

            {boosterPreset === 'custom' && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 mt-2">
                {Object.entries(BOOSTER_TYPES).map(([key, config]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-[9px] text-slate-400 mb-0.5">{config.label}</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={boosterCustom[key as keyof BoosterAvailability]}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setBoosterCustom(prev => ({ ...prev, [key]: val }));
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-amber-400 font-bold text-center text-xs outline-none"
                    />
                  </div>
                ))}
              </div>
            )}

            {boosterPreset !== 'custom' && baseAvailability && (
              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                <div>Undo: <strong className="text-white font-mono">{baseAvailability.undo}</strong></div>
                <div>Magnet: <strong className="text-white font-mono">{baseAvailability.magnet}</strong></div>
                <div>Swap: <strong className="text-white font-mono">{baseAvailability.swap}</strong></div>
                <div>Slot: <strong className="text-white font-mono">{baseAvailability.slotExpand}</strong></div>
              </div>
            )}
          </div>

          <button
            onClick={() => setTiles([])}
            className="w-full mt-1 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded border border-red-900/50 transition-colors font-medium cursor-pointer"
          >
            Clear Board
          </button>

          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
            Changing theme weights? Click <span className="text-cyan-300 font-bold">Redistribute</span> to apply without regenerating the layout.
          </p>

          {!isPlayable && (
            <div className="text-[11px] text-red-400 font-bold bg-red-950/30 p-2 rounded border border-red-900/50">
              Matchable tiles ({matchableCount}) must be a multiple of 3 to test.
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

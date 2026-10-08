import React, { useState, useMemo } from 'react';
import {
  Pickaxe, RefreshCw, Shuffle, Square, Trash2, Edit3, Sliders, Layers,
  Upload, Zap, Boxes, X, Lock, RotateCcw, RotateCw, Gift, Link, Sparkles, MousePointer,
  Gem, Award, Package, Heart, Check, ChevronDown, ChevronUp, Eye, Leaf, Box, Plus, Info
} from 'lucide-react';
import {
  Tile, DifficultyMod, ThemeWeights, IconPoolEntry, ThemeIconRegistry,
  BoosterAvailability, DifficultyStats, TileCluster,
  BoardMorphismConfig, TileSpectrumEntry, TileSpectrumBenefit, TileSpectrumDuration,
  EditorTool, BoardTimerConfig, BoardRandomConfig, BossBattleConfig, SweetDeliveryConfig
} from '../types/game';
import {
  ALL_THEMES, THEME_DOT_COLORS, MECHANICS, GIFT_LAYERS, GIFT_SIZES, GIFT_THEMES, DEFAULT_GIFT_THEME,
  DISTRIBUTION_PATTERNS, BOOSTER_PRESETS, BOOSTER_TYPES, COMBINE_SHAPES, ICONS, COLORS,
  CONVERTIBLE_MECHANICS, applyMechanicToTile
} from '../constants/gameConfig';
import { isGiftBlocked, calculateHiddenSafety, calculateAndApplyHiddenSafety } from '../utils/gameHelpers';
import { IconPoolEditor } from './IconPoolEditor';
import { ClusterManager } from './ClusterManager';
import { LicenseData } from '../utils/licenseService';
import {
  MorphismScope, MorphismTransformType, MorphismSymmetryType,
  transformTileList, generateSymmetricTiles, bakeMorphismToTiles
} from '../utils/morphismHelpers';

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
  activeGiftType?: string;
  setActiveGiftType?: (type: string) => void;
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
  hiddenPlacementState?: 'safe' | 'unsafe';
  setHiddenPlacementState?: (state: 'safe' | 'unsafe') => void;
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
  boardTimer: BoardTimerConfig;
  setBoardTimer: React.Dispatch<React.SetStateAction<BoardTimerConfig>>;
  boardRandom: BoardRandomConfig;
  setBoardRandom: React.Dispatch<React.SetStateAction<BoardRandomConfig>>;
  bossBattle: BossBattleConfig;
  setBossBattle: React.Dispatch<React.SetStateAction<BossBattleConfig>>;
  sweetDelivery: SweetDeliveryConfig;
  setSweetDelivery: React.Dispatch<React.SetStateAction<SweetDeliveryConfig>>;
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
  // Selection state
  selectedTileIds?: Set<string>;
  setSelectedTileIds?: React.Dispatch<React.SetStateAction<Set<string>>>;
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

// --- COMPONENT: SELECT & SPECIAL MECHANIC TRANSFORMER (EXCEPT FOR GIFT) ---
const SelectMechanicTransformer: React.FC<{
  tiles: Tile[];
  setTiles: React.Dispatch<React.SetStateAction<Tile[]>>;
  selectedTileIds: Set<string>;
  setSelectedTileIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  activeLayer: number;
  onRequirePro: (name: string, desc: string) => void;
  isPro: boolean;
}> = ({
  tiles,
  setTiles,
  selectedTileIds,
  setSelectedTileIds,
  activeLayer,
  onRequirePro,
  isPro,
}) => {
  const [sourceMechFilter, setSourceMechFilter] = useState<string>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const selectedTiles = useMemo(() => {
    return tiles.filter(t => selectedTileIds.has(t.id));
  }, [tiles, selectedTileIds]);

  const nonGiftSelected = useMemo(() => {
    return selectedTiles.filter(t => !t.isGift);
  }, [selectedTiles]);

  const giftSelectedCount = selectedTiles.length - nonGiftSelected.length;

  const mechanicsCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    nonGiftSelected.forEach(t => {
      const m = t.mechanic || 'normal';
      counts[m] = (counts[m] || 0) + 1;
    });
    return counts;
  }, [nonGiftSelected]);

  const uniqueMechanics = useMemo(() => Object.keys(mechanicsCounts), [mechanicsCounts]);

  const flashFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleConvert = (targetMechId: string, filter: string = 'all') => {
    if (nonGiftSelected.length === 0) return;
    let converted = 0;
    setTiles(prev =>
      prev.map(t => {
        if (t.isGift) return t; // strictly exclude gifts
        if (!selectedTileIds.has(t.id)) return t;
        const cur = t.mechanic || 'normal';
        if (filter !== 'all' && cur !== filter) return t;
        converted++;
        return applyMechanicToTile(t, targetMechId);
      })
    );
    const targetOpt = CONVERTIBLE_MECHANICS.find(m => m.id === targetMechId);
    flashFeedback(`✓ Changed ${converted} selected tile${converted > 1 ? 's' : ''} to ${targetOpt?.shortLabel || targetMechId}`);
  };

  const handleConvertAllInLevel = (sourceMech: string, targetMechId: string) => {
    let count = 0;
    setTiles(prev =>
      prev.map(t => {
        if (t.isGift) return t;
        const cur = t.mechanic || 'normal';
        if (cur !== sourceMech) return t;
        count++;
        return applyMechanicToTile(t, targetMechId);
      })
    );
    const targetOpt = CONVERTIBLE_MECHANICS.find(m => m.id === targetMechId);
    flashFeedback(`✓ Converted all ${count} '${sourceMech}' tiles in level to ${targetOpt?.shortLabel || targetMechId}`);
  };

  const handleSelectAllOnLayer = () => {
    const layerTiles = tiles.filter(t => t.z === activeLayer && !t.isGift);
    setSelectedTileIds(new Set(layerTiles.map(t => t.id)));
    flashFeedback(`Selected ${layerTiles.length} tiles on Layer ${activeLayer}`);
  };

  return (
    <div className="bg-slate-900/90 border border-cyan-500/50 rounded-xl p-3 space-y-3 shadow-xl animate-in fade-in duration-150">
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
        <div className="flex items-center gap-1.5">
          <MousePointer className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-black text-cyan-300 uppercase tracking-wide">
            Select &amp; Change Mechanic
          </span>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black border ${
          selectedTileIds.size > 0
            ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
            : 'bg-slate-800 text-slate-500 border-slate-700'
        }`}>
          {selectedTileIds.size} Selected
        </span>
      </div>

      {feedbackMsg && (
        <div className="p-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-[10px] font-bold text-center animate-in fade-in">
          {feedbackMsg}
        </div>
      )}

      {selectedTileIds.size === 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Drag marquee on canvas or shift-click tiles to select. You can change <strong>one or a set of same special mechanic tiles</strong> into another mechanic.
          </p>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={handleSelectAllOnLayer}
              className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-[10px] font-bold transition-colors cursor-pointer"
            >
              Select All on Layer {activeLayer}
            </button>
            <button
              onClick={() => setSelectedTileIds(new Set(tiles.filter(t => !t.isGift).map(t => t.id)))}
              className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] font-bold transition-colors cursor-pointer"
            >
              Select All Level Tiles
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {giftSelectedCount > 0 && (
            <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-600/50 text-purple-200 text-[9px] flex items-center justify-between">
              <span>🎁 {giftSelectedCount} Gift Box{giftSelectedCount > 1 ? 'es' : ''} in selection</span>
              <span className="text-[8px] bg-purple-900 px-1 rounded font-bold">Gifts Excluded</span>
            </div>
          )}

          {nonGiftSelected.length === 0 ? (
            <div className="p-2 text-center text-[10px] text-slate-400 italic">
              Only Gift boxes selected. Gifts are excluded from mechanic swapping (manage gifts in the Gift Editor).
            </div>
          ) : (
            <>
              {/* Mechanic in Selection */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span>1. Source Mechanic in Selection:</span>
                  <span className="text-cyan-400 font-mono text-[9px]">
                    {uniqueMechanics.length === 1 ? 'Uniform Set' : `${uniqueMechanics.length} Mixed`}
                  </span>
                </div>

                {uniqueMechanics.length === 1 ? (
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-300">
                      All <strong className="text-white">{nonGiftSelected.length}</strong> selected tiles are:
                    </span>
                    <span className="text-[10px] font-black text-cyan-300 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700">
                      {CONVERTIBLE_MECHANICS.find(m => m.id === uniqueMechanics[0])?.label || uniqueMechanics[0]}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setSourceMechFilter('all')}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                        sourceMechFilter === 'all'
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      All Selected ({nonGiftSelected.length})
                    </button>
                    {uniqueMechanics.map(mKey => {
                      const count = mechanicsCounts[mKey];
                      const mOpt = CONVERTIBLE_MECHANICS.find(m => m.id === mKey);
                      return (
                        <button
                          key={mKey}
                          onClick={() => setSourceMechFilter(mKey)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                            sourceMechFilter === mKey
                              ? 'bg-cyan-500 text-slate-950 font-black'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {mOpt?.shortLabel || mKey} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Target Mechanic Picker (strictly excluding Gift) */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span>2. Change Into Mechanic:</span>
                  <span className="text-[8px] text-amber-400 font-bold uppercase">(Except Gift)</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {CONVERTIBLE_MECHANICS.map(mech => (
                    <button
                      key={mech.id}
                      onClick={() => handleConvert(mech.id, uniqueMechanics.length === 1 ? 'all' : sourceMechFilter)}
                      className={`p-1.5 rounded-lg border flex items-center gap-1.5 text-left transition-all cursor-pointer active:scale-95 ${mech.colorClass}`}
                    >
                      <mech.icon className="w-3.5 h-3.5 shrink-0" />
                      <div className="truncate min-w-0">
                        <p className="font-bold text-[10px] truncate leading-tight">{mech.shortLabel}</p>
                        <p className="text-[8px] opacity-70 truncate leading-none">{mech.description.split(',')[0]}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Level-wide replacement action */}
              {((uniqueMechanics.length === 1) || (sourceMechFilter !== 'all')) && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[9px] text-slate-400">Level-wide:</span>
                  <button
                    onClick={() => {
                      const src = uniqueMechanics.length === 1 ? uniqueMechanics[0] : sourceMechFilter;
                      const countInLevel = tiles.filter(t => !t.isGift && (t.mechanic || 'normal') === src).length;
                      const target = prompt(
                        `Convert all ${countInLevel} '${src}' tiles in entire level into which mechanic? Choose: normal, chained1, chained2, ice2, ice3, hidden, eventItem:`,
                        'ice2'
                      );
                      if (target && CONVERTIBLE_MECHANICS.some(m => m.id === target)) {
                        handleConvertAllInLevel(src, target);
                      }
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-[9px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Convert All in Entire Level</span>
                  </button>
                </div>
              )}

              {/* If Hidden Item tiles are in selection, offer quick Safe/Unsafe calculation & state toggle */}
              {nonGiftSelected.some(t => t.mechanic === 'hidden') && (
                <div className="bg-purple-950/70 border border-purple-500/50 p-2 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-purple-200">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      <span>Hidden Item State (Selected):</span>
                    </span>
                    <button
                      onClick={() => {
                        const selHidden = nonGiftSelected.filter(t => t.mechanic === 'hidden');
                        const rep = calculateHiddenSafety(selHidden);
                        alert(`Selected Hidden Items Analysis:\n• Safe: ${rep.safeCount} (sitting layer confined)\n• Unsafe: ${rep.unsafeCount} (high randomness)`);
                      }}
                      className="text-[9px] text-purple-300 hover:text-white underline cursor-pointer"
                    >
                      Calculate Safety
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setTiles(prev => prev.map(t => {
                          if (selectedTileIds.has(t.id) && t.mechanic === 'hidden') {
                            return { ...t, hiddenState: 'safe' };
                          }
                          return t;
                        }));
                      }}
                      className="flex-1 py-1 rounded border border-cyan-500/60 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 font-bold text-[9px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      🛡️ Set Safe (Layer-confined)
                    </button>
                    <button
                      onClick={() => {
                        setTiles(prev => prev.map(t => {
                          if (selectedTileIds.has(t.id) && t.mechanic === 'hidden') {
                            return { ...t, hiddenState: 'unsafe' };
                          }
                          return t;
                        }));
                      }}
                      className="flex-1 py-1 rounded border border-amber-500/60 bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold text-[9px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      ⚠️ Set Unsafe (Random)
                    </button>
                  </div>
                </div>
              )}

              {/* Clear Selection */}
              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => setSelectedTileIds(new Set())}
                  className="text-[9px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Clear Selection (Esc)
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// --- COMPONENT: DEDICATED HIDDEN ITEM (CURTAIN) MANAGER & SAFETY CALCULATOR ---
const HiddenItemManagerPanel: React.FC<{
  tiles: Tile[];
  setTiles: React.Dispatch<React.SetStateAction<Tile[]>>;
  activeLayer: number;
  hiddenPlacementState: 'safe' | 'unsafe';
  setHiddenPlacementState: (state: 'safe' | 'unsafe') => void;
  isPro: boolean;
  onRequirePro: (name: string, desc: string) => void;
}> = ({
  tiles,
  setTiles,
  activeLayer,
  hiddenPlacementState,
  setHiddenPlacementState,
  isPro,
  onRequirePro
}) => {
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(true);
  const [lastCalculationFeedback, setLastCalculationFeedback] = useState<string | null>(null);

  // Live calculated safety report
  const safetyReport = useMemo(() => calculateHiddenSafety(tiles), [tiles]);

  const handleApplyStateAll = (targetMode: 'all-safe' | 'all-unsafe' | 'auto') => {
    const updated = calculateAndApplyHiddenSafety(tiles, targetMode);
    setTiles(updated);
    const newReport = calculateHiddenSafety(updated);
    setLastCalculationFeedback(
      targetMode === 'all-safe'
        ? `Applied Safe State to ${newReport.totalHidden} hidden tiles. (${newReport.safeCount} valid layer-confined)`
        : targetMode === 'all-unsafe'
        ? `Set all ${newReport.totalHidden} hidden tiles to Unsafe mode (higher chance of randomness).`
        : `Auto-calculated: ${newReport.safeCount} Safe, ${newReport.unsafeCount} Unsafe.`
    );
    setTimeout(() => setLastCalculationFeedback(null), 4000);
  };

  const handleToggleTileState = (tileId: string) => {
    setTiles(prev => prev.map(t => {
      if (t.id === tileId) {
        const nextState = t.hiddenState === 'unsafe' ? 'safe' : 'unsafe';
        return { ...t, hiddenState: nextState };
      }
      return t;
    }));
  };

  return (
    <div className="mt-2 bg-purple-950/80 border border-purple-500/60 p-2.5 rounded-xl text-[10px] space-y-2.5 animate-in fade-in duration-150 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between text-purple-300 font-bold border-b border-purple-800/80 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-bold text-purple-200">Hidden Item Safety</span>
        </div>
        <span className="bg-purple-900 border border-purple-500 text-purple-200 px-1.5 py-0.5 rounded font-black text-[9px]">
          {safetyReport.totalHidden} Hidden ({safetyReport.safeCount} Safe / {safetyReport.unsafeCount} Unsafe)
        </span>
      </div>

      {/* 1. Placement State Toggle */}
      <div>
        <label className="text-[9px] font-bold text-purple-300 uppercase mb-1 flex items-center justify-between">
          <span>1. New Placement Hidden State:</span>
          <span className="text-purple-400 font-mono text-[8px]">Sitting L{activeLayer}</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setHiddenPlacementState('safe')}
            className={`p-1.5 rounded-lg border flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
              hiddenPlacementState === 'safe'
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black shadow-md'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>🛡️</span>
              <span className="font-bold text-[10px]">Safe State</span>
            </div>
            <span className="text-[8px] opacity-80 leading-none">Layer Confined</span>
          </button>

          <button
            onClick={() => setHiddenPlacementState('unsafe')}
            className={`p-1.5 rounded-lg border flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
              hiddenPlacementState === 'unsafe'
                ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-md'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>⚠️</span>
              <span className="font-bold text-[10px]">Unsafe State</span>
            </div>
            <span className="text-[8px] opacity-80 leading-none">High Randomness</span>
          </button>
        </div>

        <div className="mt-1.5 p-1.5 rounded bg-purple-950/90 border border-purple-800/80 text-[9px] text-purple-200/90 leading-tight">
          {hiddenPlacementState === 'safe' ? (
            <p>
              <strong className="text-cyan-300">🛡️ Safe State:</strong> Spreads available icons strictly on its sitting layer (L{activeLayer}). Other layers cannot be accounted for in the available options for placing icons inside.
            </p>
          ) : (
            <p>
              <strong className="text-amber-300">⚠️ Unsafe State:</strong> Works as normal with higher chance of randomness drawn from across the board / other layers.
            </p>
          )}
        </div>
      </div>

      {/* 2. Calculation & Diagnostics */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-purple-300 uppercase">
            2. Safety Calculation & Diagnostics:
          </span>
          <button
            onClick={() => setIsDiagnosticOpen(prev => !prev)}
            className="text-[9px] text-purple-300 hover:text-white underline cursor-pointer"
          >
            {isDiagnosticOpen ? 'Collapse' : 'Expand Details'}
          </button>
        </div>

        {lastCalculationFeedback && (
          <div className="p-1.5 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-[9px] font-semibold animate-in fade-in">
            ✓ {lastCalculationFeedback}
          </div>
        )}

        {/* Quick Batch Actions */}
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => handleApplyStateAll('all-safe')}
            className="py-1 px-1.5 rounded bg-slate-900 hover:bg-cyan-950 border border-cyan-600/60 text-cyan-300 font-bold text-[9px] transition-colors cursor-pointer text-center"
            title="Set all hidden tiles to Safe"
          >
            🛡️ All Safe
          </button>
          <button
            onClick={() => handleApplyStateAll('all-unsafe')}
            className="py-1 px-1.5 rounded bg-slate-900 hover:bg-amber-950 border border-amber-600/60 text-amber-300 font-bold text-[9px] transition-colors cursor-pointer text-center"
            title="Set all hidden tiles to Unsafe"
          >
            ⚠️ All Unsafe
          </button>
          <button
            onClick={() => handleApplyStateAll('auto')}
            className="py-1 px-1.5 rounded bg-slate-900 hover:bg-purple-900 border border-purple-600/60 text-purple-300 font-bold text-[9px] transition-colors cursor-pointer text-center"
            title="Auto-calculate optimal safety based on layer sufficiency"
          >
            🔄 Auto Calc
          </button>
        </div>

        {/* Layer-by-layer breakdown */}
        {isDiagnosticOpen && (
          <div className="space-y-1.5 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold">
              <span>Sitting Layer Breakdown:</span>
              <span>{Object.keys(safetyReport.byLayer).length} active layers</span>
            </div>

            <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
              {Object.values(safetyReport.byLayer).filter(l => l.hiddenTiles > 0).length === 0 ? (
                <div className="text-[9px] text-slate-500 italic p-1 text-center">
                  No hidden tiles placed yet in level. Click on grid canvas to place!
                </div>
              ) : (
                Object.values(safetyReport.byLayer)
                  .filter(l => l.hiddenTiles > 0)
                  .map(layerStat => (
                    <div
                      key={layerStat.layer}
                      className="p-1.5 rounded bg-slate-900/90 border border-slate-800 text-[9px] flex items-center justify-between gap-1.5"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-purple-300">Layer {layerStat.layer}:</span>
                          <span className="text-white font-mono">{layerStat.hiddenTiles} hidden</span>
                          <span className="text-slate-400">({layerStat.totalTiles} total)</span>
                        </div>
                        <p className="text-[8px] text-slate-400">
                          {layerStat.isSelfSufficient
                            ? `✓ Self-sufficient: Available options confined exclusively to Layer ${layerStat.layer}`
                            : `⚠️ Warning: Layer has only ${layerStat.totalTiles} tiles (< 3 needed to complete match on sitting layer)`}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[8px] ${
                          layerStat.unsafeTiles === 0 && layerStat.isSelfSufficient
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                            : 'bg-amber-950 text-amber-300 border border-amber-600'
                        }`}>
                          {layerStat.unsafeTiles === 0 && layerStat.isSelfSufficient ? '🛡️ Safe' : '⚠️ Unsafe'}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Individual Tiles List with Quick Toggles */}
            {safetyReport.tileDetails.length > 0 && (
              <div className="pt-1.5 border-t border-slate-800 space-y-1">
                <span className="text-[9px] font-bold text-slate-400">Individual Tile Safety:</span>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5">
                  {safetyReport.tileDetails.map(td => (
                    <div
                      key={td.tileId}
                      className="p-1 rounded bg-slate-900 border border-slate-800/80 flex items-center justify-between text-[8px]"
                    >
                      <div className="truncate min-w-0 pr-1">
                        <span className="font-mono text-purple-300 font-bold">({td.x},{td.y},L{td.z})</span>
                        <span className="text-slate-400 ml-1 truncate">{td.reason.split(':')[0]}</span>
                      </div>

                      <button
                        onClick={() => handleToggleTileState(td.tileId)}
                        className={`px-1.5 py-0.5 rounded font-black text-[8px] transition-colors cursor-pointer shrink-0 ${
                          td.state === 'safe'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 hover:bg-cyan-900'
                            : 'bg-amber-950 text-amber-300 border border-amber-600 hover:bg-amber-900'
                        }`}
                        title="Click to toggle Safe / Unsafe for this tile"
                      >
                        {td.state === 'safe' ? '🛡️ Safe' : '⚠️ Unsafe'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid click instructions */}
      <div className="bg-purple-950/90 p-2 rounded border border-purple-600/50 text-[10px] text-purple-200 font-medium leading-tight flex items-center gap-1.5">
        <span className="text-amber-300 font-bold shrink-0">👉 Click Grid:</span>
        <span>
          Click anywhere on canvas grid to place a {hiddenPlacementState === 'safe' ? 'Safe (Layer-confined)' : 'Unsafe (Random)'} Hidden tile on Layer {activeLayer}.
        </span>
      </div>
    </div>
  );
};

// --- COMPONENT: DEDICATED GIFT BOXES EDITOR (ADD & REMOVE GIFTS) ---
const GiftManagerEditor: React.FC<{
  tiles: Tile[];
  setTiles: React.Dispatch<React.SetStateAction<Tile[]>>;
  activeGiftLayer: number;
  setActiveGiftLayer: (z: number) => void;
  giftPlacementMode: string | null;
  setGiftPlacementMode: (mode: string | null) => void;
  activeGiftType: string;
  setActiveGiftType: (type: string) => void;
  setActiveLayer?: (layer: number) => void;
  isPro: boolean;
  onRequirePro: (name: string, desc: string) => void;
}> = ({
  tiles,
  setTiles,
  activeGiftLayer,
  setActiveGiftLayer,
  giftPlacementMode,
  setGiftPlacementMode,
  activeGiftType,
  setActiveGiftType,
  setActiveLayer,
  isPro,
  onRequirePro,
}) => {
  const [subTab, setSubTab] = useState<'add' | 'manage'>('add');
  const [giftCategoryFilter, setGiftCategoryFilter] = useState<string>('all');
  const [customX, setCustomX] = useState<number>(10);
  const [customY, setCustomY] = useState<number>(10);
  const [feedback, setFeedback] = useState<string | null>(null);

  const placedGifts = useMemo(() => {
    return tiles.filter(t => t.isGift);
  }, [tiles]);

  const flash = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAddGiftAt = (gx: number, gy: number) => {
    if (!isPro) {
      onRequirePro('Gift Boxes', 'Gift boxes are restricted to Pro members.');
      return;
    }
    const sizeKey = giftPlacementMode || 'gift2x2';
    const size = GIFT_SIZES[sizeKey] || GIFT_SIZES.gift2x2;
    const snappedX = Math.floor(gx / 2) * 2;
    const snappedY = Math.floor(gy / 2) * 2;
    const endX = snappedX + (size.cols - 1) * 2;
    const endY = snappedY + (size.rows - 1) * 2;

    if (endX > 22 || endY > 22) {
      alert(`Gift ${size.name} exceeds grid boundaries. Pick a coordinate inside the board.`);
      return;
    }

    const giftZ = activeGiftLayer;
    const themeConfig = GIFT_THEMES[activeGiftType] || GIFT_THEMES.golden;

    const collides = tiles.some(t => {
      if (!t.isGift || t.z !== giftZ) return false;
      const tCols = GIFT_SIZES[t.mechanic || '']?.cols || t.giftCols || 2;
      const tRows = GIFT_SIZES[t.mechanic || '']?.rows || t.giftRows || 2;
      const tWidth = (tCols - 1) * 2 + 1;
      const tHeight = (tRows - 1) * 2 + 1;
      const newWidth = (size.cols - 1) * 2 + 1;
      const newHeight = (size.rows - 1) * 2 + 1;
      return !(
        snappedX + newWidth <= t.x ||
        snappedX >= t.x + tWidth ||
        snappedY + newHeight <= t.y ||
        snappedY >= t.y + tHeight
      );
    });

    if (collides) {
      alert('Another Gift Box already occupies this position on Gift Layer ' + giftZ);
      return;
    }

    const newGift: Tile = {
      id: `gift-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      x: snappedX,
      y: snappedY,
      z: giftZ,
      mechanic: sizeKey,
      giftCols: size.cols,
      giftRows: size.rows,
      giftType: activeGiftType,
      giftVisual: themeConfig.visualId,
      isGift: true
    };

    setTiles(prev => [...prev, newGift]);
    flash(`✓ Placed ${themeConfig.label} (${size.name}) at (${snappedX}, ${snappedY}) Layer ${giftZ}`);
  };

  const handlePlaceCenter = () => {
    handleAddGiftAt(10, 10);
  };

  const handleRemoveGift = (giftId: string) => {
    setTiles(prev => prev.filter(t => t.id !== giftId));
    flash(`✓ Removed Gift Box`);
  };

  const handleRemoveAllGifts = () => {
    if (placedGifts.length === 0) return;
    if (confirm(`Are you sure you want to remove ALL ${placedGifts.length} Gift Boxes in this level?`)) {
      setTiles(prev => prev.filter(t => !t.isGift));
      flash(`✓ Removed all ${placedGifts.length} Gift Boxes`);
    }
  };

  const handleRemoveGiftsOnLayer = () => {
    const onLayer = placedGifts.filter(g => g.z === activeGiftLayer);
    if (onLayer.length === 0) {
      alert(`No gifts on Gift Layer ${activeGiftLayer}`);
      return;
    }
    setTiles(prev => prev.filter(t => !(t.isGift && t.z === activeGiftLayer)));
    flash(`✓ Removed ${onLayer.length} gifts on Layer ${activeGiftLayer}`);
  };

  const handleCycleTheme = (gift: Tile) => {
    const themesList = Object.keys(GIFT_THEMES);
    const curIdx = themesList.indexOf(gift.giftType || 'golden');
    const nextType = themesList[(curIdx + 1) % themesList.length];
    const themeConfig = GIFT_THEMES[nextType] || GIFT_THEMES.golden;
    setTiles(prev => prev.map(t => t.id === gift.id ? { ...t, giftType: nextType, giftVisual: themeConfig.visualId } : t));
    flash(`Changed Gift theme to ${themeConfig.label}`);
  };

  const handleLocateGift = (gift: Tile) => {
    setActiveGiftLayer(gift.z);
    if (setActiveLayer) {
      setActiveLayer(Math.min(5, Math.ceil(gift.z)));
    }
    flash(`Viewing Gift at (${gift.x}, ${gift.y}) on Layer ${gift.z}`);
  };

  return (
    <div className="bg-slate-900 border-2 border-purple-500/60 p-3 rounded-xl text-[10px] space-y-3 animate-in fade-in duration-150 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
        <div className="flex items-center gap-1.5 text-purple-300 font-bold">
          <Gift className="w-4 h-4 text-amber-400" />
          <span className="text-xs uppercase tracking-wide">Gift Boxes Editor</span>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-950 border border-purple-700 text-purple-200 font-bold">
          {placedGifts.length} in Level
        </span>
      </div>

      {feedback && (
        <div className="p-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-[10px] font-bold text-center animate-in fade-in">
          {feedback}
        </div>
      )}

      {/* Sub-tabs: Add vs Manage */}
      <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
        <button
          onClick={() => setSubTab('add')}
          className={`flex-1 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            subTab === 'add'
              ? 'bg-amber-500 text-slate-950 shadow font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>➕ Add Gift Box</span>
        </button>
        <button
          onClick={() => setSubTab('manage')}
          className={`flex-1 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            subTab === 'manage'
              ? 'bg-purple-600 text-white shadow font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🗑️ Manage / Remove ({placedGifts.length})</span>
        </button>
      </div>

      {subTab === 'add' ? (
        <div className="space-y-3">
          {/* 1. Theme Picker */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                1. Theme &amp; Style:
              </label>
              <span className="text-[9px] font-mono text-slate-400 font-semibold">
                {GIFT_THEMES[activeGiftType]?.label || 'Gold Royal'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.values(GIFT_THEMES).map(t => {
                const isSelected = activeGiftType === t.id;
                const IconComp = t.id === 'mystery' ? Sparkles :
                                t.id === 'crystal' ? Gem :
                                t.id === 'ruby' ? Heart :
                                t.id === 'emerald' ? Award :
                                t.id === 'chest' ? Package :
                                t.id === 'tech' ? Zap : Gift;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveGiftType(t.id)}
                    className={`p-1.5 rounded-lg border flex items-center gap-1.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-white text-white ring-2 ring-amber-400 shadow-md'
                        : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-700/70 text-slate-300'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: t.accent }}
                    >
                      <IconComp className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                    </div>
                    <div className="truncate min-w-0">
                      <p className="font-bold truncate text-[10px]">{t.label}</p>
                      <p className="text-[8px] text-slate-400 truncate">{t.description.split('&')[0]}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Dimensions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                2. Dimensions:
              </label>
              <span className="text-[9px] font-mono text-slate-400">
                {giftPlacementMode ? GIFT_SIZES[giftPlacementMode]?.name : 'Pick a size'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 mb-1.5">
              {(['all', 'Mini', 'Compact', 'Strip', 'Standard', 'Large', 'Grand', 'Mega'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setGiftCategoryFilter(cat)}
                  className={`flex-1 min-w-[36px] py-1 px-1 rounded text-[9px] font-bold text-center transition-colors cursor-pointer ${
                    giftCategoryFilter === cat
                      ? 'bg-amber-500 text-slate-950 shadow font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-0.5">
              {Object.entries(GIFT_SIZES)
                .filter(([_, gSize]) => giftCategoryFilter === 'all' || gSize.category === giftCategoryFilter)
                .map(([id, gSize]) => {
                  const isSelected = giftPlacementMode === id;
                  const cellCount = gSize.cols * gSize.rows;
                  return (
                    <button
                      key={id}
                      onClick={() => setGiftPlacementMode(id)}
                      className={`p-1.5 rounded-lg border flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-black border-amber-300 ring-2 ring-amber-400 shadow-md'
                          : 'bg-slate-950/70 hover:bg-slate-800 border-slate-700/80 text-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold font-mono">{gSize.cols} × {gSize.rows}</span>
                        <span className={`text-[8px] font-medium px-1 rounded ${isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                          {gSize.category}
                        </span>
                      </div>
                      <span className={`text-[9px] font-mono ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                        {cellCount} {cellCount === 1 ? 'cell' : 'cells'}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* 3. Gift Layer */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                3. Gift Layer:
              </label>
              <span className="text-[9px] font-mono text-amber-300 font-bold">
                Layer {activeGiftLayer}
              </span>
            </div>
            <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {GIFT_LAYERS.map(z => (
                <button
                  key={z}
                  onClick={() => setActiveGiftLayer(z)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    activeGiftLayer === z
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-amber-300/70 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Placement Buttons */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <button
              onClick={handlePlaceCenter}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>⚡ Place at Center (10, 10)</span>
            </button>

            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-slate-400 font-medium">Or at (X, Y):</span>
              <input
                type="number"
                min="0"
                max="20"
                step="2"
                value={customX}
                onChange={e => setCustomX(parseInt(e.target.value) || 0)}
                className="w-12 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center text-white font-mono text-xs"
              />
              <span className="text-slate-500">,</span>
              <input
                type="number"
                min="0"
                max="20"
                step="2"
                value={customY}
                onChange={e => setCustomY(parseInt(e.target.value) || 0)}
                className="w-12 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center text-white font-mono text-xs"
              />
              <button
                onClick={() => handleAddGiftAt(customX, customY)}
                className="flex-1 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold transition-colors cursor-pointer"
              >
                Place
              </button>
            </div>

            <div className="bg-amber-950/60 p-2 rounded-lg border border-amber-600/50 text-[10px] text-amber-200 font-medium flex items-center gap-2">
              <span className="text-amber-400 font-bold shrink-0 text-sm">👉</span>
              <span>Click anywhere on grid canvas to place configured Gift Box on Layer {activeGiftLayer}.</span>
            </div>
          </div>
        </div>
      ) : (
        /* MANAGE / REMOVE GIFTS SUB-TAB */
        <div className="space-y-2.5">
          {placedGifts.length === 0 ? (
            <div className="p-4 text-center space-y-2 rounded-xl bg-slate-950 border border-slate-800">
              <Gift className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">No Gift Boxes in this level yet.</p>
              <button
                onClick={() => setSubTab('add')}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs cursor-pointer shadow"
              >
                ➕ Add a Gift Box
              </button>
            </div>
          ) : (
            <>
              {/* Batch Removal Controls */}
              <div className="flex gap-1.5">
                <button
                  onClick={handleRemoveAllGifts}
                  className="flex-1 py-1.5 px-2 bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove All ({placedGifts.length})</span>
                </button>
                <button
                  onClick={handleRemoveGiftsOnLayer}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg font-bold text-[10px] cursor-pointer transition-colors"
                >
                  Clear Layer {activeGiftLayer}
                </button>
              </div>

              {/* List of placed gifts */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {placedGifts.map((gift, idx) => {
                  const size = GIFT_SIZES[gift.mechanic || ''] || { cols: gift.giftCols || 2, rows: gift.giftRows || 2, name: `Gift ${gift.giftCols || 2}×${gift.giftRows || 2}` };
                  const themeKey = gift.giftType || 'golden';
                  const theme = GIFT_THEMES[themeKey] || GIFT_THEMES.golden;
                  const isCovered = isGiftBlocked(gift, tiles);

                  return (
                    <div
                      key={gift.id || idx}
                      className="p-2 rounded-lg bg-slate-950/90 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow"
                          style={{ backgroundColor: theme.accent }}
                        >
                          <Gift className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-200 truncate text-[10px]">{theme.label}</span>
                            <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-amber-300 font-bold shrink-0">
                              {size.cols}×{size.rows}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[8px] text-slate-400 font-mono">
                            <span>({gift.x}, {gift.y})</span>
                            <span>•</span>
                            <span>L{gift.z}</span>
                            <span>•</span>
                            <span className={isCovered ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                              {isCovered ? '🔒 Covered' : '🔓 Free'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleLocateGift(gift)}
                          title="Locate &amp; view this gift on canvas"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                        >
                          🔍
                        </button>
                        <button
                          onClick={() => handleCycleTheme(gift)}
                          title="Change style/theme"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white cursor-pointer"
                        >
                          🎨
                        </button>
                        <button
                          onClick={() => handleRemoveGift(gift.id)}
                          title="Remove this gift box from level"
                          className="p-1 rounded bg-red-950 hover:bg-red-800 text-red-300 hover:text-white cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
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
  activeGiftType: externalGiftType,
  setActiveGiftType: externalSetGiftType,
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
  hiddenPlacementState,
  setHiddenPlacementState,
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
  boardTimer,
  setBoardTimer,
  boardRandom,
  setBoardRandom,
  bossBattle,
  setBossBattle,
  sweetDelivery,
  setSweetDelivery,
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
  selectedTileIds: externalSelectedTileIds,
  setSelectedTileIds: externalSetSelectedTileIds,
}) => {
  const matchableCount = tiles.filter(t => !t.isGift).length;
  const isPlayable = matchableCount > 0 && matchableCount % 3 === 0;
  const isPro = !!activeLicense;

  const [internalSelectedTileIds, setInternalSelectedTileIds] = useState<Set<string>>(new Set());
  const selectedTileIds = externalSelectedTileIds ?? internalSelectedTileIds;
  const setSelectedTileIds = externalSetSelectedTileIds ?? setInternalSelectedTileIds;

  const [internalGiftType, setInternalGiftType] = useState<string>(DEFAULT_GIFT_THEME);
  const [giftCategoryFilter, setGiftCategoryFilter] = useState<string>('all');
  const activeGiftType = externalGiftType ?? internalGiftType;
  const setActiveGiftType = externalSetGiftType ?? setInternalGiftType;

  // Board Morphism & Level Design Tools State
  const [morphismScope, setMorphismScope] = useState<MorphismScope>('all');
  const [morphismFeedback, setMorphismFeedback] = useState<string | null>(null);

  const handleApplyMorphismTransform = (type: MorphismTransformType) => {
    setTiles(prev => {
      const next = transformTileList(prev, type, morphismScope, activeLayer);
      return next;
    });
    const label = type === 'rotate90cw' ? 'Rotated 90° CW' :
      type === 'rotate90ccw' ? 'Rotated 90° CCW' :
      type === 'rotate180' ? 'Rotated 180°' :
      type === 'flipH' ? 'Flipped Horizontal' : 'Flipped Vertical';
    setMorphismFeedback(`✓ ${label} (${morphismScope === 'all' ? 'All Tiles' : `Layer ${activeLayer}`})`);
    setTimeout(() => setMorphismFeedback(null), 3000);
  };

  const handleApplyMorphismSymmetry = (type: MorphismSymmetryType) => {
    setTiles(prev => {
      const { newTiles, addedCount } = generateSymmetricTiles(prev, type, morphismScope, activeLayer);
      const symLabel = type === 'radial4' ? '4-Way Radial Symmetry' :
        type === 'rotational2' ? '2-Way Rotational Symmetry' :
        type === 'mirrorH' ? 'Horizontal Mirror' : 'Vertical Mirror';
      setMorphismFeedback(`✓ Generated ${symLabel} (+${addedCount} cloned tiles)!`);
      setTimeout(() => setMorphismFeedback(null), 3500);
      return newTiles;
    });
  };

  const handleBakeMorphism = () => {
    setTiles(prev => {
      const baked = bakeMorphismToTiles(prev, boardMorphism.spinAngle, boardMorphism.mirroredHorizons);
      return baked;
    });
    setBoardMorphism(prev => ({
      ...prev,
      spinAngle: 0,
      mirroredHorizons: false,
    }));
    setMorphismFeedback(`✨ Permanently baked morphism into all map tiles!`);
    setTimeout(() => setMorphismFeedback(null), 3500);
  };

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
              {/*
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
              */}
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
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                selectedTool === 'place'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Square className="w-3.5 h-3.5 shrink-0" /> Place
            </button>
            <button
              onClick={() => { setSelectedTool('erase'); setGiftPlacementMode(null); }}
              title="Erase Tile Tool (E)"
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                selectedTool === 'erase'
                  ? 'bg-red-500 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" /> Erase
            </button>
            <button
              onClick={() => { setSelectedTool('select'); setGiftPlacementMode(null); }}
              title="Select Tool: Transform Special Mechanic tiles (except Gift), rotate, move (S/V)"
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                selectedTool === 'select'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5 shrink-0" /> Select
            </button>
            <button
              onClick={() => { setSelectedTool('gift'); setGiftPlacementMode(giftPlacementMode || 'gift2x2'); }}
              title="Gift Boxes Editor: Add / remove gift boxes in the level"
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                selectedTool === 'gift'
                  ? 'bg-purple-600 text-white font-bold shadow ring-1 ring-purple-300'
                  : 'text-purple-300 hover:text-white hover:bg-purple-950/60'
              }`}
            >
              <Gift className="w-3.5 h-3.5 shrink-0 text-amber-300" /> Gifts
            </button>
          </div>

          {/* Active Tool Sub-Panels (Select Mechanic Transformer & Dedicated Gift Editor) */}
          {selectedTool === 'select' && (
            <div className="mb-3">
              <SelectMechanicTransformer
                tiles={tiles}
                setTiles={setTiles}
                selectedTileIds={selectedTileIds}
                setSelectedTileIds={setSelectedTileIds}
                activeLayer={activeLayer}
                isPro={isPro}
                onRequirePro={onRequirePro}
              />
            </div>
          )}

          {selectedTool === 'gift' && (
            <div className="mb-3">
              <GiftManagerEditor
                tiles={tiles}
                setTiles={setTiles}
                activeGiftLayer={activeGiftLayer}
                setActiveGiftLayer={setActiveGiftLayer}
                giftPlacementMode={giftPlacementMode}
                setGiftPlacementMode={setGiftPlacementMode}
                activeGiftType={activeGiftType}
                setActiveGiftType={setActiveGiftType}
                setActiveLayer={setActiveLayer}
                isPro={isPro}
                onRequirePro={onRequirePro}
              />
            </div>
          )}
        </div>

        <div className="space-y-3.5 pr-0.5 pb-6">
          <button
            onClick={() => setTiles([])}
            className="w-full mt-1 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded border border-red-900/50 transition-colors font-medium cursor-pointer"
          >
            Clear Board
          </button>
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
                        setSelectedTool('gift');
                        setSelectedMechanic('gift');
                        setGiftPlacementMode(giftPlacementMode && giftPlacementMode in GIFT_SIZES ? giftPlacementMode : 'gift2x2');
                      } else {
                        setSelectedMechanic(mech.id);
                        if (selectedTool === 'gift') setSelectedTool('place');
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
              <div className="mt-2">
                <GiftManagerEditor
                  tiles={tiles}
                  setTiles={setTiles}
                  activeGiftLayer={activeGiftLayer}
                  setActiveGiftLayer={setActiveGiftLayer}
                  giftPlacementMode={giftPlacementMode}
                  setGiftPlacementMode={setGiftPlacementMode}
                  activeGiftType={activeGiftType}
                  setActiveGiftType={setActiveGiftType}
                  setActiveLayer={setActiveLayer}
                  isPro={isPro}
                  onRequirePro={onRequirePro}
                />
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

            {selectedMechanic === 'hidden' && (
              <HiddenItemManagerPanel
                tiles={tiles}
                setTiles={setTiles}
                activeLayer={activeLayer}
                hiddenPlacementState={hiddenPlacementState || 'safe'}
                setHiddenPlacementState={setHiddenPlacementState || (() => {})}
                isPro={isPro}
                onRequirePro={onRequirePro}
              />
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

            {/* 1. Board-morphism & Level Design Rotation Tools */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-2.5">
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

              {/* Fast Level Design: Map Transformation Tools */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Fast Map Rotation & Symmetry</span>
                  </span>
                </div>

                {/* Scope selector */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded border border-slate-800">
                  <span className="text-[9px] text-slate-400 px-1 font-semibold">Scope:</span>
                  {(['all', 'layer'] as MorphismScope[]).map(sc => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setMorphismScope(sc)}
                      className={`flex-1 py-0.5 px-1.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                        morphismScope === sc
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sc === 'all' ? `All (${tiles.length})` : `Layer ${activeLayer}`}
                    </button>
                  ))}
                </div>

                {/* Quick Map Rotations & Flips */}
                <div>
                  <span className="text-[9px] text-slate-400 block mb-1">Rotate / Flip Map Tiles:</span>
                  <div className="grid grid-cols-5 gap-1">
                    <button
                      type="button"
                      onClick={() => handleApplyMorphismTransform('rotate90cw')}
                      title="Rotate 90° Clockwise"
                      className="py-1 px-0.5 bg-slate-900 hover:bg-purple-950/80 border border-slate-800 hover:border-purple-600 text-slate-300 hover:text-purple-200 rounded font-bold text-[9px] flex flex-col items-center gap-0.5 transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                      <span>90° CW</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyMorphismTransform('rotate90ccw')}
                      title="Rotate 90° Counter-Clockwise"
                      className="py-1 px-0.5 bg-slate-900 hover:bg-purple-950/80 border border-slate-800 hover:border-purple-600 text-slate-300 hover:text-purple-200 rounded font-bold text-[9px] flex flex-col items-center gap-0.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                      <span>90° CCW</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyMorphismTransform('rotate180')}
                      title="Rotate 180°"
                      className="py-1 px-0.5 bg-slate-900 hover:bg-purple-950/80 border border-slate-800 hover:border-purple-600 text-slate-300 hover:text-purple-200 rounded font-bold text-[9px] flex flex-col items-center gap-0.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                      <span>180°</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyMorphismTransform('flipH')}
                      title="Flip Horizontal (Mirror X)"
                      className="py-1 px-0.5 bg-slate-900 hover:bg-purple-950/80 border border-slate-800 hover:border-purple-600 text-slate-300 hover:text-purple-200 rounded font-bold text-[9px] flex flex-col items-center gap-0.5 transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-bold leading-none">↔</span>
                      <span>Flip H</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyMorphismTransform('flipV')}
                      title="Flip Vertical (Mirror Y)"
                      className="py-1 px-0.5 bg-slate-900 hover:bg-purple-950/80 border border-slate-800 hover:border-purple-600 text-slate-300 hover:text-purple-200 rounded font-bold text-[9px] flex flex-col items-center gap-0.5 transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-bold leading-none">↕</span>
                      <span>Flip V</span>
                    </button>
                  </div>
                </div>

                {/* Instant Symmetry Generators */}
                <div className="bg-slate-900/90 p-2 rounded-lg border border-purple-900/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 text-[9px] flex items-center gap-1">
                      <span>🌸 Rotational Symmetry Generator:</span>
                    </span>
                    <span className="text-[8px] text-slate-500">1-Click Layout</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyMorphismSymmetry('radial4')}
                      title="Duplicate existing tiles to all 4 quadrants (90°, 180°, 270° clones) for instant radial symmetry"
                      className="p-1.5 bg-purple-950/60 hover:bg-purple-900/90 border border-purple-500/50 hover:border-purple-400 text-purple-200 rounded-lg text-left transition-all cursor-pointer group"
                    >
                      <div className="font-black text-[9px] flex items-center gap-1 text-purple-100 group-hover:text-white">
                        <span>🌸 4-Way Radial</span>
                      </div>
                      <span className="text-[8px] text-purple-300/80 block leading-tight mt-0.5">
                        Clone 90°, 180°, 270° to make 4 quadrants
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyMorphismSymmetry('rotational2')}
                      title="Duplicate existing tiles rotated 180° for balanced 2-way rotational symmetry"
                      className="p-1.5 bg-cyan-950/60 hover:bg-cyan-900/90 border border-cyan-500/50 hover:border-cyan-400 text-cyan-200 rounded-lg text-left transition-all cursor-pointer group"
                    >
                      <div className="font-black text-[9px] flex items-center gap-1 text-cyan-100 group-hover:text-white">
                        <span>☯️ 2-Way Symmetry</span>
                      </div>
                      <span className="text-[8px] text-cyan-300/80 block leading-tight mt-0.5">
                        Clone 180° for balanced 2-side layout
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyMorphismSymmetry('mirrorH')}
                      title="Mirror clone tiles horizontally across center"
                      className="p-1.5 bg-slate-950/70 hover:bg-slate-800 border border-slate-700/80 text-slate-200 rounded-lg text-left transition-all cursor-pointer col-span-1"
                    >
                      <div className="font-bold text-[9px] flex items-center gap-1 text-slate-200">
                        <span>🪞 Mirror Clone (H)</span>
                      </div>
                      <span className="text-[8px] text-slate-400 block leading-tight mt-0.5">
                        Horizontal reflection copy
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyMorphismSymmetry('mirrorV')}
                      title="Mirror clone tiles vertically across center"
                      className="p-1.5 bg-slate-950/70 hover:bg-slate-800 border border-slate-700/80 text-slate-200 rounded-lg text-left transition-all cursor-pointer col-span-1"
                    >
                      <div className="font-bold text-[9px] flex items-center gap-1 text-slate-200">
                        <span>🪞 Mirror Clone (V)</span>
                      </div>
                      <span className="text-[8px] text-slate-400 block leading-tight mt-0.5">
                        Vertical reflection copy
                      </span>
                    </button>
                  </div>
                </div>

                {/* Feedback badge */}
                {morphismFeedback && (
                  <div className="bg-emerald-950/90 border border-emerald-500/70 text-emerald-300 p-1.5 rounded-lg text-center text-[9px] font-bold animate-in fade-in duration-150 shadow-xs">
                    {morphismFeedback}
                  </div>
                )}

                {/* Live Preview & In-Game Gimmick Settings */}
                {boardMorphism.enabled && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex justify-between items-center text-slate-300 font-bold">
                      <span>Live Board Spin:</span>
                      <span className="text-purple-300 font-mono">{boardMorphism.spinAngle}°</span>
                    </div>

                    <div className="flex gap-1">
                      {[0, 90, 180, 270].map(angle => (
                        <button
                          key={angle}
                          type="button"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                      <label className="flex items-center gap-1.5 p-1.5 rounded bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-800/60">
                        <input
                          type="checkbox"
                          checked={boardMorphism.mirroredHorizons}
                          onChange={(e) => setBoardMorphism(prev => ({ ...prev, mirroredHorizons: e.target.checked }))}
                          className="rounded border-slate-700 text-purple-500 focus:ring-purple-400 cursor-pointer"
                        />
                        <span className="font-bold text-purple-200 text-[9px]">Mirrored Horizons</span>
                      </label>

                      <label className="flex items-center gap-1.5 p-1.5 rounded bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-800/60">
                        <input
                          type="checkbox"
                          checked={!!boardMorphism.previewInEditor}
                          onChange={(e) => setBoardMorphism(prev => ({ ...prev, previewInEditor: e.target.checked }))}
                          className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                        />
                        <span className="font-bold text-cyan-200 text-[9px]">Preview in Editor</span>
                      </label>
                    </div>

                    {/* Bake Morphism into Map Button */}
                    {(boardMorphism.spinAngle !== 0 || boardMorphism.mirroredHorizons) && (
                      <button
                        type="button"
                        onClick={handleBakeMorphism}
                        className="w-full py-1.5 px-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-black text-[9px] shadow-md border border-purple-400/50 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Bake Morphism into Map (Permanently Apply)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
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

            {/* 3. Board Timer */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={boardTimer.enabled}
                    onChange={(e) => setBoardTimer(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-slate-700 text-purple-500 focus:ring-purple-400 cursor-pointer"
                  />
                  <span>Board Timer</span>
                </label>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${boardTimer.enabled ? 'bg-purple-900 text-purple-200 border border-purple-600' : 'bg-slate-800 text-slate-500'}`}>
                  {boardTimer.enabled ? 'Active' : 'Off'}
                </span>
              </div>

              {boardTimer.enabled && (
                <div className="space-y-2 pt-1 border-t border-slate-800/80 text-[10px] animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Level Duration (seconds):</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="10"
                        max="600"
                        step="5"
                        value={boardTimer.duration}
                        onChange={(e) => setBoardTimer(prev => ({ ...prev, duration: Math.max(10, parseInt(e.target.value) || 60) }))}
                        className="w-16 bg-slate-900 text-purple-300 font-bold font-mono text-center rounded border border-slate-700 text-xs py-0.5 outline-none"
                      />
                      <span>sec</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[30, 60, 120, 180].map(sec => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setBoardTimer(prev => ({ ...prev, duration: sec }))}
                        className={`flex-1 py-0.5 rounded text-[9px] font-mono border transition-colors cursor-pointer ${
                          boardTimer.duration === sec
                            ? 'bg-purple-600 text-white border-purple-400 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-purple-400 italic">
                    Affects level difficulty directly: shorter times increase the raw challenge score multiplier!
                  </p>
                </div>
              )}
            </div>

            {/* 4. Board Random */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={boardRandom.enabled}
                    onChange={(e) => setBoardRandom(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-slate-700 text-purple-500 focus:ring-purple-400 cursor-pointer"
                  />
                  <span>Board Random</span>
                </label>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${boardRandom.enabled ? 'bg-purple-900 text-purple-200 border border-purple-600' : 'bg-slate-800 text-slate-500'}`}>
                  {boardRandom.enabled ? 'Active' : 'Off'}
                </span>
              </div>

              {boardRandom.enabled && (
                <div className="space-y-2 pt-1 border-t border-slate-800/80 text-[10px] animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Reshuffle Interval:</span>
                    <select
                      value={boardRandom.interval}
                      onChange={(e) => setBoardRandom(prev => ({ ...prev, interval: (parseInt(e.target.value) || 10) as 5 | 10 | 15 }))}
                      className="bg-slate-900 text-purple-300 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-bold cursor-pointer"
                    >
                      <option value={5}>Every 5 matches</option>
                      <option value={10}>Every 10 matches</option>
                      <option value={15}>Every 15 matches</option>
                    </select>
                  </div>
                  <p className="text-[9px] text-purple-400 italic">
                    Shuffles all tile coordinates and icons randomly after every {boardRandom.interval} matches!
                  </p>
                </div>
              )}
            </div>

            {/* 5. BOSS Battle */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bossBattle.enabled}
                    onChange={(e) => setBossBattle(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-slate-700 text-purple-500 focus:ring-purple-400 cursor-pointer"
                  />
                  <span>BOSS Battle</span>
                </label>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${bossBattle.enabled ? 'bg-purple-900 text-purple-200 border border-purple-600' : 'bg-slate-800 text-slate-500'}`}>
                  {bossBattle.enabled ? 'Active' : 'Off'}
                </span>
              </div>

              {bossBattle.enabled && (
                <div className="space-y-2 pt-1 border-t border-slate-800/80 text-[10px] animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Boss Max HP:</span>
                    <input
                      type="number"
                      min="20"
                      max="1000"
                      step="10"
                      value={bossBattle.maxHP}
                      onChange={(e) => setBossBattle(prev => ({ ...prev, maxHP: Math.max(20, parseInt(e.target.value) || 100) }))}
                      className="w-16 bg-slate-900 text-purple-300 font-bold font-mono text-center rounded border border-slate-700 text-xs py-0.5 outline-none"
                    />
                  </div>
                  <ul className="text-[9px] text-purple-400 space-y-1 list-disc pl-3">
                    <li>Tray max size reduced by 2 (max 5 slots, or 4 slots in Endless Order).</li>
                    {sweetDelivery.enabled ? (
                      <li className="text-amber-300 font-semibold">
                        ⚡ Sweet Delivery Synergy: Completing an order inflicts direct damage to Boss HP (regular matches do not damage Boss)!
                      </li>
                    ) : (
                      <li>Each matched triplet inflicts damage (depletes Boss HP).</li>
                    )}
                    {sweetDelivery.enabled && (
                      <li className="text-cyan-300 font-semibold">
                        🌀 Boss Scramble: Boss periodically reshuffles and scrambles the order of all orders!
                      </li>
                    )}
                    <li>Full tray overflow triggers recovery shuffle and costs -25% Player HP.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* 6. Sweet Delivery Challenge */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sweetDelivery.enabled}
                    onChange={(e) => setSweetDelivery(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-slate-700 text-purple-500 focus:ring-purple-400 cursor-pointer"
                  />
                  <span>Sweet Delivery</span>
                </label>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sweetDelivery.enabled ? 'bg-purple-900 text-purple-200 border border-purple-600' : 'bg-slate-800 text-slate-500'}`}>
                  {sweetDelivery.enabled ? 'Active' : 'Off'}
                </span>
              </div>

              {sweetDelivery.enabled && (() => {
                const matchableTiles = (tiles || []).filter(t => !t.isGift && t.baseIcon);
                const totalTilesCount = matchableTiles.length;
                // Max allowed formula: [(total tiles count / 3) - 2]
                const maxOrdersAllowed = Math.max(1, Math.floor(totalTilesCount / 3) - 2);
                const currentMaxOrders = Math.min(
                  maxOrdersAllowed,
                  Math.max(1, sweetDelivery.maxOrders !== undefined ? sweetDelivery.maxOrders : Math.min(4, maxOrdersAllowed))
                );

                // Group unique icon + color pairs in the current level
                const levelColorIconBreakdown = (() => {
                  const map = new Map<string, { icon: string; color: string; count: number }>();
                  (tiles || []).forEach(t => {
                    if (t.isGift || !t.baseIcon) return;
                    const color = t.color || 'yellow';
                    const key = `${t.baseIcon}__${color}`;
                    const curr = map.get(key);
                    if (curr) {
                      curr.count++;
                    } else {
                      map.set(key, { icon: t.baseIcon, color, count: 1 });
                    }
                  });
                  return Array.from(map.values()).sort((a, b) => b.count - a.count);
                })();

                return (
                  <div className="space-y-2.5 pt-1 border-t border-slate-800/80 text-[10px] animate-in fade-in duration-150">
                    {/* Option 1: Color based Delivery */}
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-2">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!sweetDelivery.colorBased}
                          onChange={(e) => setSweetDelivery(prev => ({ ...prev, colorBased: e.target.checked }))}
                          className="rounded border-slate-700 text-purple-500 focus:ring-purple-400 cursor-pointer mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">Option 1: Color-based Delivery</span>
                            <span className={`text-[8px] font-bold px-1 rounded ${sweetDelivery.colorBased ? 'bg-amber-950 text-amber-300 border border-amber-600/40' : 'text-slate-500'}`}>
                              {sweetDelivery.colorBased ? 'On' : 'Off'}
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-tight mt-0.5">
                            Only tiles with the <strong>same icon AND same color</strong> satisfy the delivery order. Same icon with different color cannot fulfill it.
                          </p>
                        </div>
                      </label>

                      {/* Max Orders adjustment: up to [(total tiles count / 3) - 2] */}
                      <div className="bg-slate-950/80 p-2 rounded border border-purple-500/30 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-300 text-[10px]">Max Delivery Orders</span>
                          <span className="font-mono font-bold text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-[10px]">
                            {currentMaxOrders} / {maxOrdersAllowed} max
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={1}
                            max={maxOrdersAllowed}
                            value={currentMaxOrders}
                            onChange={(e) => {
                              const val = Math.min(maxOrdersAllowed, Math.max(1, parseInt(e.target.value) || 1));
                              setSweetDelivery(prev => ({ ...prev, maxOrders: val }));
                            }}
                            className="flex-1 accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                          />
                          <input
                            type="number"
                            min={1}
                            max={maxOrdersAllowed}
                            value={currentMaxOrders}
                            onChange={(e) => {
                              const val = Math.min(maxOrdersAllowed, Math.max(1, parseInt(e.target.value) || 1));
                              setSweetDelivery(prev => ({ ...prev, maxOrders: val }));
                            }}
                            className="w-10 bg-slate-900 border border-slate-700 rounded text-center text-amber-300 font-mono font-bold text-[10px] py-0.5 outline-none"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[8px] text-slate-400">
                          <span>Formula: [({totalTilesCount} tiles / 3) - 2] = <strong>{maxOrdersAllowed}</strong> max orders allowed</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setSweetDelivery(prev => ({ ...prev, maxOrders: 1 }))}
                              className="px-1 py-0.2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                            >
                              Min
                            </button>
                            <button
                              type="button"
                              onClick={() => setSweetDelivery(prev => ({ ...prev, maxOrders: Math.min(4, maxOrdersAllowed) }))}
                              className="px-1 py-0.2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                            >
                              Std (4)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSweetDelivery(prev => ({ ...prev, maxOrders: maxOrdersAllowed }))}
                              className="px-1 py-0.2 bg-purple-900/60 hover:bg-purple-800 rounded text-purple-200 cursor-pointer font-bold"
                            >
                              Max
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Level Color-Tile & Corresponding Icon Showcase */}
                      <div className="bg-slate-950/80 p-2 rounded border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-300 text-[9px] flex items-center gap-1">
                            <span>🎨</span> Level Tile Showcase ({levelColorIconBreakdown.length} unique types)
                          </span>
                          <span className="text-[8px] text-purple-400 font-mono">
                            {sweetDelivery.colorBased ? 'Exact Color Req.' : 'Standard Match'}
                          </span>
                        </div>

                        {levelColorIconBreakdown.length === 0 ? (
                          <p className="text-[9px] text-slate-500 italic">No tiles placed on board yet.</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                            {levelColorIconBreakdown.map((item, idx) => {
                              const colorObj = COLORS.find(c => c.id === item.color);
                              const IconComp = ICONS[item.icon] || Gift;
                              const isEligibleOrder = item.count >= 3;

                              return (
                                <div
                                  key={idx}
                                  className={`p-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                                    isEligibleOrder ? 'bg-slate-900/90 border-slate-700/80' : 'bg-slate-950/60 border-slate-800 opacity-60'
                                  }`}
                                  title={`${item.icon} in ${item.color}: ${item.count} tiles on board (${Math.floor(item.count / 3)} triplets)`}
                                >
                                  {/* Detailed color tile preview */}
                                  <div className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 shadow-xs relative ${colorObj?.bg || 'bg-slate-800'} ${colorObj?.border || 'border-slate-700'}`}>
                                    <IconComp className={`w-4 h-4 ${colorObj?.class || 'text-white'}`} />
                                    <span className="absolute -bottom-1 -right-1 text-[7px] font-mono font-bold bg-slate-950 text-amber-300 px-0.5 rounded border border-slate-800">
                                      x{item.count}
                                    </span>
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="text-[9px] font-bold text-slate-200 truncate leading-tight">
                                      {item.icon}
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className={`text-[7px] font-mono uppercase px-1 py-0.2 rounded font-bold ${colorObj ? colorObj.class : 'text-slate-400'} bg-slate-950 border border-slate-800`}>
                                        {item.color}
                                      </span>
                                      {isEligibleOrder ? (
                                        <span className="text-[7px] text-emerald-400 font-bold">✓ Ready</span>
                                      ) : (
                                        <span className="text-[7px] text-amber-500 font-bold">&lt;3</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Option 2: Endless Order */}
                    <label className="flex items-start gap-2 p-1.5 rounded bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850">
                      <input
                        type="checkbox"
                        checked={!!sweetDelivery.endlessOrder}
                        onChange={(e) => setSweetDelivery(prev => ({ ...prev, endlessOrder: e.target.checked }))}
                        className="rounded border-slate-700 text-purple-500 focus:ring-purple-400 cursor-pointer mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">Option 2: Endless Order</span>
                          <span className={`text-[8px] font-bold px-1 rounded ${sweetDelivery.endlessOrder ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/40' : 'text-slate-500'}`}>
                            {sweetDelivery.endlessOrder ? '4 Slots' : 'Off'}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 leading-tight mt-0.5">
                          Main tray reduced to <strong>4 slots</strong>. Sub-trays ONLY accept tiles matching <strong>both color + icon</strong>. Mismatches return to main tray until suitable order activates. 4 orders appear (2 active, 2 queued). Clear all board tiles to win!
                        </p>
                      </div>
                    </label>

                    {bossBattle.enabled && (
                      <div className="bg-purple-950/70 p-2 rounded border border-purple-500/40 text-[9px] text-purple-200 space-y-1">
                        <span className="font-bold text-amber-300 flex items-center gap-1">
                          ⚔️ Boss + Sweet Delivery Combined
                        </span>
                        <p className="text-slate-300">
                          Fulfilling an order deals 25 damage to Boss HP (regular matches do not damage Boss). Boss can scramble active and queued orders!
                        </p>
                      </div>
                    )}

                    <ul className="text-[9px] text-purple-400 space-y-1 list-disc pl-3">
                      <li>Tray capacity: {sweetDelivery.endlessOrder ? '4 max slots' : '5 max slots'}.</li>
                      <li>{sweetDelivery.endlessOrder ? 'Deadlock on main tray (4 slots full) results in loss.' : 'Complete all orders to win!'}</li>
                    </ul>
                  </div>
                );
              })()}
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

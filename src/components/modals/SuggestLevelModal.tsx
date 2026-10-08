import React, { useState } from 'react';
import {
  Shuffle, X, Check, Layers, Eye, Link, Boxes, Leaf, Gift, Clock,
  Crown, ShoppingBag, Sparkles, Sliders, Wand2, Shield, AlertTriangle,
  RotateCw, RefreshCw
} from 'lucide-react';
import { SuggestParams, DifficultyMod } from '../../types/game';
import {
  TOP_GAME_ARCHETYPES,
  LEVEL_RANGE_PRESETS,
  LevelRangePresetInfo
} from '../../utils/suggestLevelHelpers';

interface SuggestLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestParams: SuggestParams;
  setSuggestParams: React.Dispatch<React.SetStateAction<SuggestParams>>;
  executeSuggestLevel: (params: SuggestParams) => void;
  difficultyMods?: Record<string, DifficultyMod>;
  currentDifficultyMod?: string;
  currentLevelNum?: number;
}

export const SuggestLevelModal: React.FC<SuggestLevelModalProps> = ({
  isOpen,
  onClose,
  suggestParams,
  setSuggestParams,
  executeSuggestLevel,
  difficultyMods,
  currentDifficultyMod = 'modMedium',
  currentLevelNum = 1,
}) => {
  const [activeTab, setActiveTab] = useState<'archetypes' | 'mechanics' | 'board'>('archetypes');

  if (!isOpen) return null;

  const currentArchetype = TOP_GAME_ARCHETYPES.find(a => a.id === suggestParams.layoutShape) || TOP_GAME_ARCHETYPES[0];

  const handleApplyLevelRange = (preset: LevelRangePresetInfo) => {
    setSuggestParams(prev => ({
      ...prev,
      levelRangePreset: preset.id,
      targetTiles: preset.recommendedTiles,
      layers: preset.recommendedLayers,
      difficultyBand: preset.difficultyBand,
      layoutShape: preset.suggestedArchetype,
      hiddenPct: preset.specialMechanics.hiddenPct,
      chained1Pct: preset.specialMechanics.chained1Pct,
      chained2Pct: preset.specialMechanics.chained2Pct,
      icePct: preset.specialMechanics.icePct,
      combinedPct: preset.specialMechanics.combinedPct,
      enableeventItemLeaf: preset.specialMechanics.leaf,
      includeGifts: preset.specialMechanics.includeGifts,
      giftCount: preset.specialMechanics.giftCount,
      boardTimerEnabled: preset.boardMechanics.timerEnabled,
      boardTimerDuration: preset.boardMechanics.timerDuration,
      boardMorphismEnabled: preset.boardMechanics.morphismEnabled,
      boardMorphismSymmetry: preset.boardMechanics.morphismSymmetry,
      bossBattleEnabled: preset.boardMechanics.bossEnabled,
      bossBattleHP: preset.boardMechanics.bossHP,
      sweetDeliveryEnabled: preset.boardMechanics.deliveryEnabled,
      sweetDeliveryOrdersCount: preset.boardMechanics.deliveryOrders,
      sweetDeliveryEndless: preset.boardMechanics.deliveryEndless,
      boardShuffleEnabled: preset.boardMechanics.shuffleEnabled,
    }));
  };

  const handleGenerateLayer0Sample = () => {
    const paramsCopy = { ...suggestParams, layer0SampleOnly: true };
    executeSuggestLevel(paramsCopy);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 cursor-pointer overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl relative cursor-default animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>Suggest Level Studio Generator</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-600/50 text-cyan-300">
                  Top Game Designs
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Craft playable, aesthetic levels inspired by Tap Tile, Tiles Explorer, Tiles Travel &amp; Matching Tiles.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature 2 Banner: Layer 0 Sample Mode */}
        <div className="px-5 py-2.5 bg-gradient-to-r from-cyan-950/70 via-slate-900 to-purple-950/70 border-b border-cyan-800/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs">
              L0
            </span>
            <div>
              <p className="text-xs font-bold text-cyan-200">
                Layer Sample Mode (Layer 0 Only)
              </p>
              <p className="text-[10px] text-slate-400">
                Create footprint foundation on Layer 0 only ($z=0$), perfect for base prototype planning.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSuggestParams(prev => ({ ...prev, layer0SampleOnly: !prev.layer0SampleOnly }))}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                suggestParams.layer0SampleOnly
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {suggestParams.layer0SampleOnly ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
              <span>{suggestParams.layer0SampleOnly ? 'Layer 0 Sample: Active' : 'Enable Layer 0 Sample'}</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-5 pt-2 border-b border-slate-800 flex gap-2 shrink-0 bg-slate-900/60">
          <button
            onClick={() => setActiveTab('archetypes')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'archetypes'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>1. Game Archetypes &amp; Level Range</span>
          </button>

          <button
            onClick={() => setActiveTab('mechanics')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'mechanics'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>2. Special Tile Mechanics</span>
          </button>

          <button
            onClick={() => setActiveTab('board')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'board'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>3. Board Mechanisms &amp; Difficulty</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* TAB 1: ARCHETYPES & LEVEL RANGE */}
          {activeTab === 'archetypes' && (
            <div className="space-y-4">
              {/* Range of Levels Presets Bar */}
              <div>
                <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wide block mb-1.5">
                  Select Target Level Range (Auto-tunes parameters):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {LEVEL_RANGE_PRESETS.map(preset => {
                    const isSelected = suggestParams.levelRangePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleApplyLevelRange(preset)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                            : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                        }`}
                      >
                        <span className="font-black text-xs block text-white">{preset.levelRangeLabel}</span>
                        <span className="text-[9px] text-slate-400 block truncate">{preset.difficultyBand.replace('mod', '')} Band</span>
                        <span className="text-[9px] text-cyan-400 block font-mono">{preset.recommendedTiles} tiles</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Top Game Archetypes Grid */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wide">
                    Choose Top Game Level Design Archetype:
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">
                    Active: {currentArchetype.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {TOP_GAME_ARCHETYPES.map(arch => {
                    const isSelected = suggestParams.layoutShape === arch.id;
                    return (
                      <button
                        key={arch.id}
                        onClick={() => setSuggestParams(prev => ({ ...prev, layoutShape: arch.id }))}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400 shadow-md'
                            : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-black text-xs text-white truncate">{arch.name}</span>
                            <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-amber-300 shrink-0">
                              {arch.gameInspiration}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight mb-2">
                            {arch.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${arch.accentColor}`}>
                            {arch.tag}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Core Parameters (Tile count & Layers) */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">
                      Target Tiles (Multiple of 3)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="3"
                        min="9"
                        max="180"
                        value={suggestParams.targetTiles}
                        onChange={(e) => setSuggestParams(prev => ({ ...prev, targetTiles: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono outline-none focus:border-amber-500 font-bold"
                      />
                      <span className="text-[10px] text-cyan-400 font-mono font-bold shrink-0">
                        {Math.floor(Number(suggestParams.targetTiles) / 3)} sets
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">
                      Z-Layers Depth {suggestParams.layer0SampleOnly && '(Overridden by L0 Sample)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      disabled={suggestParams.layer0SampleOnly}
                      value={suggestParams.layer0SampleOnly ? 1 : suggestParams.layers}
                      onChange={(e) => setSuggestParams(prev => ({ ...prev, layers: e.target.value }))}
                      className={`w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono outline-none focus:border-amber-500 font-bold ${
                        suggestParams.layer0SampleOnly ? 'opacity-50' : ''
                      }`}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">
                      Difficulty Mod Band
                    </label>
                    <select
                      value={suggestParams.difficultyBand || currentDifficultyMod}
                      onChange={(e) => setSuggestParams(prev => ({ ...prev, difficultyBand: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white outline-none focus:border-amber-500 cursor-pointer text-xs"
                    >
                      <option value="modEasy">Easy (Casual 4 Variants)</option>
                      <option value="modMedium">Medium (7 Variants)</option>
                      <option value="modHard">Hard (10 Variants)</option>
                      <option value="modExpert">Expert (14 Variants)</option>
                      <option value="modMaster">Master (18 Variants)</option>
                    </select>
                  </div>
                </div>

                {/* Stacking & Diagonal Coverage */}
                {!suggestParams.layer0SampleOnly && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-bold text-slate-300">Stack Overlap Cover (%)</span>
                        <span className="font-mono text-cyan-400">{suggestParams.stackRatio}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        value={suggestParams.stackRatio}
                        onChange={(e) => setSuggestParams(prev => ({ ...prev, stackRatio: e.target.value }))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-bold text-slate-300">Diagonal Offset Cover (%)</span>
                        <span className="font-mono text-purple-400">{suggestParams.diagonalRatio}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        value={suggestParams.diagonalRatio}
                        onChange={(e) => setSuggestParams(prev => ({ ...prev, diagonalRatio: e.target.value }))}
                        className="w-full accent-purple-400 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SPECIAL TILE MECHANICS */}
          {activeTab === 'mechanics' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-purple-950/30 border border-purple-500/40 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                    <Eye className="w-4 h-4 text-purple-400" />
                    <span>Special Mechanic: Hidden Items (Curtain)</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-purple-800">
                    <button
                      onClick={() => setSuggestParams(prev => ({ ...prev, hiddenSafetyMode: 'safe' }))}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                        suggestParams.hiddenSafetyMode !== 'unsafe'
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🛡️ Safe State
                    </button>
                    <button
                      onClick={() => setSuggestParams(prev => ({ ...prev, hiddenSafetyMode: 'unsafe' }))}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                        suggestParams.hiddenSafetyMode === 'unsafe'
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ⚠️ Unsafe State
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-300 block mb-1">
                      Hidden Tiles Ratio (% of level)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={suggestParams.hiddenPct}
                      onChange={(e) => setSuggestParams(prev => ({ ...prev, hiddenPct: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 flex-1 leading-tight">
                    {suggestParams.hiddenSafetyMode === 'unsafe'
                      ? '⚠️ Unsafe: Available options drawn with high randomness from across the entire board.'
                      : '🛡️ Safe: Available options confined strictly to sitting layer. Other layers cannot be accounted for.'}
                  </p>
                </div>
              </div>

              {/* Chains and Ice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Chains */}
                <div className="p-3 bg-cyan-950/30 border border-cyan-500/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                    <Link className="w-4 h-4 text-cyan-400" />
                    <span>Chain Restraints</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Chain Lv1 %</label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={suggestParams.chained1Pct}
                        onChange={(e) => setSuggestParams(prev => ({ ...prev, chained1Pct: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Chain Lv2 %</label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={suggestParams.chained2Pct}
                        onChange={(e) => setSuggestParams(prev => ({ ...prev, chained2Pct: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Ice */}
                <div className="p-3 bg-blue-950/30 border border-blue-500/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>Ice Blocks</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Ice Tiles % (Ice 2 &amp; Ice 3)</label>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={suggestParams.icePct}
                      onChange={(e) => setSuggestParams(prev => ({ ...prev, icePct: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Combined and Leaf */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Combined Clusters */}
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                    <Boxes className="w-4 h-4 text-emerald-400" />
                    <span>Combined Clusters</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Combined %</label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={suggestParams.combinedPct}
                        onChange={(e) => setSuggestParams(prev => ({ ...prev, combinedPct: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Max Shape Size</label>
                      <select
                        value={suggestParams.combinedMaxSize || 4}
                        onChange={(e) => setSuggestParams(prev => ({ ...prev, combinedMaxSize: parseInt(e.target.value) || 4 }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs cursor-pointer"
                      >
                        <option value="2">2-tile pair</option>
                        <option value="3">3-tile tri</option>
                        <option value="4">4-tile square</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Leaf & Gifts */}
                <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <Leaf className="w-4 h-4 text-emerald-400" />
                    <span>Timed Leaf &amp; Goal Gifts</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={suggestParams.enableeventItemLeaf}
                        onChange={(e) => setSuggestParams(prev => ({ ...prev, enableeventItemLeaf: e.target.checked }))}
                        className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <span>Spawn 3 Event Items (Countdown 4 moves)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={!!suggestParams.includeGifts}
                        onChange={(e) => setSuggestParams(prev => ({ ...prev, includeGifts: e.target.checked }))}
                        className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <span>Include Goal Gift Boxes (1–2 goal gifts)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BOARD MECHANICS & CONFIG */}
          {activeTab === 'board' && (
            <div className="space-y-3.5">
              {/* Board Timer */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!suggestParams.boardTimerEnabled}
                      onChange={(e) => setSuggestParams(prev => ({ ...prev, boardTimerEnabled: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 cursor-pointer"
                    />
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Board Countdown Timer</span>
                  </label>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${suggestParams.boardTimerEnabled ? 'bg-amber-950 text-amber-300 border border-amber-600' : 'bg-slate-800 text-slate-500'}`}>
                    {suggestParams.boardTimerEnabled ? 'Active' : 'Off'}
                  </span>
                </div>
                {suggestParams.boardTimerEnabled && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Duration (seconds):</span>
                    <input
                      type="number"
                      min="20"
                      max="300"
                      step="10"
                      value={suggestParams.boardTimerDuration || 90}
                      onChange={(e) => setSuggestParams(prev => ({ ...prev, boardTimerDuration: parseInt(e.target.value) || 90 }))}
                      className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-amber-300 font-bold font-mono text-center"
                    />
                  </div>
                )}
              </div>

              {/* BOSS Battle */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!suggestParams.bossBattleEnabled}
                      onChange={(e) => setSuggestParams(prev => ({ ...prev, bossBattleEnabled: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-rose-500 cursor-pointer"
                    />
                    <Crown className="w-4 h-4 text-rose-400" />
                    <span>BOSS Battle (Tray Capped at 5 Slots)</span>
                  </label>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${suggestParams.bossBattleEnabled ? 'bg-rose-950 text-rose-300 border border-rose-600' : 'bg-slate-800 text-slate-500'}`}>
                    {suggestParams.bossBattleEnabled ? 'Active' : 'Off'}
                  </span>
                </div>
                {suggestParams.bossBattleEnabled && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Boss Max HP:</span>
                    <input
                      type="number"
                      min="30"
                      max="200"
                      step="10"
                      value={suggestParams.bossBattleHP || 80}
                      onChange={(e) => setSuggestParams(prev => ({ ...prev, bossBattleHP: parseInt(e.target.value) || 80 }))}
                      className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-rose-300 font-bold font-mono text-center"
                    />
                  </div>
                )}
              </div>

              {/* Sweet Delivery */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!suggestParams.sweetDeliveryEnabled}
                      onChange={(e) => setSuggestParams(prev => ({ ...prev, sweetDeliveryEnabled: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-pink-500 cursor-pointer"
                    />
                    <ShoppingBag className="w-4 h-4 text-pink-400" />
                    <span>Sweet Delivery Orders</span>
                  </label>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${suggestParams.sweetDeliveryEnabled ? 'bg-pink-950 text-pink-300 border border-pink-600' : 'bg-slate-800 text-slate-500'}`}>
                    {suggestParams.sweetDeliveryEnabled ? 'Active' : 'Off'}
                  </span>
                </div>
                {suggestParams.sweetDeliveryEnabled && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Orders:</span>
                      <input
                        type="number"
                        min="3"
                        max="15"
                        value={suggestParams.sweetDeliveryOrdersCount || 6}
                        onChange={(e) => setSuggestParams(prev => ({ ...prev, sweetDeliveryOrdersCount: parseInt(e.target.value) || 6 }))}
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-pink-300 font-bold font-mono text-center"
                      />
                    </div>
                    <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!suggestParams.sweetDeliveryEndless}
                        onChange={(e) => setSuggestParams(prev => ({ ...prev, sweetDeliveryEndless: e.target.checked }))}
                        className="rounded bg-slate-900 border-slate-700 text-pink-500 cursor-pointer"
                      />
                      <span>Endless Order Mode</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Fast Map Symmetry / Morphism */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!suggestParams.boardMorphismEnabled}
                      onChange={(e) => setSuggestParams(prev => ({ ...prev, boardMorphismEnabled: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-purple-500 cursor-pointer"
                    />
                    <RotateCw className="w-4 h-4 text-purple-400" />
                    <span>Board-morphism Map Symmetry</span>
                  </label>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${suggestParams.boardMorphismEnabled ? 'bg-purple-950 text-purple-300 border border-purple-600' : 'bg-slate-800 text-slate-500'}`}>
                    {suggestParams.boardMorphismEnabled ? 'Active' : 'Off'}
                  </span>
                </div>
                {suggestParams.boardMorphismEnabled && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Symmetry Type:</span>
                    <select
                      value={suggestParams.boardMorphismSymmetry || 'quad'}
                      onChange={(e) => setSuggestParams(prev => ({ ...prev, boardMorphismSymmetry: e.target.value as any }))}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs cursor-pointer"
                    >
                      <option value="quad">Quad (4-way symmetry)</option>
                      <option value="horizontal">Horizontal Mirror</option>
                      <option value="vertical">Vertical Mirror</option>
                      <option value="rot90">90° Rotational Symmetry</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <span className="font-bold text-white">
              {suggestParams.layer0SampleOnly ? '🎯 Layer 0 Sample Only' : `Layers: ${suggestParams.layers}`}
            </span>
            <span>•</span>
            <span className="font-mono text-cyan-300 font-bold">
              {suggestParams.targetTiles} Tiles ({Math.floor(Number(suggestParams.targetTiles) / 3)} Match-3 sets)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Action: Layer 0 Sample Only */}
            <button
              onClick={handleGenerateLayer0Sample}
              title="Generate a sample layout strictly on Layer 0"
              className="px-3.5 py-2.5 rounded-xl border border-cyan-500/50 bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Generate Layer 0 Sample Only</span>
            </button>

            {/* Main Action: Generate & Spawn Level */}
            <button
              onClick={() => executeSuggestLevel(suggestParams)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Generate &amp; Spawn Level</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


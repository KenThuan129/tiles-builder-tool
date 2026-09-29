import React from 'react';
import { Shuffle, X, Check } from 'lucide-react';
import { SuggestParams } from '../../types/game';

interface SuggestLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestParams: SuggestParams;
  setSuggestParams: React.Dispatch<React.SetStateAction<SuggestParams>>;
  executeSuggestLevel: (params: SuggestParams) => void;
}

export const SuggestLevelModal: React.FC<SuggestLevelModalProps> = ({
  isOpen,
  onClose,
  suggestParams,
  setSuggestParams,
  executeSuggestLevel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative cursor-default animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Shuffle className="w-5 h-5 text-amber-400" /> Suggest Level Generator
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-300 block mb-1">Target Tile Count (Multiple of 3)</label>
            <input
              type="number"
              step="3"
              min="9"
              max="150"
              value={suggestParams.targetTiles}
              onChange={(e) => setSuggestParams(prev => ({ ...prev, targetTiles: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Z-Layers (2-5)</label>
              <input
                type="number"
                min="2"
                max="5"
                value={suggestParams.layers}
                onChange={(e) => setSuggestParams(prev => ({ ...prev, layers: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">Layout Shape</label>
              <select
                value={suggestParams.layoutShape}
                onChange={(e) => setSuggestParams(prev => ({ ...prev, layoutShape: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-2 text-white outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="pyramid">Pyramid Cascades</option>
                <option value="clusterCluster">Cluster Islands</option>
                <option value="spiralWave">Spiral Wave</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Stack Cover Ratio (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={suggestParams.stackRatio}
                onChange={(e) => setSuggestParams(prev => ({ ...prev, stackRatio: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">Diagonal Cover Ratio (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={suggestParams.diagonalRatio}
                onChange={(e) => setSuggestParams(prev => ({ ...prev, diagonalRatio: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700">
            <div>
              <label className="font-semibold text-slate-400 block mb-1">Hidden %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={suggestParams.hiddenPct}
                onChange={(e) => setSuggestParams(prev => ({ ...prev, hiddenPct: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-400 block mb-1">Chain Lv1 %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={suggestParams.chained1Pct}
                onChange={(e) => setSuggestParams(prev => ({ ...prev, chained1Pct: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-400 block mb-1">Chain Lv2 %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={suggestParams.chained2Pct}
                onChange={(e) => setSuggestParams(prev => ({ ...prev, chained2Pct: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-400 block mb-1">Ice %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={suggestParams.icePct}
                onChange={(e) => setSuggestParams(prev => ({ ...prev, icePct: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-400 block mb-1">Combined %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={suggestParams.combinedPct}
                onChange={(e) => setSuggestParams(prev => ({ ...prev, combinedPct: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-mono"
              />
            </div>
            <div className="flex items-center pt-4">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={suggestParams.enableeventItemLeaf}
                  onChange={(e) => setSuggestParams(prev => ({ ...prev, enableeventItemLeaf: e.target.checked }))}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                eventItem Leaf (3)
              </label>
            </div>
          </div>

          <button
            onClick={() => executeSuggestLevel(suggestParams)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl mt-4 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Generate &amp; Spawn Level
          </button>
        </div>
      </div>
    </div>
  );
};

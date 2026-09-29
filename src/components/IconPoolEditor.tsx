import React, { useState, useMemo } from 'react';
import { ThemeIconRegistry, IconPoolEntry } from '../types/game';
import { THEME_DOT_COLORS } from '../constants/gameConfig';

interface IconPoolEditorProps {
  registry: ThemeIconRegistry;
  pool: IconPoolEntry[];
  setPool: (pool: IconPoolEntry[]) => void;
  totalTriplets: number;
}

export const IconPoolEditor: React.FC<IconPoolEditorProps> = ({
  registry,
  pool,
  setPool,
  totalTriplets,
}) => {
  const [filterTheme, setFilterTheme] = useState('all');

  const allOptions = useMemo(() => {
    const list: Array<{ themeId: string; iconId: number }> = [];
    Object.entries(registry).forEach(([themeId, icons]) => {
      icons.forEach(iconId => {
        list.push({ themeId, iconId });
      });
    });
    return list;
  }, [registry]);

  const filteredOptions = useMemo(() => {
    if (filterTheme === 'all') return allOptions;
    return allOptions.filter(o => o.themeId === filterTheme);
  }, [allOptions, filterTheme]);

  const addToPool = (themeId: string, iconId: number) => {
    if (pool.some(p => p.themeId === themeId && p.iconId === iconId)) return;
    setPool([...pool, { themeId, iconId, weight: 10 }]);
  };

  const removeFromPool = (themeId: string, iconId: number) => {
    setPool(pool.filter(p => !(p.themeId === themeId && p.iconId === iconId)));
  };

  const updateWeight = (themeId: string, iconId: number, weight: number) => {
    setPool(pool.map(p =>
      p.themeId === themeId && p.iconId === iconId
        ? { ...p, weight: Math.max(1, weight) }
        : p
    ));
  };

  const totalWeight = pool.reduce((s, p) => s + p.weight, 0);

  const preview = useMemo(() => {
    if (pool.length === 0 || totalTriplets === 0) return [];
    try {
      const active = pool.filter(p => p.weight > 0);
      if (active.length === 0) return [];
      const totalW = active.reduce((s, p) => s + p.weight, 0);
      if (totalW <= 0) return [];

      const allocations = active.map(p => ({
        themeId: p.themeId,
        iconId: p.iconId,
        ideal: (p.weight / totalW) * totalTriplets,
        count: Math.floor((p.weight / totalW) * totalTriplets),
      }));
      const assigned = allocations.reduce((s, a) => s + a.count, 0);
      const remaining = totalTriplets - assigned;
      allocations.sort((a, b) => (b.ideal - b.count) - (a.ideal - a.count));
      for (let i = 0; i < remaining; i++) {
        allocations[i % allocations.length].count += 1;
      }
      return allocations.sort((a, b) => b.count - a.count);
    } catch {
      return [];
    }
  }, [pool, totalTriplets]);

  return (
    <div className="bg-purple-950/20 rounded-lg p-2 border border-purple-500/30 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-purple-300 uppercase">
          Icon Pool
        </span>
        <span className="text-[9px] text-slate-400 font-mono">
          {pool.length} icons | Σ weight = {totalWeight}
        </span>
      </div>

      <div className="space-y-1.5">
        <select
          value={filterTheme}
          onChange={(e) => setFilterTheme(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-white outline-none"
        >
          <option value="all">All themes</option>
          {Object.keys(registry).map(tid => (
            <option key={tid} value={tid}>{tid}</option>
          ))}
        </select>

        <div className="grid grid-cols-6 gap-1 max-h-32 overflow-y-auto p-1 bg-slate-950/50 rounded border border-slate-800">
          {filteredOptions.map(o => {
            const isInPool = pool.some(
              p => p.themeId === o.themeId && p.iconId === o.iconId
            );
            const themeColor = THEME_DOT_COLORS[o.themeId] || 'bg-slate-500';
            return (
              <button
                key={`${o.themeId}_${o.iconId}`}
                onClick={() => addToPool(o.themeId, o.iconId)}
                disabled={isInPool}
                title={`${o.themeId} #${o.iconId}`}
                className={`relative aspect-square rounded border text-[9px] font-mono flex items-center justify-center transition-all ${
                  isInPool
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-800 border-slate-700 text-cyan-300 hover:bg-purple-500/20 hover:border-purple-500/50 hover:scale-110 cursor-pointer'
                }`}
              >
                <div className={`absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full ${themeColor}`} />
                {o.iconId}
              </button>
            );
          })}
        </div>
      </div>

      {pool.length === 0 ? (
        <p className="text-[10px] text-slate-500 italic text-center py-2">
          Click icon ở trên để thêm vào pool
        </p>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {pool.map(p => {
            const themeColor = THEME_DOT_COLORS[p.themeId] || 'bg-slate-500';
            const pct = totalWeight > 0
              ? Math.round((p.weight / totalWeight) * 100)
              : 0;
            return (
              <div
                key={`${p.themeId}_${p.iconId}`}
                className="flex items-center gap-1.5 bg-slate-900/60 rounded px-1.5 py-1 border border-slate-800"
              >
                <div className={`w-2 h-2 rounded-full ${themeColor} shrink-0`} />
                <span className="text-[10px] font-mono text-cyan-400 shrink-0">
                  #{p.iconId}
                </span>
                <span className="text-[9px] text-slate-500 truncate flex-1">
                  {p.themeId}
                </span>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={p.weight}
                  onChange={(e) =>
                    updateWeight(p.themeId, p.iconId, parseInt(e.target.value) || 1)
                  }
                  className="w-10 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-amber-400 font-mono text-center text-[10px] outline-none focus:border-purple-500"
                />
                <span className="text-[9px] text-slate-500 font-mono w-8 text-right">
                  {pct}%
                </span>
                <button
                  onClick={() => removeFromPool(p.themeId, p.iconId)}
                  className="text-red-400 hover:text-red-300 text-[11px] font-bold px-0.5 shrink-0"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {preview.length > 0 && (
        <div className="bg-slate-950/60 rounded p-2 border border-slate-800 space-y-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
            Preview — {totalTriplets} bộ
          </p>
          {preview.map(p => {
            const themeColor = THEME_DOT_COLORS[p.themeId] || 'bg-slate-500';
            return (
              <div
                key={`${p.themeId}_${p.iconId}`}
                className="flex items-center gap-1.5 text-[10px] font-mono"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${themeColor}`} />
                <span className="text-slate-400">{p.themeId}</span>
                <span className="text-cyan-400">#{p.iconId}</span>
                <span className="ml-auto text-green-400 font-bold">
                  {p.count} bộ
                </span>
              </div>
            );
          })}
          <div className="pt-1 mt-1 border-t border-slate-800 flex justify-between text-[9px]">
            <span className="text-slate-500">Total</span>
            <span className="text-white font-mono font-bold">
              {preview.reduce((s, p) => s + p.count, 0)} bộ
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-1.5">
        <button
          onClick={() => setPool([])}
          className="flex-1 text-[9px] font-bold text-red-400 hover:text-red-300 py-1 rounded bg-slate-900 border border-slate-800 hover:border-red-800"
        >
          Clear Pool
        </button>
        <button
          onClick={() => setPool(pool.map(p => ({ ...p, weight: 10 })))}
          disabled={pool.length === 0}
          className="flex-1 text-[9px] font-bold text-cyan-400 hover:text-cyan-300 py-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Equalize
        </button>
      </div>
    </div>
  );
};

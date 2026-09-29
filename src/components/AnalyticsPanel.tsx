import React, { useState } from 'react';
import { Settings, Activity, Zap, Info, X, Lock, Sparkles, Layers } from 'lucide-react';
import { DifficultyStats, DifficultyMod, Tile, ThemeIconRegistry, TileCluster } from '../types/game';
import { WEIGHTS, DISTRIBUTION_PATTERNS, THEME_DOT_COLORS } from '../constants/gameConfig';
import { isTileFree } from '../utils/gameHelpers';
import { LicenseData } from '../utils/licenseService';

interface AnalyticsPanelProps {
  mode: 'edit' | 'play';
  showAnalyticsInPlay: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  difficultyStats: DifficultyStats;
  difficultyMod: string;
  difficultyMods: Record<string, DifficultyMod>;
  playTiles: Tile[];
  tiles: Tile[];
  distributionPattern: string;
  iconColorRatio: { themeIconRatio: number; colorIconRatio: number };
  themeIconRegistry: ThemeIconRegistry | null;
  activeLicense: LicenseData | null;
  onOpenSubscribe: () => void;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  mode,
  showAnalyticsInPlay,
  isOpenMobile,
  onCloseMobile,
  difficultyStats,
  difficultyMod,
  difficultyMods,
  playTiles,
  tiles,
  distributionPattern,
  iconColorRatio,
  themeIconRegistry,
  activeLicense,
  onOpenSubscribe,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const isPro = !!activeLicense;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`
          fixed lg:static top-0 right-0 bottom-0 z-40
          w-80 max-w-[85vw] bg-slate-900 border-l border-slate-800 flex flex-col h-full max-h-screen overflow-hidden transition-all duration-300 shrink-0 p-4 shadow-2xl lg:shadow-none
          ${isOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          ${mode === 'play' && !showAnalyticsInPlay ? 'lg:w-0 lg:p-0 lg:border-l-0 lg:overflow-hidden' : ''}
        `}
      >
        {/* Header - Fixed Top */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 shrink-0 mb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Balance Analytics</h2>
          </div>
          <button
            onClick={onCloseMobile}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 lg:hidden cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Analytics Cards Container */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
          {/* Total Score Header Card - Always visible */}
          <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700/80 shadow-lg relative shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wide">Total Core Score</p>
              <p className="text-3xl font-black text-cyan-400 font-mono">{difficultyStats.total.toFixed(2)}</p>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/60 text-[10px] text-slate-400">
              <span>Variants: <strong className="text-white">{difficultyMods[difficultyMod]?.variants || 12}</strong></span>
              <span>MAI: <strong className="text-white">{difficultyStats.mai}</strong></span>
            </div>
          </div>

          {/* MAI Live Telemetry Card */}
          <div className="bg-slate-800/90 border border-cyan-500/30 rounded-xl p-3 shadow-lg relative shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider">MAI Live Telemetry</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                {mode === 'play' ? 'Runtime' : 'Editor'}
              </span>
            </div>
            <div className="flex items-center justify-between bg-slate-900/70 px-2.5 py-2 rounded-lg border border-slate-700/60">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[9px] uppercase font-bold">Theory</span>
                <span className="font-mono font-bold text-slate-200 text-xs">{difficultyStats.mai}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[9px] uppercase font-bold">Live</span>
                <span className={`font-mono font-bold text-xs ${
                  Math.abs(
                    parseFloat(
                      mode === 'play'
                        ? (playTiles.filter(t => isTileFree(t, playTiles)).length / Math.max(1, difficultyMods[difficultyMod]?.variants || 12)).toFixed(2)
                        : difficultyStats.mai
                    ) - parseFloat(difficultyStats.mai)
                  ) > 0.5
                    ? 'text-orange-400' : 'text-green-400'
                }`}>
                  {mode === 'play'
                    ? (playTiles.filter(t => isTileFree(t, playTiles)).length / Math.max(1, difficultyMods[difficultyMod]?.variants || 12)).toFixed(2)
                    : difficultyStats.mai}
                </span>
              </div>
            </div>
          </div>

          {/* Advanced Booster Impact & Detailed Breakdown - Gated in Free Mode */}
          <div className="relative shrink-0">
          {!isPro && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs z-20 rounded-xl p-4 flex flex-col items-center justify-center text-center border border-amber-500/30">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center mb-2">
                <Lock className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white mb-1">Advanced Analytics Locked</p>
              <p className="text-[10px] text-slate-400 mb-3">Booster economy impact, combo inventory &amp; item weights require Pro License.</p>
              <button
                onClick={onOpenSubscribe}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 shadow cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Unlock Studio Pro
              </button>
            </div>
          )}

          <div className={!isPro ? 'filter blur-[3px] select-none pointer-events-none' : ''}>
            <div className="bg-slate-800/60 border border-amber-500/30 rounded-xl p-3 mb-3 shadow-lg">
              <h3 className="text-xs font-bold text-amber-300 uppercase border-b border-slate-700 pb-1 mb-2 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Booster Impact
              </h3>

              <div className="grid grid-cols-4 gap-1 text-[9px] text-slate-500 font-bold uppercase mb-1.5">
                <div>Type</div>
                <div className="text-center">Relief</div>
                <div className="text-center">Mult</div>
                <div className="text-center">Score</div>
              </div>

              <div className="grid grid-cols-4 gap-1 items-center mb-1">
                <div className="text-[10px] font-bold text-slate-300">Base</div>
                <div className="text-center font-mono text-amber-400 text-[11px]">{(difficultyStats.baseRelief ?? 0).toFixed(2)}</div>
                <div className="text-center font-mono text-amber-400 text-[11px]">{(difficultyStats.baseMultiplier ?? 1).toFixed(2)}×</div>
                <div className="text-center font-mono text-cyan-400 text-[11px]">{(difficultyStats.baseBoosterScore ?? 0).toFixed(1)}</div>
              </div>

              <div className="grid grid-cols-4 gap-1 items-center mb-1">
                <div className="text-[10px] font-bold text-slate-300">Median</div>
                <div className="text-center font-mono text-amber-400 text-[11px]">{(difficultyStats.medianRelief ?? 0).toFixed(2)}</div>
                <div className="text-center font-mono text-amber-400 text-[11px]">{(difficultyStats.medianMultiplier ?? 1).toFixed(2)}×</div>
                <div className="text-center font-mono text-cyan-400 text-[11px]">{(difficultyStats.medianBoosterScore ?? 0).toFixed(1)}</div>
              </div>

              <div className="grid grid-cols-4 gap-1 items-center">
                <div className="text-[10px] font-bold text-slate-300">Cap</div>
                <div className="text-center font-mono text-amber-400 text-[11px]">{(difficultyStats.capRelief ?? 0).toFixed(2)}</div>
                <div className="text-center font-mono text-amber-400 text-[11px]">{(difficultyStats.capMultiplier ?? 1).toFixed(2)}×</div>
                <div className="text-center font-mono text-cyan-400 text-[11px]">{(difficultyStats.capBoosterScore ?? 0).toFixed(1)}</div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-700/50 text-[9px] text-slate-500 text-center">
                Band: <span className="text-slate-400 font-mono">{difficultyStats.boosterBand ?? '—'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-800 pb-1">Detailed Metrics</h3>

              <MetricRow
                label="Tile Count Weight"
                value={difficultyStats.breakdown.tileCount}
                detail={`${(mode === 'play' ? playTiles : tiles).filter(t => !t.isGift).length} total tiles`}
              />

              <MetricRowWithTooltip
                label="Theme Icons Weight"
                value={difficultyStats.breakdown.icons}
                detail={`Ratio: ${iconColorRatio.themeIconRatio}%`}
                isOpen={activeTooltip === 'icons'}
                onToggle={() => setActiveTooltip(activeTooltip === 'icons' ? null : 'icons')}
              >
                {!themeIconRegistry ? (
                  <div className="space-y-1">
                    {Object.keys(difficultyStats.iconQuantities).length === 0 ? (
                      <p className="text-slate-400 italic">No theme icons placed yet.</p>
                    ) : (
                      Object.entries(difficultyStats.iconQuantities).map(([iconName, qty]) => {
                        const subScore = qty * WEIGHTS.iconCount.theme * (DISTRIBUTION_PATTERNS[distributionPattern]?.iconWeightFactor || 1.1) * (iconColorRatio.themeIconRatio / 100);
                        return (
                          <div key={iconName} className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-300 font-medium">{iconName} ({qty}x)</span>
                            <span className="font-mono text-amber-400">+{subScore.toFixed(2)}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="pr-2">
                      <div
                        className="grid gap-2 text-[9px] text-slate-500 font-bold uppercase mb-1.5 pb-1 border-b border-slate-800"
                        style={{ gridTemplateColumns: 'minmax(0, 1fr) 36px 36px 36px' }}
                      >
                        <div className="text-left">Icon</div>
                        <div className="text-right">Tiles</div>
                        <div className="text-right">Bộ</div>
                        <div className="text-right">Dư</div>
                      </div>

                      <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
                        {Object.values(difficultyStats.iconAggregated ?? {})
                          .sort((a, b) => {
                            if ((a.remainder > 0) !== (b.remainder > 0)) {
                              return a.remainder > 0 ? -1 : 1;
                            }
                            return b.tiles - a.tiles;
                          })
                          .map(a => {
                            const isUnbalanced = a.remainder !== 0;
                            const subScore = a.tiles * WEIGHTS.iconCount.theme
                              * (DISTRIBUTION_PATTERNS[distributionPattern]?.iconWeightFactor || 1.1)
                              * (iconColorRatio.themeIconRatio / 100);
                            const uniqueThemes = [...new Set(a.themes)];

                            return (
                              <div
                                key={a.iconId}
                                className={`grid gap-2 items-center px-1 py-0.5 rounded text-[10px] font-mono ${
                                  isUnbalanced ? 'bg-red-950/40 border border-red-800/50' : 'hover:bg-slate-900/50'
                                }`}
                                style={{ gridTemplateColumns: 'minmax(0, 1fr) 36px 36px 36px' }}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="flex gap-0.5 shrink-0">
                                    {uniqueThemes.map(t => (
                                      <div
                                        key={t}
                                        className={`w-2 h-2 rounded-full ${THEME_DOT_COLORS[t] || 'bg-slate-500'}`}
                                        title={t}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-cyan-400 shrink-0">#{a.iconId}</span>
                                  <span className="text-[9px] text-amber-400 truncate">
                                    +{subScore.toFixed(2)}
                                  </span>
                                </div>

                                <div className="text-right text-slate-400 tabular-nums">{a.tiles}</div>
                                <div className={`text-right font-bold tabular-nums ${isUnbalanced ? 'text-red-400' : 'text-green-400'}`}>
                                  {a.triplets}
                                </div>
                                <div className={`text-right tabular-nums ${isUnbalanced ? 'text-red-400 font-bold' : 'text-slate-600'}`}>
                                  {a.remainder === 0 ? '—' : a.remainder}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-between text-[10px]">
                      <span className="text-slate-500">
                        Tổng: <span className="text-white font-mono font-bold">
                          {Object.values(difficultyStats.iconAggregated ?? {}).reduce((s, a) => s + a.triplets, 0)}
                        </span> bộ
                      </span>
                      {Object.values(difficultyStats.iconAggregated ?? {}).some(a => a.remainder > 0) ? (
                        <span className="text-red-400 font-bold">
                          ⚠ {Object.values(difficultyStats.iconAggregated ?? {}).filter(a => a.remainder > 0).length} lệch
                        </span>
                      ) : (
                        <span className="text-green-400 font-bold">✓ Balanced</span>
                      )}
                    </div>
                  </div>
                )}
              </MetricRowWithTooltip>

              <MetricRowWithTooltip
                label="Color Variants Weight"
                value={difficultyStats.breakdown.colors}
                detail={`Ratio: ${iconColorRatio.colorIconRatio}%`}
                isOpen={activeTooltip === 'colors'}
                onToggle={() => setActiveTooltip(activeTooltip === 'colors' ? null : 'colors')}
              >
                <div className="space-y-1">
                  {Object.keys(difficultyStats.colorQuantities).length === 0 ? (
                    <p className="text-slate-400 italic">No color variants placed yet.</p>
                  ) : (
                    Object.entries(difficultyStats.colorQuantities).map(([colorName, qty]) => {
                      const subScore = qty * WEIGHTS.iconCount.color * (iconColorRatio.colorIconRatio / 100);
                      return (
                        <div key={colorName} className="flex justify-between items-center text-[11px] capitalize">
                          <span className="text-slate-300 font-medium">{colorName} ({qty}x)</span>
                          <span className="font-mono text-cyan-400">+{subScore.toFixed(2)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </MetricRowWithTooltip>

              <MetricRow label="Diagonal Covers (Soft)" value={difficultyStats.breakdown.diagCovers} detail={`${difficultyStats.diagCoversCount} diagonal blocks`} />
              <MetricRow label="Stack Covers (Hard)" value={difficultyStats.breakdown.stackCovers} detail={`${difficultyStats.stackCoversCount} direct vertical stacks`} />

              <MetricRowWithTooltip
                label="Special Mechanics"
                value={difficultyStats.breakdown.mechanics}
                detail="Ice, Chains, Hidden, eventItem"
                isOpen={activeTooltip === 'mechanics'}
                onToggle={() => setActiveTooltip(activeTooltip === 'mechanics' ? null : 'mechanics')}
              >
                <div className="space-y-1">
                  {Object.keys(difficultyStats.mechanicCounts).length === 0 ? (
                    <p className="text-slate-400 italic">No special mechanics active.</p>
                  ) : (
                    Object.entries(difficultyStats.mechanicCounts).map(([mechKey, qty]) => {
                      const perUnit = WEIGHTS.mechanics[mechKey as keyof typeof WEIGHTS.mechanics] || 0;
                      const subScore = qty * perUnit;
                      return (
                        <div key={mechKey} className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-300 font-medium uppercase">{mechKey} ({qty}x)</span>
                          <span className="font-mono text-purple-400">+{subScore.toFixed(2)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </MetricRowWithTooltip>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] space-y-1 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Core Subtotal:</span>
                <span className="font-mono text-slate-200">+{difficultyStats.coreSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Special Subtotal:</span>
                <span className="font-mono text-slate-200">+{difficultyStats.specialSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-300 pt-1 border-t border-slate-800">
                <span>Static Total:</span>
                <span className="font-mono text-cyan-400">{difficultyStats.staticTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};

function MetricRow({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="flex items-center justify-between group">
      <div>
        <p className="text-xs font-medium text-slate-300 group-hover:text-amber-200 transition-colors">{label}</p>
        <p className="text-[10px] text-slate-500">{detail}</p>
      </div>
      <div className="font-mono text-xs font-bold text-amber-400">
        {value > 0 ? `+${value.toFixed(2)}` : '0.00'}
      </div>
    </div>
  );
}

function MetricRowWithTooltip({ label, value, detail, isOpen, onToggle, children }: {
  label: string;
  value: number;
  detail: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between group">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-slate-300 group-hover:text-amber-200 transition-colors">{label}</p>
            <button onClick={onToggle} className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500">{detail}</p>
        </div>
        <div className="font-mono text-xs font-bold text-amber-400">
          {value > 0 ? `+${value.toFixed(2)}` : '0.00'}
        </div>
      </div>
      {isOpen && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 space-y-1.5 my-1 animate-in fade-in duration-150">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Item Breakdown</p>
          {children}
        </div>
      )}
    </div>
  );
}

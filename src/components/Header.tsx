import React from 'react';
import {
  Play, Square, Upload, Download, Activity, Leaf, Gift,
  PanelLeft, PanelRight, ShieldCheck, Sparkles, Key, FileCode, Bot,
  RotateCcw, RotateCw
} from 'lucide-react';
import { VIEWPORT_PRESETS } from '../constants/gameConfig';
import { ViewportPresetKey, Tile } from '../types/game';
import { COLORS, ICONS } from '../constants/gameConfig';
import { LicenseData } from '../utils/licenseService';

interface HeaderProps {
  mode: 'edit' | 'play';
  viewportPreset: ViewportPresetKey;
  setViewportPreset: (preset: ViewportPresetKey) => void;
  isPlayable: boolean;
  startPlayMode: () => void;
  stopPlayMode: () => void;
  onOpenImportJson: () => void;
  onOpenExportJson: () => void;
  onOpenExportBytes: () => void;
  onOpenSimulateSequence: () => void;
  showAnalyticsInPlay: boolean;
  setShowAnalyticsInPlay: (show: boolean) => void;
  isLeftSidebarOpen: boolean;
  setIsLeftSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  container: Tile[];
  slotExpandUsed: number;
  bossBattleEnabled?: boolean;
  sweetDeliveryEnabled?: boolean;
  sweetDeliveryEndless?: boolean;
  tiles: Tile[];
  giftsRevealed: number;
  eventItemsCollected: number;
  // License props
  activeLicense: LicenseData | null;
  onOpenLanding: () => void;
  onOpenSubscribe: () => void;
  onOpenActivate: () => void;
  // Undo / Redo for Tile Editor
  onUndoEdit?: () => void;
  onRedoEdit?: () => void;
  canUndoEdit?: boolean;
  canRedoEdit?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  viewportPreset,
  setViewportPreset,
  isPlayable,
  startPlayMode,
  stopPlayMode,
  onOpenImportJson,
  onOpenExportJson,
  onOpenExportBytes,
  onOpenSimulateSequence,
  showAnalyticsInPlay,
  setShowAnalyticsInPlay,
  isLeftSidebarOpen,
  setIsLeftSidebarOpen,
  isRightPanelOpen,
  setIsRightPanelOpen,
  container,
  slotExpandUsed,
  bossBattleEnabled = false,
  sweetDeliveryEnabled = false,
  sweetDeliveryEndless = false,
  tiles,
  giftsRevealed,
  eventItemsCollected,
  activeLicense,
  onOpenLanding,
  onOpenSubscribe,
  onOpenActivate,
  onUndoEdit,
  onRedoEdit,
  canUndoEdit = false,
  canRedoEdit = false,
}) => {
  const isEndless = sweetDeliveryEnabled && sweetDeliveryEndless;
  const isTrayRestricted = sweetDeliveryEnabled || bossBattleEnabled;
  const baseSlots = isEndless ? 4 : (isTrayRestricted ? 5 : 7);
  const maxSlots = baseSlots + slotExpandUsed;

  return (
    <header className="h-14 sm:h-16 px-3 sm:px-6 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-800/80 backdrop-blur shrink-0 z-30 transition-all duration-200">
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          title="Toggle Tools Sidebar"
          className={`p-1.5 rounded-lg border transition-colors lg:hidden cursor-pointer ${
            isLeftSidebarOpen
              ? 'bg-amber-500 text-slate-950 border-amber-400'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenLanding}
          className="text-left group cursor-pointer"
          title="Return to Landing Page"
        >
          <h1 className="text-xs sm:text-base lg:text-xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent tracking-tight whitespace-nowrap group-hover:brightness-110 transition-all">
            TILES MATCH
          </h1>
        </button>

        {/* License Badge */}
        {activeLicense ? (
          <button
            onClick={onOpenActivate}
            className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold hover:bg-emerald-900/80 transition-colors cursor-pointer"
            title="Pro License Verified"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">PRO</span>
          </button>
        ) : (
          <button
            onClick={onOpenSubscribe}
            className="hidden sm:flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer"
            title="Free Mode (Click to Upgrade)"
          >
            <Sparkles className="w-3 h-3" />
            <span>FREE</span>
          </button>
        )}
      </div>

      {mode === 'play' && (
        <div className="flex-1 flex items-center justify-center min-w-0 mx-2 transition-all duration-200">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-700/90 px-1.5 sm:px-2 py-1 rounded-xl border-b-2 border-slate-900 shadow-inner max-w-full overflow-x-auto">
            <div className="flex gap-1 sm:gap-1.5 shrink-0">
              {[...Array(maxSlots)].map((_, i) => (
                <div key={i} className="w-7 h-7 sm:w-9 sm:h-9 bg-slate-800 rounded shadow-inner border border-slate-900 relative shrink-0">
                  {container[i] && (
                    container[i].mechanic === 'eventItem' ? (
                      <div className="absolute inset-0 rounded flex items-center justify-center bg-yellow-100 border-yellow-400 border-b-2">
                        <Leaf className="w-4 h-4 text-yellow-600" />
                      </div>
                    ) : (
                      <div className={`absolute inset-0 rounded flex items-center justify-center 
                        ${COLORS.find(c => c.id === container[i].color)?.bg} 
                        ${COLORS.find(c => c.id === container[i].color)?.border} border-b-2`}>
                        {ICONS[container[i].baseIcon || 'Star'] && React.createElement(ICONS[container[i].baseIcon || 'Star'], {
                          className: `w-4 h-4 sm:w-5 sm:h-5 ${COLORS.find(c => c.id === container[i].color)?.class}`
                        })}
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>

            {isTrayRestricted && (
              <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-600/40 shrink-0" title={`Modes active (${isEndless ? 'Endless Order' : 'Boss Battle / Sweet Delivery'}) restrict the maximum tray capacity to ${baseSlots} slots.`}>
                {baseSlots} MAX
              </span>
            )}
            {slotExpandUsed > 0 && (
              <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-600/40 shrink-0">
                +{slotExpandUsed}
              </span>
            )}

            {(tiles.some(t => t.isGift) || tiles.some(t => t.mechanic === 'eventItem')) && (
              <div className="hidden sm:flex items-center gap-1 ml-1 pl-1 border-l border-slate-600 shrink-0">
                {tiles.some(t => t.isGift) && (
                  <div className="flex items-center gap-1 bg-amber-900/40 border border-amber-600/50 rounded px-1.5 py-0.5">
                    <Gift className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] font-bold text-amber-200">
                      {giftsRevealed}/{tiles.filter(t => t.isGift).length}
                    </span>
                  </div>
                )}
                {tiles.some(t => t.mechanic === 'eventItem') && (
                  <div className="flex items-center gap-1 bg-emerald-900/40 border border-emerald-600/50 rounded px-1.5 py-0.5">
                    <Leaf className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-200">
                      {eventItemsCollected}/{tiles.filter(t => t.mechanic === 'eventItem').length * 2}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ml-auto">
        <div className="hidden sm:flex bg-slate-900/80 rounded-lg p-0.5 border border-slate-700/50">
          {(Object.keys(VIEWPORT_PRESETS) as ViewportPresetKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setViewportPreset(key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                viewportPreset === key
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {VIEWPORT_PRESETS[key].label}
            </button>
          ))}
        </div>

        {mode === 'edit' && (
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={onUndoEdit}
              disabled={!canUndoEdit}
              title="Undo tile edit (Ctrl+Z)"
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shadow border ${
                canUndoEdit
                  ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200 cursor-pointer'
                  : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Undo</span>
            </button>

            <button
              onClick={onRedoEdit}
              disabled={!canRedoEdit}
              title="Redo tile edit (Ctrl+Y or Ctrl+Shift+Z)"
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shadow border ${
                canRedoEdit
                  ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200 cursor-pointer'
                  : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Redo</span>
            </button>

            <button
              onClick={onOpenImportJson}
              className="flex items-center gap-1 bg-purple-500/20 border border-purple-500/40 hover:bg-purple-500/30 text-purple-300 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shadow cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Import</span>
            </button>
            <button
              onClick={onOpenExportJson}
              className="flex items-center gap-1 bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 text-cyan-300 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shadow cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" /> <span className="hidden xs:inline">JSON</span>
            </button>
            <button
              onClick={onOpenExportBytes}
              className="flex items-center gap-1 bg-orange-500/20 border border-orange-500/40 hover:bg-orange-500/30 text-orange-300 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shadow cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" /> <span className="hidden xs:inline">.bytes</span>
            </button>
            <button
              onClick={onOpenSimulateSequence}
              className="flex items-center gap-1 bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 text-cyan-300 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shadow cursor-pointer whitespace-nowrap"
              title="Simulate Move Sequence JSON"
            >
              <FileCode className="w-3.5 h-3.5" /> <span className="hidden md:inline">Simulate Sequence</span>
            </button>
          </div>
        )}

        {mode === 'edit' ? (
          <button
            onClick={isPlayable ? startPlayMode : undefined}
            className={`flex items-center gap-1.5 font-bold px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs transition-all whitespace-nowrap ${
              isPlayable
                ? 'bg-green-500 hover:bg-green-400 text-slate-900 shadow-lg shadow-green-500/20 cursor-pointer'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Test
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAnalyticsInPlay(!showAnalyticsInPlay)}
              title={showAnalyticsInPlay ? 'Hide Analytics Panel' : 'Show Analytics Panel'}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                showAnalyticsInPlay
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30'
                  : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showAnalyticsInPlay ? 'Hide' : 'Show'}</span>
            </button>
            <button
              onClick={stopPlayMode}
              className="flex items-center gap-1.5 bg-slate-600 hover:bg-slate-500 text-white font-bold px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg shadow-lg transition-all text-xs cursor-pointer whitespace-nowrap"
            >
              <Square className="w-3.5 h-3.5" /> Stop
            </button>
          </div>
        )}

        <button
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          title="Toggle Analytics Panel"
          className={`p-1.5 rounded-lg border transition-colors lg:hidden cursor-pointer ${
            isRightPanelOpen
              ? 'bg-cyan-500 text-slate-950 border-cyan-400'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <PanelRight className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

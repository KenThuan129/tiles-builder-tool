import React, { useState } from 'react';
import {
  Bot, Play, Pause, SkipForward, FastForward, FileCode, ChevronDown, ChevronUp, History, Sparkles, Lock
} from 'lucide-react';
import { BotPersona, MoveLogItem, MoveSequencePayload } from '../types/game';

interface BotPlayerControlsProps {
  isBotActive: boolean;
  setIsBotActive: (active: boolean) => void;
  botPersona: BotPersona;
  setBotPersona: (persona: BotPersona) => void;
  botSpeed: number;
  setBotSpeed: (speed: number) => void;
  onStepBot: () => void;
  moveLogs: MoveLogItem[];
  onOpenExportLogs: () => void;
  // Simulation mode
  simulationPayload: MoveSequencePayload | null;
  simCurrentStepIndex: number;
  setSimCurrentStepIndex: React.Dispatch<React.SetStateAction<number>>;
  onStopSimulation: () => void;
  // License check
  isLifetimePro: boolean;
  onRequireLifetimePro: () => void;
}

export const BotPlayerControls: React.FC<BotPlayerControlsProps> = ({
  isBotActive,
  setIsBotActive,
  botPersona,
  setBotPersona,
  botSpeed,
  setBotSpeed,
  onStepBot,
  moveLogs,
  onOpenExportLogs,
  simulationPayload,
  simCurrentStepIndex,
  setSimCurrentStepIndex,
  onStopSimulation,
  isLifetimePro,
  onRequireLifetimePro,
}) => {
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);

  const handleToggleBotPlay = () => {
    if (!isLifetimePro) {
      onRequireLifetimePro();
      return;
    }
    setIsBotActive(!isBotActive);
  };

  const handlePersonaChange = (p: BotPersona) => {
    if (!isLifetimePro) {
      onRequireLifetimePro();
      return;
    }
    setBotPersona(p);
  };

  const lastMove = moveLogs[moveLogs.length - 1];

  return (
    <div className="bg-slate-800/95 border-t-2 border-purple-500/40 p-2 sm:p-3 shadow-2xl relative z-40">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: Mode Title & Persona Selector */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Bot className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-purple-300 uppercase tracking-wide">
              <span>{simulationPayload ? 'Sequence Simulation Mode' : 'AI Bot Demonstrate Engine'}</span>
              {!isLifetimePro && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> $99 Lifetime
                </span>
              )}
            </div>

            {simulationPayload ? (
              <p className="text-[10px] text-slate-400">
                Replaying Sequence: Step <strong className="text-cyan-300 font-mono">{simCurrentStepIndex + 1}</strong> / {simulationPayload.moves.length}
              </p>
            ) : (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-slate-400">Persona:</span>
                <select
                  value={botPersona}
                  onChange={(e) => handlePersonaChange(e.target.value as BotPersona)}
                  className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-amber-300 font-bold outline-none cursor-pointer"
                >
                  <option value="casual">Casual (Sub-optimal &amp; Relaxed)</option>
                  <option value="veteran">Veteran (Tactical Pair &amp; Slot Manager)</option>
                  <option value="hardcore">Hardcore (Optimal Solver &amp; Unblocker)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex items-center gap-2">
          {simulationPayload ? (
            /* Simulation mode controls */
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSimCurrentStepIndex(prev => Math.max(0, prev - 1))}
                disabled={simCurrentStepIndex <= 0}
                className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              >
                Prev
              </button>
              <button
                onClick={() => setIsBotActive(!isBotActive)}
                className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isBotActive ? 'bg-amber-500 text-slate-950' : 'bg-cyan-500 text-slate-950'
                }`}
              >
                {isBotActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isBotActive ? 'Pause' : 'Auto Play'}
              </button>
              <button
                onClick={() => setSimCurrentStepIndex(prev => Math.min(simulationPayload.moves.length - 1, prev + 1))}
                disabled={simCurrentStepIndex >= simulationPayload.moves.length - 1}
                className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              >
                Next
              </button>
              <button
                onClick={onStopSimulation}
                className="px-2 py-1 rounded bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 text-xs font-bold cursor-pointer ml-1"
              >
                Exit Sim
              </button>
            </div>
          ) : (
            /* AI Bot live play controls */
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleBotPlay}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shadow transition-all cursor-pointer ${
                  isBotActive
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20'
                }`}
              >
                {isBotActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isBotActive ? 'Pause Bot' : 'Auto Play Bot'}</span>
              </button>

              <button
                onClick={() => {
                  if (!isLifetimePro) { onRequireLifetimePro(); return; }
                  onStepBot();
                }}
                disabled={isBotActive}
                className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Execute 1 Single Move"
              >
                <SkipForward className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden sm:inline">1 Step</span>
              </button>

              {/* Speed multiplier */}
              <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700">
                {[0.5, 1, 2, 5].map(s => (
                  <button
                    key={s}
                    onClick={() => setBotSpeed(s)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      botSpeed === s ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Move Log Stream Drawer Toggle & Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLogDrawerOpen(!isLogDrawerOpen)}
            className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-purple-300" />
            <span>Move Log ({moveLogs.length})</span>
            {isLogDrawerOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onOpenExportLogs}
            disabled={moveLogs.length === 0}
            className="flex items-center gap-1 bg-purple-500/20 border border-purple-500/40 hover:bg-purple-500/30 disabled:opacity-40 text-purple-300 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Log JSON</span>
          </button>
        </div>
      </div>

      {/* Latest Move Explanation Banner */}
      {lastMove && (
        <div className="max-w-6xl mx-auto mt-2 bg-slate-900/90 border border-purple-500/30 rounded-lg p-2 text-xs flex items-center justify-between gap-2 text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <span className="font-mono text-purple-400 font-bold">Step #{lastMove.step}:</span>
            <span className="truncate">{lastMove.explanation}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono shrink-0">{lastMove.timestamp}</span>
        </div>
      )}

      {/* Move Log History Drawer */}
      {isLogDrawerOpen && (
        <div className="max-w-6xl mx-auto mt-2 bg-slate-900 border border-slate-700 rounded-xl p-3 space-y-2 max-h-52 overflow-y-auto">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase border-b border-slate-800 pb-1">
            <span>Move History Stream</span>
            <span>{moveLogs.length} Steps Logged</span>
          </div>

          {moveLogs.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-3">No moves logged yet. Start auto-play or click tiles to log moves.</p>
          ) : (
            <div className="space-y-1 font-mono text-[11px]">
              {moveLogs.slice().reverse().map(log => (
                <div key={log.step} className="bg-slate-950/70 p-1.5 rounded border border-slate-800 flex items-center justify-between gap-2 text-slate-300">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-purple-400 font-bold">#{log.step}</span>
                    <span className="text-amber-300 uppercase text-[9px] bg-amber-950/60 px-1 rounded border border-amber-800">{log.personaUsed || 'Human'}</span>
                    <span className="truncate">{log.explanation}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

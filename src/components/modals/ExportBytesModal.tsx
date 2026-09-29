import React from 'react';
import { Download, Copy, X } from 'lucide-react';

interface ExportBytesModalProps {
  isOpen: boolean;
  onClose: () => void;
  bytesPayload: any;
  levelNum: number;
  handleCopyBytes: () => void;
  handleDownloadBytes: () => void;
}

export const ExportBytesModal: React.FC<ExportBytesModalProps> = ({
  isOpen,
  onClose,
  bytesPayload,
  levelNum,
  handleCopyBytes,
  handleDownloadBytes,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative cursor-default animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-orange-400" /> Export .bytes for Game Engine
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-3">
          Format này tuân theo đúng khung của dev để bỏ thẳng vào game engine.
          <span className="text-amber-400 font-bold"> Ice, Combined, Chained bị bỏ qua</span> (chưa implement trong engine).
          <span className="text-emerald-400 font-bold"> Hidden → isBackUp</span>,
          <span className="text-emerald-400 font-bold"> EventItem → indexBreakTileStart:0</span>.
        </p>

        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-slate-900/60 p-2 rounded border border-slate-700">
            <p className="text-slate-500 uppercase font-bold text-[10px]">Version</p>
            <p className="text-orange-400 font-mono text-sm font-bold">{bytesPayload.bytes_version}</p>
          </div>
          <div className="bg-slate-900/60 p-2 rounded border border-slate-700">
            <p className="text-slate-500 uppercase font-bold text-[10px]">Tiles</p>
            <p className="text-white font-mono text-sm">{bytesPayload.tiles?.length || 0}</p>
          </div>
          <div className="bg-slate-900/60 p-2 rounded border border-slate-700">
            <p className="text-slate-500 uppercase font-bold text-[10px]">Gifts</p>
            <p className="text-amber-400 font-mono text-sm">{bytesPayload.gifts?.length || 0}</p>
          </div>
          <div className="bg-slate-900/60 p-2 rounded border border-slate-700">
            <p className="text-slate-500 uppercase font-bold text-[10px]">Difficulty</p>
            <p className="text-cyan-400 font-mono text-sm font-bold">{bytesPayload.DifficultyNew}</p>
          </div>
        </div>

        {bytesPayload._error && (
          <div className="mb-3 bg-red-950/40 border border-red-800 rounded-lg p-3">
            <p className="text-xs font-bold text-red-400 mb-1">⚠️ Conversion Error</p>
            <p className="text-[10px] text-red-300 font-mono">{bytesPayload._error}</p>
          </div>
        )}

        <div className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-[11px] text-orange-300 overflow-y-auto max-h-[350px] select-all whitespace-pre-wrap">
          {JSON.stringify(bytesPayload, null, 2)}
        </div>

        <div className="flex gap-3 mt-4 pt-3 border-t border-slate-700">
          <button
            onClick={handleCopyBytes}
            disabled={!!bytesPayload._error}
            className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-all text-xs ${
              bytesPayload._error
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-slate-700 hover:bg-slate-600 text-white cursor-pointer'
            }`}
          >
            <Copy className="w-4 h-4" /> Copy to Clipboard
          </button>
          <button
            onClick={handleDownloadBytes}
            disabled={!!bytesPayload._error}
            className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-all text-xs ${
              bytesPayload._error
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-lg shadow-orange-500/20 cursor-pointer'
            }`}
          >
            <Download className="w-4 h-4" /> Download Level{levelNum}.bytes
          </button>
        </div>
      </div>
    </div>
  );
};

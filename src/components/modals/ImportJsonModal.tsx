import React from 'react';
import { Upload, X, FileJson, AlertCircle, Check } from 'lucide-react';
import { ValidatedImportData, ThemeIconRegistry } from '../../types/game';

interface ImportJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  importJsonText: string;
  handleImportText: (text: string) => void;
  handleImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  importError: string[] | null;
  importPreview: ValidatedImportData | null;
  themeIconRegistry: ThemeIconRegistry | null;
  handleExecuteImport: () => void;
}

export const ImportJsonModal: React.FC<ImportJsonModalProps> = ({
  isOpen,
  onClose,
  importJsonText,
  handleImportText,
  handleImportFile,
  importError,
  importPreview,
  themeIconRegistry,
  handleExecuteImport,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl p-6 shadow-2xl relative cursor-default animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-400" /> Import Level JSON
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-3">
          Import a previously exported level JSON. Icon and color fields will be <span className="text-amber-400 font-bold">ignored</span> — they'll be regenerated when you press <span className="text-green-400 font-bold">Test Level</span>. Structure and mechanics are validated.
        </p>

        <div className="mb-3">
          <label className="flex items-center justify-center gap-2 bg-slate-900 border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-xl py-4 cursor-pointer transition-colors">
            <FileJson className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-bold text-slate-300">Click to upload .json file</span>
            <input type="file" accept=".json,application/json" onChange={handleImportFile} className="hidden" />
          </label>
        </div>

        <div className="mb-3">
          <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">Or paste JSON here:</label>
          <textarea
            value={importJsonText}
            onChange={(e) => handleImportText(e.target.value)}
            placeholder='{"level_id": 1, "map_info": {"tiles": [...]}}'
            className="w-full h-40 bg-slate-950 border border-slate-700 rounded-lg p-3 font-mono text-[11px] text-cyan-300 outline-none focus:border-purple-500 resize-none"
          />
        </div>

        {importError && (
          <div className="mb-3 bg-red-950/40 border border-red-800 rounded-lg p-3 max-h-32 overflow-y-auto">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold text-red-400 uppercase">Validation Failed ({importError.length} error{importError.length > 1 ? 's' : ''})</span>
            </div>
            <ul className="space-y-0.5 text-[10px] text-red-300 font-mono">
              {importError.slice(0, 20).map((err, i) => (
                <li key={i}>• {err}</li>
              ))}
              {importError.length > 20 && (
                <li className="italic text-red-400/70">... and {importError.length - 20} more</li>
              )}
            </ul>
          </div>
        )}

        {importPreview && (
          <div className="mb-3 bg-green-950/30 border border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-xs font-bold text-green-400 uppercase">Valid — Ready to Import</span>
            </div>

            <div className="mb-2 flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Icon Format:</span>
              {importPreview.isRegistryFormat ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-700">
                  Registry (numeric IDs)
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-700">
                  Legacy (string icon/color)
                </span>
              )}
              <span className="text-[9px] text-slate-500 italic">
                (detected via {importPreview.formatSource || 'default'})
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 text-[10px]">
              <div className="bg-slate-900/60 p-2 rounded">
                <p className="text-slate-500 uppercase font-bold">Level</p>
                <p className="text-white font-mono text-sm">{importPreview.parsed.level_id ?? '—'}</p>
              </div>
              <div className="bg-slate-900/60 p-2 rounded">
                <p className="text-slate-500 uppercase font-bold">Tiles</p>
                <p className="text-white font-mono text-sm">{importPreview.tiles.length}</p>
              </div>
              <div className="bg-slate-900/60 p-2 rounded">
                <p className="text-slate-500 uppercase font-bold">Gifts</p>
                <p className="text-amber-400 font-mono text-sm">{importPreview.gifts?.length || 0}</p>
              </div>
              <div className="bg-slate-900/60 p-2 rounded">
                <p className="text-slate-500 uppercase font-bold">Max Layer</p>
                <p className="text-white font-mono text-sm">
                  {Math.max(...importPreview.tiles.map(t => t.z), 0) + 1}
                </p>
              </div>
              <div className="bg-slate-900/60 p-2 rounded">
                <p className="text-slate-500 uppercase font-bold">Mod Band</p>
                <p className="text-white font-mono text-sm truncate">
                  {importPreview.parsed.difficulty?.difficulty_mod_band ?? '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {importPreview && importPreview.isRegistryFormat && !themeIconRegistry && (
          <div className="mb-3 bg-orange-950/40 border border-orange-800 rounded-lg p-2.5">
            <p className="text-[10px] font-bold text-orange-300 mb-1">
              ⚠️ File này dùng registry IDs nhưng tool chưa import registry.
            </p>
            <p className="text-[9px] text-orange-400/80">
              Sau khi import, tile sẽ hiển thị placeholder. Mở Theme Weights → Import Theme để nạp registry đúng.
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-auto pt-3 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl transition-all text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteImport}
            disabled={!importPreview}
            className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-all text-xs ${
              importPreview
                ? 'bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-lg shadow-purple-500/20 cursor-pointer'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Upload className="w-4 h-4" /> Load into Builder
          </button>
        </div>
      </div>
    </div>
  );
};

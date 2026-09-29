import React from 'react';
import { Upload, X, FileJson } from 'lucide-react';

interface ImportThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeImportText: string;
  handleThemeImportText: (text: string) => void;
  handleThemeImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  themeImportError: string[] | null;
  themeImportPreview: any | null;
  handleExecuteThemeImport: () => void;
}

export const ImportThemeModal: React.FC<ImportThemeModalProps> = ({
  isOpen,
  onClose,
  themeImportText,
  handleThemeImportText,
  handleThemeImportFile,
  themeImportError,
  themeImportPreview,
  handleExecuteThemeImport,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative cursor-default max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-400" /> Import Theme Icon Registry
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-3">
          Format: <code className="text-cyan-300">{`[{ themeID, themeIcons: [id1, id2, ...] }]`}</code>.
          Mỗi icon ID là số nguyên dương. Mỗi theme cần ≥ 3 icon.
        </p>

        <div className="mb-3">
          <label className="flex items-center justify-center gap-2 bg-slate-900 border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-xl py-4 cursor-pointer">
            <FileJson className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-bold text-slate-300">Upload .json file</span>
            <input type="file" accept=".json" onChange={handleThemeImportFile} className="hidden" />
          </label>
        </div>

        <textarea
          value={themeImportText}
          onChange={(e) => handleThemeImportText(e.target.value)}
          placeholder='[{"themeID":"theme00","themeIcons":[1001,1002,1003]}]'
          className="w-full h-40 bg-slate-950 border border-slate-700 rounded-lg p-3 font-mono text-[11px] text-cyan-300 outline-none focus:border-purple-500 resize-none mb-3"
        />

        {themeImportError && (
          <div className="mb-3 bg-red-950/40 border border-red-800 rounded-lg p-3 max-h-32 overflow-y-auto">
            <ul className="space-y-0.5 text-[10px] text-red-300 font-mono">
              {themeImportError.map((err, i) => <li key={i}>• {err}</li>)}
            </ul>
          </div>
        )}

        {themeImportPreview && (
          <div className="mb-3 bg-green-950/30 border border-green-800 rounded-lg p-3">
            <p className="text-xs font-bold text-green-400 mb-2">✓ Valid — {Object.keys(themeImportPreview).length} themes</p>
            <div className="space-y-1 text-[10px] font-mono text-slate-300">
              {Object.entries(themeImportPreview).map(([themeId, icons]: [string, any]) => (
                <div key={themeId} className="flex justify-between">
                  <span className="text-amber-300">{themeId}</span>
                  <span className="text-slate-400">{icons.length} icons ({icons[0]}...{icons[icons.length - 1]})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-auto pt-3 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteThemeImport}
            disabled={!themeImportPreview}
            className={`flex-1 font-bold py-2.5 rounded-xl text-xs ${
              themeImportPreview
                ? 'bg-purple-500 hover:bg-purple-400 text-slate-950 cursor-pointer'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            Load Registry
          </button>
        </div>
      </div>
    </div>
  );
};

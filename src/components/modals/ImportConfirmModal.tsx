import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ImportWarning } from '../../types/game';

interface ImportConfirmModalProps {
  importConfirm: {
    warnings: ImportWarning[];
    onConfirm: () => void;
  } | null;
  onCancel: () => void;
}

export const ImportConfirmModal: React.FC<ImportConfirmModalProps> = ({
  importConfirm,
  onCancel,
}) => {
  if (!importConfirm) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border-2 border-orange-600/50 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-orange-300 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Cảnh báo Import
        </h3>

        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {importConfirm.warnings.map((w, i) => (
            <div key={i} className="bg-orange-950/40 border border-orange-800/50 rounded-lg p-3">
              <p className="text-xs font-bold text-orange-200 mb-1">{w.title}</p>
              <p className="text-[11px] text-orange-300/90 whitespace-pre-line font-mono">{w.detail}</p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-400 mb-4">
          Tile vẫn sẽ được load vào board. Bạn có thể Redistribute lại sau.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={importConfirm.onConfirm}
            className="flex-1 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow-lg transition-all cursor-pointer"
          >
            Tiếp tục Import
          </button>
        </div>
      </div>
    </div>
  );
};

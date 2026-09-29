import React from 'react';
import { Download, Copy, X } from 'lucide-react';

interface ExportJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportPayload: any;
  handleCopyJson: () => void;
  handleDownloadJson: () => void;
}

export const ExportJsonModal: React.FC<ExportJsonModalProps> = ({
  isOpen,
  onClose,
  exportPayload,
  handleCopyJson,
  handleDownloadJson,
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
            <Download className="w-5 h-5 text-cyan-400" /> Export Level JSON Preview
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-3">
          Cấu trúc JSON đã được cập nhật: Các tile normal nằm trước, tile special mechanic nằm phía sau theo từng layer từ 0 đến cao nhất. <code className="text-cyan-300">special_mechanic</code> là optional (bỏ qua với normal tile).
        </p>

        <div className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-[11px] text-cyan-300 overflow-y-auto max-h-[350px] select-all whitespace-pre-wrap">
          {JSON.stringify(exportPayload, null, 2)}
        </div>

        <div className="flex gap-3 mt-4 pt-3 border-t border-slate-700">
          <button
            onClick={handleCopyJson}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl transition-all text-xs cursor-pointer"
          >
            <Copy className="w-4 h-4" /> Copy to Clipboard
          </button>
          <button
            onClick={handleDownloadJson}
            className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download .JSON File
          </button>
        </div>
      </div>
    </div>
  );
};

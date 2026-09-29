import React, { useState } from 'react';
import { Download, Copy, Check, X, FileCode } from 'lucide-react';
import { MoveSequencePayload } from '../../types/game';

interface MoveLogExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sequencePayload: MoveSequencePayload | null;
}

export const MoveLogExportModal: React.FC<MoveLogExportModalProps> = ({
  isOpen,
  onClose,
  sequencePayload,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !sequencePayload) return null;

  const jsonString = JSON.stringify(sequencePayload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `move_sequence_level_${sequencePayload.levelId}_${sequencePayload.persona || 'bot'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border-2 border-purple-500/50 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
            <FileCode className="w-3 h-3" /> Recorded Move Sequence Log
          </span>
        </div>

        <h3 className="text-xl font-black text-white mb-2">
          Export Move Sequence JSON
        </h3>
        <p className="text-xs text-slate-300 mb-4">
          Recorded <strong>{sequencePayload.totalMoves} moves</strong> with persona <span className="text-purple-300 font-bold uppercase">{sequencePayload.persona || 'human'}</span>.
        </p>

        <div className="bg-slate-950 border border-purple-500/40 rounded-xl p-3 text-left font-mono text-[11px] text-purple-300 mb-4 max-h-60 overflow-y-auto">
          <pre className="whitespace-pre-wrap">{jsonString}</pre>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied to Clipboard!' : 'Copy Sequence JSON'}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-110 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20"
          >
            <Download className="w-4 h-4" /> Download JSON File
          </button>
        </div>
      </div>
    </div>
  );
};

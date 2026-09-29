import React, { useState } from 'react';
import { Upload, X, Play, FileCode, Check, AlertCircle } from 'lucide-react';
import { MoveSequencePayload } from '../../types/game';

interface SimulateMoveSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSimulation: (payload: MoveSequencePayload) => void;
}

export const SimulateMoveSequenceModal: React.FC<SimulateMoveSequenceModalProps> = ({
  isOpen,
  onClose,
  onStartSimulation,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    if (!jsonText.trim()) {
      setError('Please paste or upload a valid Move Sequence JSON file.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.moves || !Array.isArray(parsed.moves) || parsed.moves.length === 0) {
        setError('Invalid Move Sequence format: missing or empty "moves" array.');
        return;
      }

      onStartSimulation(parsed as MoveSequencePayload);
      onClose();
    } catch (err: any) {
      setError(`JSON Parsing error: ${err.message}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border-2 border-cyan-500/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
            <FileCode className="w-3 h-3" /> Pro Move Log Simulator
          </span>
        </div>

        <h3 className="text-xl font-black text-white mb-2">
          Simulate Move Sequence
        </h3>
        <p className="text-xs text-slate-300 mb-4">
          Upload or paste a recorded <code className="text-cyan-300 font-mono">Move Sequence JSON</code> file to step through or auto-demo the exact move-by-move gameplay sequence.
        </p>

        {error && (
          <div className="bg-red-950/80 border border-red-500/50 text-red-300 text-xs p-3 rounded-xl mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Upload Move Log JSON File</label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Or Paste Move Log Sequence JSON</label>
            <textarea
              rows={6}
              value={jsonText}
              onChange={(e) => { setJsonText(e.target.value); setError(null); }}
              placeholder='{ "levelId": 1, "moves": [ { "step": 1, "tileId": "gen-1", "explanation": "..." } ] }'
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-cyan-300 font-mono outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20"
          >
            <Play className="w-4 h-4" /> Start Simulation
          </button>
        </div>
      </div>
    </div>
  );
};

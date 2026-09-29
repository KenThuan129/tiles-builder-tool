import React from 'react';
import { Lock, Sparkles, Key, ArrowRight, X } from 'lucide-react';

interface ProLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription: string;
  onOpenSubscribe: () => void;
  onOpenActivate: () => void;
}

export const ProLockModal: React.FC<ProLockModalProps> = ({
  isOpen,
  onClose,
  featureName,
  featureDescription,
  onOpenSubscribe,
  onOpenActivate,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border-2 border-amber-500/50 rounded-2xl w-full max-w-md p-6 shadow-2xl relative cursor-default text-center animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 bg-amber-500/20 border-2 border-amber-400 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
          <Lock className="w-6 h-6" />
        </div>

        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800 px-2.5 py-0.5 rounded-full inline-block mb-2">
          Pro Feature Locked
        </span>

        <h3 className="text-xl font-black text-white mb-2">
          {featureName}
        </h3>

        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          {featureDescription}
        </p>

        <div className="space-y-2">
          <button
            onClick={() => { onClose(); onOpenSubscribe(); }}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:brightness-110 text-slate-950 font-black py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <Sparkles className="w-4 h-4" /> Get Pro Access ($29/mo or $99 Lifetime)
          </button>

          <button
            onClick={() => { onClose(); onOpenActivate(); }}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Key className="w-4 h-4 text-amber-300" /> Have a Key? Activate JSON Key File
          </button>
        </div>
      </div>
    </div>
  );
};

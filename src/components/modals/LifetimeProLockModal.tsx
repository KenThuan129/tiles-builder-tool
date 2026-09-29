import React from 'react';
import { Lock, Sparkles, Key, X, Bot } from 'lucide-react';

interface LifetimeProLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSubscribe: () => void;
  onOpenActivate: () => void;
}

export const LifetimeProLockModal: React.FC<LifetimeProLockModalProps> = ({
  isOpen,
  onClose,
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
        className="bg-slate-800 border-2 border-purple-500/60 rounded-2xl w-full max-w-md p-6 shadow-2xl relative cursor-default text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 bg-purple-500/20 border-2 border-purple-400 text-purple-300 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/20">
          <Bot className="w-6 h-6" />
        </div>

        <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300 bg-purple-950/60 border border-purple-800 px-2.5 py-0.5 rounded-full inline-block mb-2">
          $99 Lifetime Pass Exclusive
        </span>

        <h3 className="text-xl font-black text-white mb-2">
          AI Bot Demonstrate Mode
        </h3>

        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          Auto-play bot simulations with <strong>Casual</strong>, <strong>Veteran</strong>, and <strong>Hardcore</strong> player personas and real-time Move Log Sequence exporting are exclusively available with the <strong>$99 Lifetime Pass</strong>.
        </p>

        <div className="space-y-2">
          <button
            onClick={() => { onClose(); onOpenSubscribe(); }}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:brightness-110 text-slate-950 font-black py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <Sparkles className="w-4 h-4" /> Upgrade to $99 Lifetime Pass
          </button>

          <button
            onClick={() => { onClose(); onOpenActivate(); }}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Key className="w-4 h-4 text-amber-300" /> Have Lifetime JSON Key? Activate
          </button>
        </div>
      </div>
    </div>
  );
};

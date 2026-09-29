import React, { useState } from 'react';
import { Key, Upload, FileJson, AlertCircle, Check, X, ShieldCheck, Trash2 } from 'lucide-react';
import { validateLicenseData, saveLicenseToStorage, clearLicenseFromStorage, LicenseData } from '../../utils/licenseService';

interface KeyActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLicense: LicenseData | null;
  onActivateSuccess: (license: LicenseData) => void;
  onDeactivate: () => void;
  onOpenSubscribe: () => void;
}

export const KeyActivationModal: React.FC<KeyActivationModalProps> = ({
  isOpen,
  onClose,
  activeLicense,
  onActivateSuccess,
  onDeactivate,
  onOpenSubscribe,
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcessLicenseObject = (parsedObj: any) => {
    const result = validateLicenseData(parsedObj);
    if (!result.valid || !result.license) {
      setErrorMessage(result.error || 'Invalid license format');
      setSuccessMessage(null);
      return;
    }

    saveLicenseToStorage(result.license);
    setErrorMessage(null);
    setSuccessMessage(`Key verified successfully! Unlocked Pro License for ${result.license.ownerEmail}`);
    onActivateSuccess(result.license);
  };

  const handlePasteActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonInput.trim()) {
      setErrorMessage('Please paste your License JSON string.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      handleProcessLicenseObject(parsed);
    } catch (err: any) {
      setErrorMessage(`JSON Parse Error: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setJsonInput(text);
        const parsed = JSON.parse(text);
        handleProcessLicenseObject(parsed);
      } catch (err: any) {
        setErrorMessage(`Failed to read license file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleDeactivateClick = () => {
    clearLicenseFromStorage();
    onDeactivate();
    setSuccessMessage(null);
    setErrorMessage(null);
    setJsonInput('');
  };

  return (
    <div
      className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Key className="w-5 h-5 text-amber-400" /> Activate Pro License Key
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Activate full tool capabilities by uploading your purchased <code className="text-amber-300 font-mono">.json</code> key file or pasting the license payload.
        </p>

        {activeLicense ? (
          /* Active License Status Card */
          <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4" /> Pro License Active
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                VERIFIED
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 font-mono border-t border-slate-800 pt-3">
              <div>Plan: <strong className="text-white">{activeLicense.planName}</strong></div>
              <div>Key: <strong className="text-amber-300">{activeLicense.key}</strong></div>
              <div>Owner: <strong className="text-slate-200">{activeLicense.ownerEmail}</strong></div>
              <div>Issued: <span className="text-slate-400">{new Date(activeLicense.issuedAt).toLocaleDateString()}</span></div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={handleDeactivateClick}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Deactivate Key
              </button>
              <button
                onClick={onClose}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Activation Input Form */
          <form onSubmit={handlePasteActivate} className="space-y-4">
            <div>
              <label className="flex items-center justify-center gap-2 bg-slate-900 border-2 border-dashed border-slate-600 hover:border-amber-400 rounded-xl py-4 cursor-pointer transition-colors mb-3">
                <FileJson className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold text-slate-300">Upload license.json file</span>
                <input type="file" accept=".json,application/json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Or paste JSON Key Payload:</label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"tier": "pro", "key": "TBPRO-...", ...}'
                className="w-full h-28 bg-slate-950 border border-slate-700 rounded-lg p-3 font-mono text-[11px] text-amber-300 outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 bg-emerald-950/50 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { onClose(); onOpenSubscribe(); }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
              >
                Need a Key? Buy Pro
              </button>
              <button
                type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Key className="w-4 h-4" /> Activate Key
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ShieldCheck, Download, Copy, Check, Sparkles, X, ArrowRight, Lock, Key } from 'lucide-react';
import { generateLicenseData, saveLicenseToStorage, LicenseData } from '../../utils/licenseService';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivateSuccess: (license: LicenseData) => void;
}

export const SubscribeModal: React.FC<SubscribeModalProps> = ({
  isOpen,
  onClose,
  onActivateSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'lifetime' | 'monthly'>('lifetime');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [purchasedLicense, setPurchasedLicense] = useState<LicenseData | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    const planLabel = selectedPlan === 'lifetime' ? 'Pro Lifetime License' : 'Pro Monthly Subscription';
    const license = generateLicenseData(email, name || 'Game Level Artist', planLabel);

    // Save to storage
    saveLicenseToStorage(license);
    setPurchasedLicense(license);

    // Download license JSON file automatically
    const jsonString = JSON.stringify(license, null, 2);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tiles_builder_pro_license_${license.key.substring(7, 13)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    onActivateSuccess(license);
  };

  const handleCopyJson = () => {
    if (!purchasedLicense) return;
    navigator.clipboard.writeText(JSON.stringify(purchasedLicense, null, 2));
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[110] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border-2 border-amber-500/40 rounded-2xl w-full max-w-xl p-6 sm:p-8 shadow-2xl relative cursor-default my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!purchasedLicense ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Monetization & Pro Upgrade
              </span>
            </div>

            <h2 className="text-2xl font-black text-white mb-2">
              Upgrade to <span className="text-amber-400">Pro Studio Access</span>
            </h2>
            <p className="text-xs text-slate-300 mb-6">
              Unlock native <code className="text-cyan-300 font-mono">.bytes</code> export, procedural AI level generator, custom booster economy, and advanced balance analytics.
            </p>

            {/* Plan selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div
                onClick={() => setSelectedPlan('lifetime')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                  selectedPlan === 'lifetime'
                    ? 'bg-amber-500/10 border-amber-400 text-white shadow-lg'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Best Value
                </div>
                <div className="text-xs font-bold text-slate-300 uppercase mb-1">Lifetime Pass</div>
                <div className="text-2xl font-black text-amber-400 mb-1">$99 <span className="text-xs text-slate-400 font-normal">one-time</span></div>
                <p className="text-[11px] text-slate-400 leading-tight">Pay once, own all current &amp; future features forever. Includes JSON Key File.</p>
              </div>

              <div
                onClick={() => setSelectedPlan('monthly')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPlan === 'monthly'
                    ? 'bg-cyan-500/10 border-cyan-400 text-white shadow-lg'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-bold text-slate-300 uppercase mb-1">Monthly Subscription</div>
                <div className="text-2xl font-black text-cyan-400 mb-1">$29 <span className="text-xs text-slate-400 font-normal">/ month</span></div>
                <p className="text-[11px] text-slate-400 leading-tight">Cancel anytime. Full Pro access with instant JSON Key issuance.</p>
              </div>
            </div>

            {/* Purchase Form */}
            <form onSubmit={handlePurchase} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Your Full Name / Studio Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Studio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">License Delivery Email</label>
                <input
                  type="email"
                  required
                  placeholder="designer@game-studio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
                <p className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> Instant JSON Key File Generation
                </p>
                <p>Purchasing immediately generates and downloads your official <code className="text-cyan-300">tiles_builder_pro_license.json</code> key file and unlocks full Pro functionality in your browser.</p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:brightness-110 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Key className="w-4 h-4" /> Purchase &amp; Download Pro JSON Key
              </button>
            </form>
          </div>
        ) : (
          /* Success View */
          <div className="text-center py-2">
            <div className="w-12 h-12 bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <h2 className="text-2xl font-black text-white mb-1">
              Pro License Unlocked!
            </h2>
            <p className="text-xs text-slate-300 mb-4">
              Your official license key file <code className="text-amber-300 font-mono">tiles_builder_pro_license.json</code> has been generated and downloaded to your device.
            </p>

            <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-4 text-left font-mono text-[11px] text-amber-300 mb-4 relative max-h-48 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{JSON.stringify(purchasedLicense, null, 2)}</pre>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopyJson}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedKey ? 'Copied JSON Key!' : 'Copy License JSON'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Launch Studio <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

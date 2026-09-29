import React from 'react';
import {
  Pickaxe, Play, Sparkles, ShieldCheck, Download, Key, ArrowRight, Check,
  Zap, Boxes, Layers, RefreshCw, BarChart2, CheckCircle2, Lock
} from 'lucide-react';
import { LicenseData } from '../utils/licenseService';

interface LandingPageProps {
  activeLicense: LicenseData | null;
  onLaunchTool: () => void;
  onOpenSubscribe: () => void;
  onOpenActivate: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  activeLicense,
  onLaunchTool,
  onOpenSubscribe,
  onOpenActivate,
}) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Pickaxe className="w-5 h-5" />
            </div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              TILES MATCH TOOL
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activeLicense ? (
              <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300 font-mono hidden xs:inline">
                  PRO ACTIVE ({activeLicense.ownerName || 'Key Verified'})
                </span>
                <button
                  onClick={onOpenActivate}
                  className="text-[10px] underline text-slate-400 hover:text-white ml-1 cursor-pointer"
                >
                  Manage
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenActivate}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 px-3 py-1.5 rounded-lg border border-amber-500/30 hover:bg-amber-500/10 transition-colors cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" /> Activate Key
              </button>
            )}

            <button
              onClick={onLaunchTool}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
            >
              Launch Studio <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-amber-500/10 via-orange-500/10 to-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold text-amber-300 mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Production Level Design &amp; Math Pacing Suite
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6 leading-tight text-wrap">
            Architect &amp; Balance <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent">Match-3 Levels</span> for Native Games
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Eliminate design guesswork with real-time MAI (Match Availability Index) telemetry, procedural layout generators, multi-layer Z-stacking, special mechanics, and seamless export to native <code className="text-orange-300 font-mono">.bytes</code> and JSON format.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <button
              onClick={onLaunchTool}
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:brightness-110 text-slate-950 font-black px-8 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-amber-500/25 cursor-pointer flex items-center gap-2"
            >
              <Pickaxe className="w-4 h-4" /> Open Level Editor
            </button>

            {!activeLicense && (
              <button
                onClick={onOpenSubscribe}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3.5 rounded-xl text-sm border border-slate-700 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" /> Unlock Studio Pro ($29/mo or $99 Lifetime)
              </button>
            )}
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 text-center">
            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">100%</div>
              <div className="text-[11px] text-slate-400">Deterministic Match</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">7+</div>
              <div className="text-[11px] text-slate-400">Special Mechanics</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">MAI</div>
              <div className="text-[11px] text-slate-400">Pacing Telemetry</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-purple-400 font-mono">.bytes</div>
              <div className="text-[11px] text-slate-400">Engine Exporter</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-4 sm:px-6 bg-slate-950/60 border-y border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Built Specifically for Game Designers &amp; Level Artists
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              Everything required to plan, test, and ship thousands of balanced levels without opening a spreadsheet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">MAI Balance Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tracks Match Availability Index in real time. Calculates theoretical pacing, stack cover friction, and penalty scores before playtesting.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-4">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Procedural Generators</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate cascading pyramids, cluster islands, and wave spirals instantly. Custom parameter ratios ensure perfect triplet divisibility.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Mechanics &amp; Goal Gifts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-level chains, ice blocks, combined cluster groups, hidden tiles, timed event items, and goal gifts with fractional layer placement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Matrix */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 bg-cyan-950 border border-cyan-800 px-3 py-1 rounded-full mb-2 inline-block">
              Access Tiers
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Free Building Access vs. Pro Studio Power
            </h2>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-3 p-4 sm:p-6 bg-slate-950 border-b border-slate-700 text-xs font-bold uppercase tracking-wider">
              <div className="text-slate-400">Capabilities</div>
              <div className="text-center text-slate-300">Free Mode</div>
              <div className="text-center text-amber-400 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Pro Access
              </div>
            </div>

            <div className="divide-y divide-slate-700/60 text-xs">
              <div className="grid grid-cols-3 p-4 items-center">
                <div className="font-semibold text-slate-200">Manual Tile Placement &amp; Erasing</div>
                <div className="text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto" /></div>
                <div className="text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto" /></div>
              </div>

              <div className="grid grid-cols-3 p-4 items-center">
                <div className="font-semibold text-slate-200">Basic Playtesting &amp; Tray Controls</div>
                <div className="text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto" /></div>
                <div className="text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto" /></div>
              </div>

              <div className="grid grid-cols-3 p-4 items-center">
                <div className="font-semibold text-slate-200">Basic Total Difficulty Score</div>
                <div className="text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto" /></div>
                <div className="text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto" /></div>
              </div>

              <div className="grid grid-cols-3 p-4 items-center bg-slate-900/40">
                <div className="font-semibold text-slate-200">Procedural Level Generator (AI / Random)</div>
                <div className="text-center text-slate-500 font-medium"><Lock className="w-3.5 h-3.5 mx-auto text-slate-600" /></div>
                <div className="text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto" /></div>
              </div>

              <div className="grid grid-cols-3 p-4 items-center bg-slate-900/40">
                <div className="font-semibold text-slate-200">Native <code className="text-orange-300 font-mono">.bytes</code> Game Engine Export</div>
                <div className="text-center text-slate-500 font-medium"><Lock className="w-3.5 h-3.5 mx-auto text-slate-600" /></div>
                <div className="text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto" /></div>
              </div>

              <div className="grid grid-cols-3 p-4 items-center bg-slate-900/40">
                <div className="font-semibold text-slate-200">JSON Level Importer &amp; Clean Exporter</div>
                <div className="text-center text-slate-500 font-medium"><Lock className="w-3.5 h-3.5 mx-auto text-slate-600" /></div>
                <div className="text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto" /></div>
              </div>

              <div className="grid grid-cols-3 p-4 items-center bg-slate-900/40">
                <div className="font-semibold text-slate-200">Theme Icon Registry &amp; Icon Pool Weights</div>
                <div className="text-center text-slate-500 font-medium"><Lock className="w-3.5 h-3.5 mx-auto text-slate-600" /></div>
                <div className="text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto" /></div>
              </div>

              <div className="grid grid-cols-3 p-4 items-center bg-slate-900/40">
                <div className="font-semibold text-slate-200">Advanced Booster Impact &amp; Combo Analytics</div>
                <div className="text-center text-slate-500 font-medium"><Lock className="w-3.5 h-3.5 mx-auto text-slate-600" /></div>
                <div className="text-center text-emerald-400 font-bold"><Check className="w-4 h-4 mx-auto" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4 sm:px-6 bg-slate-950/60 border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Select Your Studio License
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Instant activation via downloaded <code className="text-amber-300 font-mono">license.json</code> key file.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Free Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col">
              <div className="text-xs font-bold text-slate-400 uppercase mb-2">Free Mode</div>
              <div className="text-3xl font-black text-white mb-2">$0</div>
              <p className="text-xs text-slate-400 mb-6">Perfect for basic manual level building and simple playtesting.</p>

              <ul className="space-y-2.5 text-xs text-slate-300 mb-8 flex-1">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Manual Tile &amp; Gift Placement</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Multi-layer Z-Height Editor</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Basic Playtesting &amp; Boosters</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Core Static Score</li>
              </ul>

              <button
                onClick={onLaunchTool}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Launch Free Tool
              </button>
            </div>

            {/* Pro Card */}
            <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/30 border-2 border-amber-500/50 rounded-2xl p-6 sm:p-8 flex flex-col relative shadow-2xl">
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                Full Studio Pass
              </div>

              <div className="text-xs font-bold text-amber-400 uppercase mb-2">Pro Access</div>
              <div className="text-3xl font-black text-white mb-2">$99 <span className="text-xs text-slate-400 font-normal">Lifetime or $29/mo</span></div>
              <p className="text-xs text-slate-300 mb-6">Complete suite with JSON Key file download and instant activation.</p>

              <ul className="space-y-2.5 text-xs text-slate-200 mb-8 flex-1">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Procedural AI Generator</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Native <code className="text-orange-300 font-mono">.bytes</code> Engine Exporter</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Level JSON Importer &amp; Exporter</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Theme Registry &amp; Icon Pool Weights</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Advanced Booster Impact Analytics</li>
              </ul>

              <button
                onClick={onOpenSubscribe}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:brightness-110 text-slate-950 font-black py-3 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" /> Buy Pro Pass &amp; Download Key
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4 sm:px-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Tiles Match Tool. Professional Level Engineering Suite.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={onLaunchTool} className="hover:text-white cursor-pointer">Launch Studio</button>
            <span>·</span>
            <button onClick={onOpenActivate} className="hover:text-white cursor-pointer">Activate Key</button>
            <span>·</span>
            <button onClick={onOpenSubscribe} className="hover:text-white cursor-pointer">Pricing</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

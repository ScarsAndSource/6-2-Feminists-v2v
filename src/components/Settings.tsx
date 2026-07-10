import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Shield, Lock, Eye, Feather, Download,
  Moon, Info, KeyRound, CheckCircle2, XCircle,
} from 'lucide-react';
import { getAvgCycleLength, setAvgCycleLength } from '../lib/localFlags';
import { getGroqApiKey } from '../lib/groq';
import type { PatternReport } from '../lib/types';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  reports: PatternReport[];
  reportsLoading: boolean;
  onShowLanding: () => void;
}

export function Settings({ open, onClose, reports, reportsLoading, onShowLanding }: SettingsProps) {
  const [cycleDays, setCycleDays] = useState<string>(() => {
    const saved = getAvgCycleLength();
    return saved != null ? String(saved) : '';
  });

  const groqConfigured = !!getGroqApiKey();

  const handleCycleSave = (val: string) => {
    setCycleDays(val);
    const n = parseInt(val, 10);
    if (val === '') {
      setAvgCycleLength(null);
    } else if (!isNaN(n) && n >= 18 && n <= 45) {
      setAvgCycleLength(n);
    }
  };

  const handleExport = useCallback(() => {
    if (reports.length === 0) return;
    const latest = reports[0]; // most recent first
    const blob = new Blob([JSON.stringify(latest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `casefile-${new Date(latest.generated_at).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [reports]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-rose-950/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* slide-over panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-md"
          >
            <div className="h-full flex flex-col bg-rose-50 border-l border-rose-200/60 shadow-2xl overflow-y-auto">
              {/* header */}
              <div className="sticky top-0 z-10 glass border-b border-rose-200/50 px-6 py-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-rose-800">Settings</h2>
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-rose-200/60 text-rose-400 hover:text-rose-600 transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 px-6 py-6 space-y-8">
                {/* ─── Privacy & Trust ─── */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-rose-500" />
                    </div>
                    <h3 className="font-display text-base font-semibold text-rose-800">
                      Privacy by design
                    </h3>
                  </div>
                  <p className="text-sm text-rose-600 leading-relaxed mb-4">
                    Your raw entries never leave this session. Only anonymized statistical
                    summaries are sent to the AI model that writes your narrative. Nothing is sold or shared.
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <PrivacyPill icon={<Lock className="w-3.5 h-3.5" />} label="Anonymous auth" />
                    <PrivacyPill icon={<Eye className="w-3.5 h-3.5" />} label="Zero personal data" />
                    <PrivacyPill icon={<Feather className="w-3.5 h-3.5" />} label="Data stays encrypted" />
                  </div>
                </section>

                <hr className="border-rose-200/40" />

                {/* ─── Cycle Length ─── */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-plum-100 to-plum-200 flex items-center justify-center">
                      <Moon className="w-4 h-4 text-plum-500" />
                    </div>
                    <h3 className="font-display text-base font-semibold text-rose-800">
                      Average cycle length
                    </h3>
                  </div>
                  <p className="text-sm text-rose-500 mb-3">
                    Used to estimate your cycle day on the Home screen. Defaults to 28 if left blank.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={18}
                      max={45}
                      placeholder="28"
                      value={cycleDays}
                      onChange={(e) => handleCycleSave(e.target.value)}
                      className="w-24 px-4 py-2.5 rounded-xl border border-rose-200 bg-white/70 text-rose-800 font-semibold text-center text-lg outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all placeholder:text-rose-300"
                    />
                    <span className="text-sm text-rose-400">days</span>
                  </div>
                </section>

                <hr className="border-rose-200/40" />

                {/* ─── Groq API Key ─── */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
                      <KeyRound className="w-4 h-4 text-rose-500" />
                    </div>
                    <h3 className="font-display text-base font-semibold text-rose-800">
                      Groq API Key
                    </h3>
                  </div>
                  <p className="text-sm text-rose-500 mb-3 leading-relaxed">
                    Key loaded from <code className="text-rose-600 text-xs bg-rose-100/60 px-1.5 py-0.5 rounded">VITE_GROQ_API_KEY</code> in <code className="text-rose-600 text-xs bg-rose-100/60 px-1.5 py-0.5 rounded">.env.local</code>. Restart the dev server after changing it.
                  </p>
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium">
                    {groqConfigured ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="text-green-700">API key configured</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-400" />
                        <span className="text-rose-500">No API key set</span>
                      </>
                    )}
                  </div>
                  <div className="mt-2.5">
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors inline-flex items-center gap-0.5"
                    >
                      Get your Groq API key in Groq Console &rarr;
                    </a>
                  </div>
                </section>

                <hr className="border-rose-200/40" />

                {/* ─── Data Export ─── */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blush-100 to-blush-200 flex items-center justify-center">
                      <Download className="w-4 h-4 text-blush-500" />
                    </div>
                    <h3 className="font-display text-base font-semibold text-rose-800">
                      Data export
                    </h3>
                  </div>
                  <p className="text-sm text-rose-500 mb-3">
                    Download your last generated Case File as a portable JSON file.
                  </p>
                  <button
                    onClick={handleExport}
                    disabled={reports.length === 0 || reportsLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300 active:scale-[0.97]"
                  >
                    <Download className="w-4 h-4" />
                    {reportsLoading
                      ? 'Loading…'
                      : reports.length === 0
                      ? 'No Case Files yet'
                      : 'Download last Case File'}
                  </button>
                </section>

                <hr className="border-rose-200/40" />

                {/* ─── About ─── */}
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-semibold text-rose-400 uppercase tracking-wide">About</span>
                  </div>
                  <p className="text-xs text-rose-400 leading-relaxed mb-3">
                    HerWellness is a symptom documentation tool. It does not diagnose, treat, or replace
                    medical advice. Always consult a healthcare provider for medical decisions.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onShowLanding();
                    }}
                    className="text-sm font-semibold text-rose-500 hover:text-rose-700 transition-colors"
                  >
                    About this project &rarr;
                  </button>
                </section>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PrivacyPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 rounded-full border border-rose-200/40 text-xs text-rose-500 font-medium">
      <span className="text-rose-400">{icon}</span>
      {label}
    </div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight, Sparkles, FileText, Shield } from 'lucide-react';
import { ShaderBackground } from './ShaderBackground';
import { setOnboarded, setAvgCycleLength } from '../lib/localFlags';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Document, not diagnose',
    body: 'HerWellness is a symptom documentation tool. It does not diagnose, treat, or replace medical advice. Everything you log stays yours — we just help you see the patterns.',
  },
  {
    title: 'Your cycle, your baseline',
    body: 'If you know your average cycle length, enter it below. It helps us estimate where you are in your cycle. Totally optional — skip if you are not sure.',
  },
  {
    title: 'What a Case File looks like',
    body: 'After a few logs, you can generate a clinical summary like this one. Ready to print, ready to bring to your appointment.',
  },
];

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2.5">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{
            width: current === i ? 24 : 8,
            opacity: current === i ? 1 : 0.35,
          }}
          transition={{ duration: 0.3 }}
          className={`h-2 rounded-full ${
            current === i ? 'bg-rose-500' : 'bg-rose-300'
          }`}
        />
      ))}
    </div>
  );
}

function CaseFilePreviewCard() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="absolute -inset-3 bg-gradient-to-r from-rose-500/20 via-rose-400/15 to-rose-500/20 rounded-3xl blur-2xl opacity-60" />
      <div className="relative bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-rose-200/50 shadow-card">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center shadow-soft shrink-0">
            <FileText className="w-5 h-5 text-rose-400" />
          </div>
          <div className="flex-1 text-left">
            <h4 className="font-display font-semibold text-rose-900 text-sm">Case File Preview</h4>
            <p className="text-xs text-rose-500">Generated from 24 symptom entries over 6 weeks</p>
          </div>
        </div>
        <p className="text-sm text-rose-700 leading-relaxed text-left">
          Bloating was logged 12 times across your tracking period, more than any other symptom.
        </p>
        <p className="text-xs text-rose-400 border-t border-rose-200 pt-3 mt-3 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Based on your logged data. Not a diagnosis.
        </p>
      </div>
    </div>
  );
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [cycleLength, setCycleLength] = useState('');
  const [exiting, setExiting] = useState(false);

  const handleNext = () => {
    if (step < 2) {
      setStep(s => s + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
    if (cycleLength) {
      const n = Number(cycleLength);
      if (n > 0 && n < 100) setAvgCycleLength(n);
    }
    setOnboarded();
    setExiting(true);
    setTimeout(onComplete, 400);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-rose-50">
      <ShaderBackground />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={exiting ? { scale: 0.8, opacity: 0 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-3xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-glow-soft mx-auto mb-5"
            >
              <Heart className="w-8 h-8 text-white" fill="white" />
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
              >
                <h1 className="font-display text-2xl font-semibold text-rose-900 mb-3">
                  {STEPS[step].title}
                </h1>
                <p className="text-sm text-rose-500 leading-relaxed">
                  {STEPS[step].body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <label className="block text-sm font-medium text-rose-600 mb-2 text-center">
                  Average cycle length (days)
                </label>
                <div className="flex justify-center">
                  <input
                    type="number"
                    min={20}
                    max={45}
                    placeholder="28"
                    value={cycleLength}
                    onChange={e => setCycleLength(e.target.value)}
                    className="w-24 text-center px-4 py-3 rounded-xl bg-white/80 border border-rose-200 text-rose-900 text-lg font-semibold placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400 transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 2 && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <CaseFilePreviewCard />
            </motion.div>
          )}

          {step === 0 && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 mb-6 text-xs text-rose-400"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>No accounts. No storage of your raw data. Just patterns.</span>
            </motion.div>
          )}

          <div className="flex items-center gap-3 justify-center">
            <button
              onClick={finish}
              className="px-5 py-2.5 text-sm font-medium text-rose-400 hover:text-rose-600 transition-colors rounded-xl hover:bg-rose-100/50"
            >
              {step < 2 ? 'Skip' : 'Skip'}
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold rounded-xl text-sm hover:from-rose-400 hover:to-rose-500 transition-all hover:scale-[1.02] shadow-glow-soft"
            >
              {step < 2 ? 'Continue' : 'Start tracking'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <StepDots current={step} />
        </div>
      </div>
    </div>
  );
}

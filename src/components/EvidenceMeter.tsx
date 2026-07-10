/**
 * EvidenceMeter
 *
 * Visual representation of the Evidence Strength Score.
 * Shows a radial gauge with the overall score, tier label,
 * and expandable factor breakdown. Lives on the Home screen.
 *
 * Design intent: clinical credibility, not wellness gamification.
 * The language is about "evidence" and "documentation," not "goals" or "streaks."
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Shield, ArrowRight } from 'lucide-react';
import type { Entry, ComputedStats } from '../lib/types';
import { computeEvidenceScore, type EvidenceFactor, type EvidenceResult } from '../lib/evidenceScore';

interface EvidenceMeterProps {
  entries: Entry[];
  stats: ComputedStats;
}

const TIER_COLORS: Record<EvidenceResult['tier'], { ring: string; bg: string; text: string; glow: string }> = {
  insufficient: {
    ring: 'stroke-rose-300',
    bg: 'bg-rose-100',
    text: 'text-rose-400',
    glow: 'rgba(244,137,180,0.15)',
  },
  emerging: {
    ring: 'stroke-rose-400',
    bg: 'bg-rose-100',
    text: 'text-rose-500',
    glow: 'rgba(232,103,155,0.2)',
  },
  moderate: {
    ring: 'stroke-rose-500',
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    glow: 'rgba(212,69,127,0.25)',
  },
  strong: {
    ring: 'stroke-rose-600',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    glow: 'rgba(190,18,60,0.2)',
  },
  compelling: {
    ring: 'stroke-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    glow: 'rgba(16,185,129,0.2)',
  },
};

function RadialGauge({ score, tier }: { score: number; tier: EvidenceResult['tier'] }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const colors = TIER_COLORS[tier];

  return (
    <div className="relative w-[136px] h-[136px] shrink-0">
      {/* glow */}
      <div
        className="absolute inset-2 rounded-full blur-xl opacity-60 transition-all duration-700"
        style={{ backgroundColor: colors.glow }}
      />

      <svg
        viewBox="0 0 120 120"
        className="w-full h-full -rotate-90"
      >
        {/* track */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-rose-200/50"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* filled arc */}
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          className={colors.ring}
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>

      {/* center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={score}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className={`font-display text-3xl font-bold ${colors.text} leading-none`}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider mt-0.5">
          / 100
        </span>
      </div>
    </div>
  );
}

function FactorBar({ factor }: { factor: EvidenceFactor }) {
  const pct = Math.round(factor.score * 100);
  const isFull = factor.nextStep === null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-rose-700">{factor.label}</span>
        <span className={`text-xs font-bold ${isFull ? 'text-emerald-600' : 'text-rose-500'}`}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-rose-200/60 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isFull ? 'bg-emerald-400' : 'bg-gradient-to-r from-rose-400 to-rose-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      <p className="text-xs text-rose-500 leading-relaxed">{factor.status}</p>
      {factor.nextStep && (
        <div className="flex items-start gap-1.5 mt-1">
          <ArrowRight className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" />
          <p className="text-xs text-rose-400 italic leading-relaxed">{factor.nextStep}</p>
        </div>
      )}
    </div>
  );
}

export function EvidenceMeter({ entries, stats }: EvidenceMeterProps) {
  const [expanded, setExpanded] = useState(false);

  const result = useMemo(
    () => computeEvidenceScore(entries, stats),
    [entries, stats]
  );

  const colors = TIER_COLORS[result.tier];

  if (entries.length === 0) return null;

  return (
    <div className="bg-white/50 border border-rose-200/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-soft">
      {/* collapsed view */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 sm:p-6"
      >
        <div className="flex items-center gap-5">
          <RadialGauge score={result.score} tier={result.tier} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Shield className={`w-4 h-4 ${colors.text}`} />
              <h3 className="font-display text-base font-semibold text-rose-800">
                Evidence Strength
              </h3>
            </div>

            <p className={`text-sm font-semibold ${colors.text} mb-2`}>
              {result.tierLabel}
            </p>

            {result.topRecommendation && (
              <p className="text-xs text-rose-500 leading-relaxed line-clamp-2">
                <span className="font-semibold text-rose-600">Next step:</span>{' '}
                {result.topRecommendation}
              </p>
            )}

            {!result.topRecommendation && (
              <p className="text-xs text-emerald-600 font-medium">
                Your documentation is thorough — ready to present.
              </p>
            )}
          </div>

          <div className={`w-8 h-8 rounded-xl ${colors.bg} flex items-center justify-center shrink-0 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
            <ChevronDown className={`w-4 h-4 ${colors.text}`} />
          </div>
        </div>
      </button>

      {/* expanded breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-6 pt-1 border-t border-rose-200/40">
              <div className="space-y-5 mt-4">
                {result.factors.map(factor => (
                  <FactorBar key={factor.id} factor={factor} />
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-rose-200/30 flex items-center gap-2 text-xs text-rose-400">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Every factor above is computed from your logged data — nothing is guessed, nothing is inferred from demographics.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Evidence Strength Score
 *
 * Computes how clinically compelling a patient's documented evidence is,
 * broken into transparent, verifiable factors. This is not a wellness score
 * or a gamified streak — it's a practical readout that tells a patient:
 *   "Here is how strong your documentation is right now,
 *    and here is the single most impactful thing you could do next."
 *
 * Every factor is code-computed from logged data. Nothing is vibes.
 */

import type { Entry, ComputedStats } from './types';

export interface EvidenceFactor {
  id: string;
  label: string;
  /** 0-1 how fulfilled this factor is */
  score: number;
  /** max weight this factor carries */
  weight: number;
  /** what the user sees */
  status: string;
  /** what they'd need to do to improve this factor, or null if maxed */
  nextStep: string | null;
}

export interface EvidenceResult {
  /** 0–100 overall score */
  score: number;
  /** human-readable tier */
  tier: 'insufficient' | 'emerging' | 'moderate' | 'strong' | 'compelling';
  /** one-line summary for the tier */
  tierLabel: string;
  /** individual factor breakdowns */
  factors: EvidenceFactor[];
  /** the single highest-impact next action */
  topRecommendation: string | null;
}

const TIER_LABELS: Record<EvidenceResult['tier'], string> = {
  insufficient: 'Not enough data yet',
  emerging: 'Starting to build a picture',
  moderate: 'Enough for a conversation',
  strong: 'Solid documentation',
  compelling: 'Comprehensive evidence',
};

function tierFor(score: number): EvidenceResult['tier'] {
  if (score < 15) return 'insufficient';
  if (score < 35) return 'emerging';
  if (score < 55) return 'moderate';
  if (score < 75) return 'strong';
  return 'compelling';
}

export function computeEvidenceScore(
  entries: Entry[],
  stats: ComputedStats
): EvidenceResult {
  const factors: EvidenceFactor[] = [];

  // ──── 1. Volume: do you have enough entries? ────
  // 1 entry = 0.1, 5 = 0.5, 10+ = 1.0
  const volumeRaw = Math.min(entries.length / 10, 1);
  factors.push({
    id: 'volume',
    label: 'Entry count',
    score: volumeRaw,
    weight: 20,
    status:
      entries.length === 0
        ? 'No entries logged'
        : entries.length < 5
        ? `${entries.length} entries — a start, but thin`
        : entries.length < 10
        ? `${entries.length} entries — building up`
        : `${entries.length} entries — solid volume`,
    nextStep:
      entries.length >= 10
        ? null
        : `Log ${Math.max(1, 10 - entries.length)} more entries to strengthen your baseline`,
  });

  // ──── 2. Consistency: how regularly are you logging? ────
  const consistency = computeConsistency(entries);
  factors.push({
    id: 'consistency',
    label: 'Logging consistency',
    score: consistency.score,
    weight: 20,
    status: consistency.status,
    nextStep: consistency.nextStep,
  });

  // ──── 3. Symptom diversity: are you tracking multiple symptoms? ────
  const uniqueTags = stats.tag_frequency.filter(t => t.tag !== 'other').length;
  const diversityRaw = Math.min(uniqueTags / 4, 1); // 4+ distinct symptoms = full score
  factors.push({
    id: 'diversity',
    label: 'Symptom breadth',
    score: diversityRaw,
    weight: 15,
    status:
      uniqueTags === 0
        ? 'No symptoms tracked'
        : uniqueTags === 1
        ? '1 symptom — tracking more reveals patterns'
        : uniqueTags < 4
        ? `${uniqueTags} symptoms tracked`
        : `${uniqueTags} symptoms — good breadth`,
    nextStep:
      uniqueTags >= 4 ? null : 'Log different symptoms when they occur to show pattern breadth',
  });

  // ──── 4. Severity data: are severities varied and meaningful? ────
  const severityInfo = computeSeverityQuality(stats);
  factors.push({
    id: 'severity',
    label: 'Severity detail',
    score: severityInfo.score,
    weight: 15,
    status: severityInfo.status,
    nextStep: severityInfo.nextStep,
  });

  // ──── 5. Cycle correlation: is cycle day being tracked? ────
  const entriesWithCycle = entries.filter(e => e.cycle_day != null).length;
  const cycleRatio = entries.length > 0 ? entriesWithCycle / entries.length : 0;
  const cycleScore = Math.min(cycleRatio / 0.5, 1); // 50%+ of entries having cycle day = full
  factors.push({
    id: 'cycle',
    label: 'Cycle correlation',
    score: cycleScore,
    weight: 15,
    status:
      entriesWithCycle === 0
        ? 'No cycle days logged'
        : cycleRatio < 0.3
        ? `${entriesWithCycle} of ${entries.length} entries have cycle day`
        : 'Cycle day tracking active',
    nextStep:
      cycleScore >= 0.8 ? null : 'Adding cycle day to entries unlocks menstrual-cycle correlations',
  });

  // ──── 6. Time span: does the data cover enough time? ────
  const spanDays = computeSpanDays(entries);
  const spanScore = Math.min(spanDays / 28, 1); // 28+ days = full score
  factors.push({
    id: 'timespan',
    label: 'Time span covered',
    score: spanScore,
    weight: 15,
    status:
      spanDays === 0
        ? 'No data yet'
        : spanDays < 7
        ? `${spanDays} days — very short window`
        : spanDays < 14
        ? `${spanDays} days — emerging picture`
        : spanDays < 28
        ? `${spanDays} days — approaching a full cycle`
        : `${spanDays} days — covers ${Math.floor(spanDays / 7)} weeks`,
    nextStep:
      spanDays >= 28 ? null : `${28 - spanDays} more days of tracking to cover a full cycle`,
  });

  // ──── Compute weighted total ────
  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const weightedSum = factors.reduce((s, f) => s + f.score * f.weight, 0);
  const overallScore = Math.round((weightedSum / totalWeight) * 100);

  // ──── Top recommendation = highest-impact unfulfilled factor ────
  const unfulfilled = factors
    .filter(f => f.nextStep !== null)
    .sort((a, b) => {
      // sort by impact: weight × (1 - score) descending
      const impactA = a.weight * (1 - a.score);
      const impactB = b.weight * (1 - b.score);
      return impactB - impactA;
    });

  const tier = tierFor(overallScore);

  return {
    score: overallScore,
    tier,
    tierLabel: TIER_LABELS[tier],
    factors,
    topRecommendation: unfulfilled[0]?.nextStep ?? null,
  };
}

// ──── Helpers ────

function computeConsistency(entries: Entry[]): {
  score: number;
  status: string;
  nextStep: string | null;
} {
  if (entries.length < 2) {
    return {
      score: entries.length * 0.1,
      status: entries.length === 0 ? 'No entries' : 'Only 1 entry',
      nextStep: 'Log on a few different days to establish a pattern',
    };
  }

  const dayKeys = new Set(
    entries.map(e => new Date(e.created_at).toISOString().slice(0, 10))
  );
  const uniqueDays = dayKeys.size;
  const sorted = Array.from(dayKeys).sort();
  const firstDay = new Date(sorted[0]);
  const lastDay = new Date(sorted[sorted.length - 1]);
  const spanDays = Math.max(
    1,
    Math.ceil((lastDay.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24))
  );

  // ratio of days with entries to total span
  const ratio = Math.min(uniqueDays / Math.max(spanDays, 1), 1);

  // also check for large gaps
  let maxGap = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = Math.ceil(
      (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    maxGap = Math.max(maxGap, gap);
  }

  const gapPenalty = maxGap > 14 ? 0.3 : maxGap > 7 ? 0.15 : 0;
  const consistencyScore = Math.max(0, Math.min(ratio - gapPenalty, 1));

  return {
    score: consistencyScore,
    status:
      consistencyScore > 0.7
        ? `Logged on ${uniqueDays} of ${spanDays} days — very consistent`
        : consistencyScore > 0.4
        ? `Logged on ${uniqueDays} of ${spanDays} days`
        : maxGap > 14
        ? `${maxGap}-day gap detected — some data may be missed`
        : `Logged on ${uniqueDays} of ${spanDays} days — more regularity helps`,
    nextStep:
      consistencyScore > 0.7 ? null : 'Logging more regularly — even when symptoms are mild — removes gaps',
  };
}

function computeSeverityQuality(stats: ComputedStats): {
  score: number;
  status: string;
  nextStep: string | null;
} {
  const tagsWithSeverity = stats.severity_by_tag.filter(t => t.n >= 2);
  if (tagsWithSeverity.length === 0) {
    return {
      score: 0,
      status: 'No severity data yet',
      nextStep: 'Adjust severity when logging to show doctors how intense symptoms are',
    };
  }

  // Check if there's variance (not all the same severity)
  const allAvgs = tagsWithSeverity.map(t => t.avg_severity);
  const hasVariance = Math.max(...allAvgs) - Math.min(...allAvgs) > 0.5 || allAvgs.some(a => a !== 3);
  const hasMultipleTags = tagsWithSeverity.length >= 2;

  const score = (hasVariance ? 0.6 : 0.3) + (hasMultipleTags ? 0.4 : 0);

  return {
    score: Math.min(score, 1),
    status: hasVariance
      ? `Severity data on ${tagsWithSeverity.length} symptoms with meaningful variation`
      : `Severity tracked on ${tagsWithSeverity.length} symptoms — consider adjusting levels`,
    nextStep: score >= 0.8 ? null : 'Vary severity levels when intensity changes — it shows real fluctuation',
  };
}

function computeSpanDays(entries: Entry[]): number {
  if (entries.length < 2) return entries.length > 0 ? 1 : 0;
  const dates = entries.map(e => new Date(e.created_at).getTime());
  const min = Math.min(...dates);
  const max = Math.max(...dates);
  return Math.ceil((max - min) / (1000 * 60 * 60 * 24));
}

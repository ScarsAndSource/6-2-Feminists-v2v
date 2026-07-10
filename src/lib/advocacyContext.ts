import type { ComputedStats, VisitFollowup } from './types';
import { getTagLabel } from './tagLabels';

export interface AdvocacyStatsContext {
  entry_count: number;
  date_range: { start: string; end: string };
  top_tags: { label: string; count: number }[];
  notable_severity: { label: string; avg_severity: number; n: number }[];
  notable_co_occurrence: { label_a: string; label_b: string; lag_days_avg: number; n: number }[];
  coverage_gap: boolean;
}

export interface AdvocacyFollowupContext {
  tag_label: string | null;
  mentioned_before: boolean;
  outcome: string | null;
  outcome_note: string | null;
  visit_date: string | null;
}

// Deliberately separate from ComputedStats itself, rather than sending the
// raw shape used by generate-narrative: this pre-humanizes tag slugs (so
// e.g. "custom_jaw_tightness" becomes "Jaw Tightness" before the LLM ever
// sees it) without touching aggregation.ts's existing contract, which the
// Case File narration pipeline depends on unchanged.
export function buildAdvocacyStatsContext(stats: ComputedStats): AdvocacyStatsContext {
  return {
    entry_count: stats.entry_count,
    date_range: stats.date_range,
    top_tags: stats.tag_frequency
      .filter(t => t.tag !== 'other')
      .slice(0, 5)
      .map(t => ({ label: getTagLabel(t.tag), count: t.count })),
    notable_severity: stats.severity_by_tag
      .filter(s => !s.low_confidence)
      .slice(0, 5)
      .map(s => ({ label: getTagLabel(s.tag), avg_severity: s.avg_severity, n: s.n })),
    notable_co_occurrence: stats.co_occurrence
      .filter(c => !c.low_confidence && c.n >= 3)
      .slice(0, 3)
      .map(c => ({
        label_a: getTagLabel(c.tag_a),
        label_b: getTagLabel(c.tag_b),
        lag_days_avg: c.lag_days_avg,
        n: c.n
      })),
    coverage_gap: !!stats.coverage_gap_flag
  };
}

const OUTCOME_LABELS: Record<string, string> = {
  dismissed: 'dismissed / told it was likely nothing',
  tested: 'tested, with normal/inconclusive results',
  treated: 'treated, but the issue continued',
  no_follow_up: 'raised, with no clear next step given'
};

export function buildAdvocacyFollowupContext(followup: VisitFollowup): AdvocacyFollowupContext {
  return {
    tag_label: followup.related_tag ? getTagLabel(followup.related_tag) : null,
    mentioned_before: followup.mentioned_before,
    outcome: followup.outcome ? OUTCOME_LABELS[followup.outcome] || followup.outcome : null,
    outcome_note: followup.outcome_note,
    visit_date: followup.visit_date
  };
}

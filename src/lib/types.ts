export interface TagEntry {
  tag: string;
  severity: number;
  note?: string;
}

export interface Entry {
  id: string;
  user_id: string;
  tags: TagEntry[];
  cycle_day: number | null;
  created_at: string;
}

export interface ComputedStats {
  entry_count: number;
  date_range: { start: string; end: string };
  tag_frequency: { tag: string; count: number }[];
  severity_by_tag: { tag: string; avg_severity: number; n: number; low_confidence?: boolean }[];
  co_occurrence: { tag_a: string; tag_b: string; lag_days_avg: number; n: number; low_confidence?: boolean }[];
  cycle_day_correlation?: { tag: string; avg_cycle_day: number; n: number }[];
  coverage_gap_flag?: boolean;
  other_notes?: string[];
}

export interface PatternReport {
  id: string;
  user_id: string | null;
  computed_stats: ComputedStats;
  narrative: string;
  provider: 'groq' | 'gemini' | 'template';
  generated_at: string;
}

export type FollowupOutcome = 'dismissed' | 'tested' | 'treated' | 'no_follow_up';

export interface VisitFollowup {
  id: string;
  user_id: string;
  pattern_report_id: string | null;
  mentioned_before: boolean;
  outcome: FollowupOutcome | null;
  outcome_note: string | null;
  visit_date: string | null;
  created_at: string;
}

export interface CustomTag {
  id: string;
  user_id: string;
  label: string;
  source_note: string;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  next_appointment_at: string | null;
  updated_at: string;
}

export const TAG_VOCABULARY = [
  'pelvic_pain', 'joint_pain', 'fatigue', 'bloating', 'brain_fog', 'mood_change',
  'headache', 'nausea', 'back_pain', 'skin_change', 'hair_loss', 'sleep_disturbance',
  'digestive_issue', 'fever', 'dizziness', 'other'
] as const;

export const TAG_LABELS: Record<string, string> = {
  pelvic_pain: 'Pelvic pain',
  joint_pain: 'Joint pain',
  fatigue: 'Fatigue',
  bloating: 'Bloating',
  brain_fog: 'Brain fog',
  mood_change: 'Mood change',
  headache: 'Headache',
  nausea: 'Nausea',
  back_pain: 'Back pain',
  skin_change: 'Skin change',
  hair_loss: 'Hair loss',
  sleep_disturbance: 'Sleep disturbance',
  digestive_issue: 'Digestive issue',
  fever: 'Fever',
  dizziness: 'Dizziness',
  other: 'Other'
};

export const SEVERITY_LABELS: Record<number, string> = {
  1: 'Mild',
  2: 'Noticeable',
  3: 'Moderate',
  4: 'Severe',
  5: 'Unbearable'
};

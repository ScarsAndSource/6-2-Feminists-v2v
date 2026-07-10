import type { Entry, PeriodLog, DoctorFlag, DoctorRecommendation, FlagUrgency } from './types';
import { todayKey, daysBetweenKeys, dateKeyFromTimestamp, addDaysToKey } from './dateUtils';

const LOOKBACK_DAYS = 30;
const MIN_ENTRIES_FOR_PATTERN_FLAGS = 5;
const SEVERE_THRESHOLD = 4;
const SEVERE_PERSISTENCE_COUNT = 3;
const CHRONIC_FREQUENCY_RATIO = 0.5;
const ESCALATION_RUN_LENGTH = 4;
const CYCLE_LENGTH_VARIANCE_FLAG = 10;
const LATE_PERIOD_BUFFER_DAYS = 10;

const URGENT_KEYWORDS = [
  'fainted', 'fainting', 'passed out', 'blacked out',
  'soaking through', 'heavy bleeding', 'severe bleeding',
  "can't keep anything down", 'cant keep anything down', 'vomiting blood',
  'chest pain', "can't breathe", 'cant breathe', 'difficulty breathing',
  'high fever', 'severe fever',
  'worst pain', 'unbearable pain', "pain won't stop", "pain wont stop"
];

function containsUrgentKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return URGENT_KEYWORDS.some(k => lower.includes(k));
}

interface TagWindow {
  tag: string;
  occurrences: { date: string; severity: number }[];
}

function buildTagWindows(entries: Entry[], sinceDate: string): TagWindow[] {
  const map = new Map<string, TagWindow>();
  entries.forEach(e => {
    const day = dateKeyFromTimestamp(e.created_at);
    if (day < sinceDate) return;
    e.tags.forEach(t => {
      const w = map.get(t.tag) ?? { tag: t.tag, occurrences: [] };
      w.occurrences.push({ date: day, severity: t.severity });
      map.set(t.tag, w);
    });
  });
  map.forEach(w => w.occurrences.sort((a, b) => a.date.localeCompare(b.date)));
  return [...map.values()];
}

function plausibleAverageCycle(periodLogs: PeriodLog[]): number | null {
  const completed = periodLogs.filter(l => l.end_date).slice(0, 6);
  if (completed.length < 2) return null;
  const gaps: number[] = [];
  for (let i = 0; i < completed.length - 1; i++) {
    const g = Math.abs(daysBetweenKeys(completed[i].start_date, completed[i + 1].start_date));
    if (g >= 15 && g <= 60) gaps.push(g);
  }
  if (gaps.length === 0) return null;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

export function computeDoctorRecommendation(entries: Entry[], periodLogs: PeriodLog[]): DoctorRecommendation {
  const flags: DoctorFlag[] = [];
  const sinceDate = addDaysToKey(todayKey(), -LOOKBACK_DAYS);
  const entryCount = entries.length;
  const lowData = entryCount < MIN_ENTRIES_FOR_PATTERN_FLAGS;

  entries.forEach(e => {
    e.tags.forEach(t => {
      if (t.note && containsUrgentKeyword(t.note)) {
        flags.push({
          id: `urgent-note-${e.id}`,
          urgency: 'urgent',
          title: 'Something you described sounds serious',
          reason: `A note on your ${dateKeyFromTimestamp(e.created_at)} entry (around "${t.tag.replace(/_/g, ' ')}") described something worth same-day medical attention, not just tracking.`
        });
      }
    });
  });

  if (!lowData) {
    const windows = buildTagWindows(entries, sinceDate);
    const loggingDays = new Set(entries.map(e => dateKeyFromTimestamp(e.created_at)).filter(d => d >= sinceDate)).size;

    windows.forEach(w => {
      const severeCount = w.occurrences.filter(o => o.severity >= SEVERE_THRESHOLD).length;

      if (severeCount >= SEVERE_PERSISTENCE_COUNT) {
        flags.push({
          id: `severe-${w.tag}`,
          urgency: 'moderate',
          title: `Persistent severe ${w.tag.replace(/_/g, ' ')}`,
          reason: `Logged at severity ${SEVERE_THRESHOLD}+/5, ${severeCount} times in the last ${LOOKBACK_DAYS} days.`
        });
      }

      if (loggingDays >= 6 && severeCount < SEVERE_PERSISTENCE_COUNT) {
        const daysWithTag = new Set(w.occurrences.map(o => o.date)).size;
        if (daysWithTag / loggingDays >= CHRONIC_FREQUENCY_RATIO) {
          flags.push({
            id: `chronic-${w.tag}`,
            urgency: 'monitor',
            title: `${w.tag.replace(/_/g, ' ')} shows up often`,
            reason: `Present on ${daysWithTag} of the ${loggingDays} days you logged in the last ${LOOKBACK_DAYS} days - worth mentioning at your next visit, even if each instance felt mild.`
          });
        }
      }

      if (w.occurrences.length >= ESCALATION_RUN_LENGTH) {
        const last = w.occurrences.slice(-ESCALATION_RUN_LENGTH);
        const nonDecreasing = last.every((o, i) => i === 0 || o.severity >= last[i - 1].severity);
        if (nonDecreasing && last[last.length - 1].severity > last[0].severity) {
          flags.push({
            id: `escalating-${w.tag}`,
            urgency: 'moderate',
            title: `${w.tag.replace(/_/g, ' ')} has been getting worse`,
            reason: `Severity went from ${last[0].severity}/5 to ${last[last.length - 1].severity}/5 across your last ${ESCALATION_RUN_LENGTH} logs of this.`
          });
        }
      }
    });

    const multiTagDays = entries.filter(e => e.tags.length >= 3 && dateKeyFromTimestamp(e.created_at) >= sinceDate);
    if (multiTagDays.length >= 3) {
      flags.push({
        id: 'combo-symptoms',
        urgency: 'monitor',
        title: 'Multiple symptoms tend to cluster together',
        reason: `${multiTagDays.length} of your entries in the last ${LOOKBACK_DAYS} days logged 3+ symptoms at once - a doctor may want the full picture, not just individual symptoms.`
      });
    }
  }

  const completedCycles = periodLogs.filter(l => l.end_date).slice(0, 6);
  if (completedCycles.length >= 3) {
    const gaps: number[] = [];
    for (let i = 0; i < completedCycles.length - 1; i++) {
      gaps.push(Math.abs(daysBetweenKeys(completedCycles[i].start_date, completedCycles[i + 1].start_date)));
    }
    const plausible = gaps.filter(g => g >= 15 && g <= 60);
    if (plausible.length >= 2 && Math.max(...plausible) - Math.min(...plausible) >= CYCLE_LENGTH_VARIANCE_FLAG) {
      flags.push({
        id: 'cycle-irregular',
        urgency: 'monitor',
        title: 'Your cycle length has been varying',
        reason: `Recent cycles ranged from ${Math.min(...plausible)} to ${Math.max(...plausible)} days apart - worth mentioning if that's new for you.`
      });
    }
  }
  if (periodLogs.length > 0 && periodLogs[0].end_date !== null) {
    const daysSinceLastStart = daysBetweenKeys(periodLogs[0].start_date, todayKey());
    const avgLen = plausibleAverageCycle(periodLogs);
    if (avgLen && daysSinceLastStart > avgLen + LATE_PERIOD_BUFFER_DAYS) {
      flags.push({
        id: 'period-late',
        urgency: 'moderate',
        title: 'Your period looks late',
        reason: `It's been ${daysSinceLastStart} days since your last period started - ${daysSinceLastStart - avgLen} days past your usual ~${avgLen}-day cycle.`
      });
    }
  }

  const urgency: FlagUrgency | 'none' =
    flags.some(f => f.urgency === 'urgent') ? 'urgent' :
    flags.some(f => f.urgency === 'moderate') ? 'moderate' :
    flags.some(f => f.urgency === 'monitor') ? 'monitor' : 'none';

  const shouldVisit = urgency === 'urgent' || urgency === 'moderate';

  const headline =
    urgency === 'urgent' ? "Please see a doctor soon - this shouldn't wait." :
    urgency === 'moderate' ? "It's worth scheduling a visit." :
    urgency === 'monitor' ? "Nothing urgent - but worth mentioning at your next visit." :
    lowData ? "Not enough logs yet to say much - keep tracking." :
    "Nothing flagged in your recent logs. Keep going.";

  return { shouldVisit, urgency, flags, headline, entryCount, lowData };
}

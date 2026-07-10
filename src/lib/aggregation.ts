import type { Entry, ComputedStats } from './types';
import { getTagLabel } from './tagLabels';

const CO_OCCURRENCE_WINDOW_DAYS = 3;
const MIN_SAMPLE_SIZE = 3;
const COVERAGE_GAP_DAYS = 14;

export function computeStats(entries: Entry[]): ComputedStats {
  if (entries.length === 0) {
    return {
      entry_count: 0,
      date_range: { start: '', end: '' },
      tag_frequency: [],
      severity_by_tag: [],
      co_occurrence: [],
      coverage_gap_flag: false
    };
  }

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const dates = sortedEntries.map(e => new Date(e.created_at));
  const date_range = {
    start: dates[0].toISOString(),
    end: dates[dates.length - 1].toISOString()
  };

  // Tag frequency (excluding 'other' from ranking)
  const tagCounts = new Map<string, number>();
  const otherNotes: string[] = [];

  for (const entry of sortedEntries) {
    for (const tag of entry.tags) {
      if (tag.tag === 'other' && tag.note) {
        otherNotes.push(tag.note);
      }
      tagCounts.set(tag.tag, (tagCounts.get(tag.tag) || 0) + 1);
    }
  }

  const tag_frequency = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  // Severity by tag
  const severityByTag = new Map<string, { sum: number; n: number }>();

  for (const entry of sortedEntries) {
    for (const tag of entry.tags) {
      if (tag.tag === 'other') continue;
      const existing = severityByTag.get(tag.tag) || { sum: 0, n: 0 };
      severityByTag.set(tag.tag, {
        sum: existing.sum + tag.severity,
        n: existing.n + 1
      });
    }
  }

  const severity_by_tag = Array.from(severityByTag.entries())
    .map(([tag, { sum, n }]) => ({
      tag,
      avg_severity: Math.round((sum / n) * 10) / 10,
      n,
      low_confidence: n < MIN_SAMPLE_SIZE
    }))
    .sort((a, b) => b.n - a.n);

  // Co-occurrence patterns
  const co_occurrence = computeCoOccurrence(sortedEntries);

  // Cycle day correlation
  const entriesWithCycleDay = sortedEntries.filter(e => e.cycle_day != null);
  let cycle_day_correlation: ComputedStats['cycle_day_correlation'];

  if (entriesWithCycleDay.length >= MIN_SAMPLE_SIZE) {
    const cycleDayByTag = new Map<string, { sum: number; n: number }>();

    for (const entry of entriesWithCycleDay) {
      for (const tag of entry.tags) {
        if (tag.tag === 'other') continue;
        const existing = cycleDayByTag.get(tag.tag) || { sum: 0, n: 0 };
        cycleDayByTag.set(tag.tag, {
          sum: existing.sum + (entry.cycle_day || 0),
          n: existing.n + 1
        });
      }
    }

    cycle_day_correlation = Array.from(cycleDayByTag.entries())
      .filter(([, { n }]) => n >= MIN_SAMPLE_SIZE)
      .map(([tag, { sum, n }]) => ({
        tag,
        avg_cycle_day: Math.round((sum / n) * 10) / 10,
        n
      }))
      .sort((a, b) => b.n - a.n);
  }

  // Coverage gaps
  let coverage_gap_flag = false;
  for (let i = 1; i < dates.length; i++) {
    const daysDiff = Math.abs(
      (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff > COVERAGE_GAP_DAYS) {
      coverage_gap_flag = true;
      break;
    }
  }

  return {
    entry_count: entries.length,
    date_range,
    tag_frequency,
    severity_by_tag,
    co_occurrence,
    cycle_day_correlation,
    coverage_gap_flag,
    other_notes: otherNotes.length > 0 ? otherNotes : undefined
  };
}

function computeCoOccurrence(entries: Entry[]): ComputedStats['co_occurrence'] {
  const pairings = new Map<string, { lagSum: number; n: number }>();

  // Collect dates per tag, deduped to one entry per calendar day. Two
  // symptoms logged three times each on the same three days are one
  // "episode" of co-occurrence repeated three times, not nine cross-product
  // pairs - the day is the unit a patient (and a doctor) actually reasons
  // about.
  const tagDayMap = new Map<string, Set<string>>();

  for (const entry of entries) {
    const date = new Date(entry.created_at);
    const dayKey = date.toISOString().slice(0, 10);

    for (const tag of entry.tags) {
      if (tag.tag === 'other') continue;
      const days = tagDayMap.get(tag.tag) || new Set<string>();
      days.add(dayKey);
      tagDayMap.set(tag.tag, days);
    }
  }

  const tags = Array.from(tagDayMap.keys());
  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      const tagA = tags[i];
      const tagB = tags[j];

      const daysA = Array.from(tagDayMap.get(tagA) || [])
        .map(d => new Date(d))
        .sort((a, b) => a.getTime() - b.getTime());
      const daysB = Array.from(tagDayMap.get(tagB) || [])
        .map(d => new Date(d))
        .sort((a, b) => a.getTime() - b.getTime());

      // Greedy one-to-one nearest-match: each day A logs at most one
      // "co-occurrence episode" with a not-yet-claimed day B within the
      // window, instead of counting every possible pair.
      const usedB = new Set<number>();
      let lagSum = 0;
      let n = 0;

      for (const dateA of daysA) {
        let bestIdx = -1;
        let bestDiff = Infinity;

        for (let k = 0; k < daysB.length; k++) {
          if (usedB.has(k)) continue;
          const daysDiff = Math.abs(
            (dateA.getTime() - daysB[k].getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysDiff <= CO_OCCURRENCE_WINDOW_DAYS && daysDiff < bestDiff) {
            bestDiff = daysDiff;
            bestIdx = k;
          }
        }

        if (bestIdx !== -1) {
          usedB.add(bestIdx);
          lagSum += bestDiff;
          n += 1;
        }
      }

      if (n > 0) {
        const key = [tagA, tagB].sort().join('::');
        pairings.set(key, { lagSum, n });
      }
    }
  }

  return Array.from(pairings.entries())
    .map(([key, { lagSum, n }]) => {
      const [tag_a, tag_b] = key.split('::');
      return {
        tag_a,
        tag_b,
        lag_days_avg: Math.round((lagSum / n) * 10) / 10,
        n,
        low_confidence: n < MIN_SAMPLE_SIZE
      };
    })
    .filter(c => c.n >= 2)
    .sort((a, b) => b.n - a.n);
}

export function deterministicNarrative(stats: ComputedStats): string {
  if (stats.entry_count === 0) {
    return 'No symptom data has been logged yet. Start tracking to generate your Case File.';
  }

  const rankable = stats.tag_frequency.filter(t => t.tag !== 'other');
  const pool = rankable.length ? rankable : stats.tag_frequency;
  const sorted = [...pool].sort((a, b) => b.count - a.count);
  const top = sorted[0];

  if (!top) {
    return `No structured symptom data was logged in this period (${stats.entry_count} entries).`;
  }

  const lines: string[] = [];
  const topLabel = getTagLabel(top.tag);
  lines.push(
    `${topLabel} was logged ${top.count} time${top.count > 1 ? 's' : ''} across ${stats.entry_count} entries, more than any other tracked symptom.`
  );

  if (stats.entry_count < 10) {
    lines.push(
      `This is based on ${stats.entry_count} entries, a short tracking window. Longer tracking will make this more reliable.`
    );
  }

  if (stats.coverage_gap_flag) {
    lines.push(
      'There are gaps of more than two weeks between some entries, so this may not capture every day symptoms occurred.'
    );
  }

  const strongCoOccurrences = stats.co_occurrence.filter(
    c => c.n >= MIN_SAMPLE_SIZE && !c.low_confidence
  );

  for (const c of strongCoOccurrences.slice(0, 2)) {
    const tagA = getTagLabel(c.tag_a);
    const tagB = getTagLabel(c.tag_b);
    lines.push(
      `${tagA} and ${tagB} were logged within about ${c.lag_days_avg.toFixed(1)} days of each other, ${c.n} time${c.n > 1 ? 's' : ''}.`
    );
  }

  lines.push(
    'This summary was generated directly from your logged data. It is not a diagnosis.'
  );

  return lines.join(' ');
}

export function computeStreak(entries: Entry[]): number {
  if (entries.length === 0) return 0;

  const dayKeys = new Set(entries.map(e => new Date(e.created_at).toISOString().slice(0, 10)));

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  const todayKey = cursor.toISOString().slice(0, 10);
  if (!dayKeys.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dayKeys.has(cursor.toISOString().slice(0, 10))) return 0;
  }

  let streak = 0;
  while (dayKeys.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export type SeverityTrendDirection = 'rising' | 'falling' | 'steady';

export interface SeverityTrend {
  tag: string;
  direction: SeverityTrendDirection;
  earlyAvg: number;
  recentAvg: number;
}

export function computeSeverityTrend(entries: Entry[]): SeverityTrend | null {
  if (entries.length < 4) return null;

  const sorted = [...entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const mid = Math.floor(sorted.length / 2);
  const earlyHalf = sorted.slice(0, mid);
  const recentHalf = sorted.slice(mid);

  const tagCounts = new Map<string, number>();
  for (const e of sorted) {
    for (const t of e.tags) {
      if (t.tag === 'other') continue;
      tagCounts.set(t.tag, (tagCounts.get(t.tag) || 0) + 1);
    }
  }
  const topTag = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!topTag) return null;

  const avgFor = (subset: Entry[]) => {
    let sum = 0;
    let n = 0;
    for (const e of subset) {
      for (const t of e.tags) {
        if (t.tag !== topTag) continue;
        sum += t.severity;
        n += 1;
      }
    }
    return n > 0 ? sum / n : null;
  };

  const earlyAvg = avgFor(earlyHalf);
  const recentAvg = avgFor(recentHalf);
  if (earlyAvg == null || recentAvg == null) return null;

  const delta = recentAvg - earlyAvg;
  const direction: SeverityTrendDirection = delta > 0.4 ? 'rising' : delta < -0.4 ? 'falling' : 'steady';

  return {
    tag: topTag,
    direction,
    earlyAvg: Math.round(earlyAvg * 10) / 10,
    recentAvg: Math.round(recentAvg * 10) / 10
  };
}

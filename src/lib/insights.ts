import type { ComputedStats, Entry } from './types';
import { getTagLabel } from './tagLabels';
export interface DoctorFlag { id: string; text: string; }
export function doctorFlags(entries: Entry[], stats: ComputedStats): DoctorFlag[] {
  const flags: DoctorFlag[] = [];
  stats.severity_by_tag.filter(item => item.n >= 3 && item.avg_severity >= 4).forEach(item => flags.push({ id: `severity-${item.tag}`, text: `${getTagLabel(item.tag)} averaged ${item.avg_severity}/5 across ${item.n} logs. This is generally worth raising with a doctor.` }));
  stats.tag_frequency.filter(item => item.tag !== 'other' && item.count >= 5).forEach(item => flags.push({ id: `frequency-${item.tag}`, text: `${getTagLabel(item.tag)} was logged ${item.count} times. This is generally worth raising with a doctor.` }));
  if (stats.coverage_gap_flag) flags.push({ id: 'gap', text: 'There is a gap of more than two weeks in your tracking, so the record may understate what was happening. That context is generally worth raising with a doctor.' });
  if (entries.length >= 4) { const all = [...entries].sort((a, b) => a.created_at.localeCompare(b.created_at)); const mid = Math.floor(all.length / 2); const average = (group: Entry[]) => { const values = group.flatMap(entry => entry.tags.filter(tag => tag.tag !== 'other').map(tag => tag.severity)); return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }; const early = average(all.slice(0, mid)); const recent = average(all.slice(mid)); if (recent - early >= 1) flags.push({ id: 'rising', text: `Average logged severity rose from ${early.toFixed(1)}/5 in earlier entries to ${recent.toFixed(1)}/5 in recent entries. This is generally worth raising with a doctor.` }); }
  return flags.slice(0, 4);
}
export function fallbackSuggestions(stats: ComputedStats): string[] {
  const items: string[] = []; const top = stats.tag_frequency.find(item => item.tag !== 'other'); if (top) items.push(`${getTagLabel(top.tag)} is the most commonly logged symptom: ${top.count} of ${stats.entry_count} entries.`); const severity = stats.severity_by_tag.find(item => !item.low_confidence); if (severity) items.push(`${getTagLabel(severity.tag)} averages ${severity.avg_severity}/5 across ${severity.n} logs.`); const pair = stats.co_occurrence.find(item => !item.low_confidence && item.n >= 3); if (pair) items.push(`${getTagLabel(pair.tag_a)} and ${getTagLabel(pair.tag_b)} appeared within about ${pair.lag_days_avg.toFixed(0)} days of each other ${pair.n} times.`); if (stats.coverage_gap_flag) items.push('Your log includes a gap of more than two weeks, so this picture may be incomplete.'); return items.slice(0, 4);
}

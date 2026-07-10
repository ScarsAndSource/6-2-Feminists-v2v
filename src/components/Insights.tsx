import { useMemo } from 'react';
import {
  Crown, Link2, TrendingUp, TrendingDown, Minus, Sparkles,
} from 'lucide-react';
import { InsightCard } from './InsightCard';
import { EmptyStateIllustration } from './EmptyStateIllustration';
import { computeSeverityTrend } from '../lib/aggregation';
import { getTagLabel } from '../lib/tagLabels';
import type { ComputedStats, Entry } from '../lib/types';

interface InsightsProps {
  entries: Entry[];
  stats: ComputedStats;
}

export function Insights({ entries, stats }: InsightsProps) {
  const trend = useMemo(() => computeSeverityTrend(entries), [entries]);

  const topTag = stats.tag_frequency.find(t => t.tag !== 'other');
  const strongestPair = stats.co_occurrence.find(c => c.n >= 2);

  // zero-entry state
  if (entries.length === 0) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in text-center py-16">
        <EmptyStateIllustration variant="dormant-bud" />
        <h2 className="font-display text-xl font-semibold text-rose-800 mb-2">
          Insights appear here
        </h2>
        <p className="text-sm text-rose-500 max-w-xs mx-auto">
          Your first entry will start revealing patterns — come back after logging to see what shows up.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-rose-800">Insights</h2>
        <p className="text-sm text-rose-500 mt-0.5">
          Patterns and trends from everything you've logged
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* card 1 — most logged */}
        {topTag ? (
          <InsightCard
            icon={<Crown className="w-4.5 h-4.5 text-rose-500" />}
            label="Most logged"
            title={getTagLabel(topTag.tag)}
            body={`Logged ${topTag.count} ${topTag.count === 1 ? 'time' : 'times'} — this is your most-tracked symptom so far.`}
            index={0}
          />
        ) : (
          <InsightCard
            icon={<Crown className="w-4.5 h-4.5 text-rose-400" />}
            label="Most logged"
            title="Waiting on data"
            body="Log 2+ different symptoms to see which shows up most."
            footnote="Even one entry starts the count."
            index={0}
          />
        )}

        {/* card 2 — co-occurrence */}
        {strongestPair ? (
          <InsightCard
            icon={<Link2 className="w-4.5 h-4.5 text-rose-500" />}
            label={strongestPair.low_confidence ? 'Early pattern' : 'Often together'}
            title={`${getTagLabel(strongestPair.tag_a)} + ${getTagLabel(strongestPair.tag_b)}`}
            body={`These appeared within ${strongestPair.lag_days_avg.toFixed(0)} day${strongestPair.lag_days_avg === 1 ? '' : 's'} of each other, ${strongestPair.n} times.`}
            footnote={
              strongestPair.low_confidence
                ? 'Early pattern — log a few more days to confirm this link.'
                : undefined
            }
            index={1}
          />
        ) : (
          <InsightCard
            icon={<Link2 className="w-4.5 h-4.5 text-rose-400" />}
            label="Co-occurrence"
            title="Looking for links"
            body="Log 2+ different symptoms within a few days of each other to spot pairs."
            footnote="The engine checks which symptoms cluster together and how far apart they show up."
            index={1}
          />
        )}

        {/* card 3 — severity trend */}
        {trend ? (
          <InsightCard
            icon={
              trend.direction === 'rising' ? (
                <TrendingUp className="w-4.5 h-4.5 text-rose-500" />
              ) : trend.direction === 'falling' ? (
                <TrendingDown className="w-4.5 h-4.5 text-emerald-500" />
              ) : (
                <Minus className="w-4.5 h-4.5 text-rose-400" />
              )
            }
            label={`${getTagLabel(trend.tag)} trend`}
            title={
              trend.direction === 'rising'
                ? 'Severity is climbing'
                : trend.direction === 'falling'
                ? 'Severity is easing'
                : 'Holding steady'
            }
            body={
              trend.direction === 'rising'
                ? `Average severity moved from ${trend.earlyAvg} to ${trend.recentAvg} across your logs.`
                : trend.direction === 'falling'
                ? `Average severity dropped from ${trend.earlyAvg} to ${trend.recentAvg} — that's encouraging.`
                : `Staying around ${trend.recentAvg} on average, no significant shift yet.`
            }
            index={2}
          />
        ) : (
          <InsightCard
            icon={<TrendingUp className="w-4.5 h-4.5 text-rose-400" />}
            label="Severity trend"
            title="Need more logs"
            body="Log the same symptom on 4+ entries so the engine can compare your earlier logs to recent ones."
            footnote="This compares your first half of entries against the second half."
            index={2}
          />
        )}
      </div>

      {/* confidence footer */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/40 border border-rose-200/40 rounded-xl text-xs text-rose-400">
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span>
          Insights are computed locally from your logged data — no AI involved, no network calls.
          Accuracy improves with more entries.
        </span>
      </div>
    </div>
  );
}

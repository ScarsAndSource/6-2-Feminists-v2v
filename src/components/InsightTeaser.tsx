import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus, Link2, Crown } from 'lucide-react';
import type { ComputedStats, Entry } from '../lib/types';
import { computeSeverityTrend } from '../lib/aggregation';
import { getTagLabel } from '../lib/tagLabels';

interface InsightTeaserProps {
  entries: Entry[];
  stats: ComputedStats;
}

interface Insight {
  icon: ReactNode;
  title: string;
  body: string;
}

export function InsightTeaser({ entries, stats }: InsightTeaserProps) {
  const insights: Insight[] = [];

  const topTag = stats.tag_frequency.find(t => t.tag !== 'other');
  if (topTag) {
    insights.push({
      icon: <Crown className="w-4 h-4 text-rose-500" />,
      title: 'Most logged',
      body: `${getTagLabel(topTag.tag)}, ${topTag.count}x so far`
    });
  }

  const strongestPair = stats.co_occurrence.find(c => c.n >= 2);
  if (strongestPair) {
    insights.push({
      icon: <Link2 className="w-4 h-4 text-rose-500" />,
      title: strongestPair.low_confidence ? 'Early pattern' : 'Often together',
      body: `${getTagLabel(strongestPair.tag_a)} and ${getTagLabel(strongestPair.tag_b)}, ${strongestPair.n}x`
    });
  }

  const trend = computeSeverityTrend(entries);
  if (trend && insights.length < 2) {
    insights.push({
      icon:
        trend.direction === 'rising' ? (
          <TrendingUp className="w-4 h-4 text-rose-500" />
        ) : trend.direction === 'falling' ? (
          <TrendingDown className="w-4 h-4 text-rose-500" />
        ) : (
          <Minus className="w-4 h-4 text-rose-500" />
        ),
      title: `${getTagLabel(trend.tag)} trend`,
      body:
        trend.direction === 'rising'
          ? `Severity has climbed, ${trend.earlyAvg} -> ${trend.recentAvg}`
          : trend.direction === 'falling'
          ? `Severity has eased, ${trend.earlyAvg} -> ${trend.recentAvg}`
          : `Holding steady around ${trend.recentAvg}`
    });
  }

  if (insights.length === 0) return null;

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {insights.slice(0, 2).map((insight, i) => (
        <div
          key={i}
          className="bg-white/60 border border-rose-200/50 rounded-2xl px-4 py-3.5 rise-fade"
          style={{ animationDelay: `${i * 120}ms`, opacity: 0 }}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wide mb-1.5">
            {insight.icon}
            {insight.title}
          </div>
          <p className="text-sm text-rose-800">{insight.body}</p>
        </div>
      ))}
    </div>
  );
}

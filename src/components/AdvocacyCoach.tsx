import { useMemo, useState } from 'react';
import { ShieldAlert, ChevronDown } from 'lucide-react';
import { useFollowups } from '../hooks/useFollowups';
import { buildAdvocacyStatsContext, buildAdvocacyFollowupContext } from '../lib/advocacyContext';
import { getTagLabel } from '../lib/tagLabels';
import { AdvocacyChat } from './AdvocacyChat';
import { AdvocacyNote } from './AdvocacyNote';
import type { ComputedStats } from '../lib/types';

interface AdvocacyCoachProps {
  stats: ComputedStats;
}

// Only renders if there's at least one real "mentioned before" record —
// stays completely out of the way for anyone who hasn't logged a
// dismissal yet, keeping this from turning into an always-on chat surface.
export function AdvocacyCoach({ stats }: AdvocacyCoachProps) {
  const { followups, loading } = useFollowups();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const qualifying = useMemo(() => followups.filter(f => f.mentioned_before && f.outcome), [followups]);
  const selected = qualifying.find(f => f.id === selectedId) || qualifying[0] || null;

  if (loading || qualifying.length === 0 || !selected) return null;

  const statsContext = buildAdvocacyStatsContext(stats);
  const followupContext = buildAdvocacyFollowupContext(selected);

  return (
    <div className="mt-8 pt-8 border-t border-rose-200/50">
      <div className="flex items-center gap-2 mb-1.5">
        <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
        <h3 className="text-lg font-display font-semibold text-rose-900">Round Two</h3>
      </div>
      <p className="text-sm text-rose-600 mb-4">
        You've raised something before that didn't go anywhere. Practice pushing back with your real data, or draft a note to bring with you.
      </p>

      {qualifying.length > 1 && (
        <div className="relative mb-4">
          <select
            value={selected.id}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full appearance-none px-3.5 py-2.5 pr-10 bg-white/70 border border-rose-200 rounded-xl text-sm text-rose-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            {qualifying.map(f => (
              <option key={f.id} value={f.id}>
                {f.related_tag ? getTagLabel(f.related_tag) : 'General follow-up'} —{' '}
                {new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-rose-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      )}

      <div className="space-y-4">
        <AdvocacyChat tagLabel={followupContext.tag_label} outcomeLabel={followupContext.outcome} />
        <AdvocacyNote stats={statsContext} followup={followupContext} />
      </div>
    </div>
  );
}

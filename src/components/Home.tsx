import { useMemo } from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { TextReveal } from './TextReveal';
import { QuickLogCard } from './QuickLogCard';
import { StatsStrip } from './StatsStrip';
import { InsightTeaser } from './InsightTeaser';
import { EntryRow } from './EntryRow';
import { EmptyStateIllustration } from './EmptyStateIllustration';
import { computeStreak } from '../lib/aggregation';
import { estimateCurrentCycleDay } from '../lib/cyclePhase';
import { getAvgCycleLength } from '../lib/localFlags';
import type { ComputedStats, Entry, TagEntry } from '../lib/types';

const CASE_FILE_READY_THRESHOLD = 3;
const DEFAULT_STARTER_TAGS = ['fatigue', 'headache', 'bloating', 'mood_change'];

interface HomeProps {
  entries: Entry[];
  stats: ComputedStats;
  tagFrequency: Record<string, number>;
  addEntry: (tags: TagEntry[], cycleDay?: number) => Promise<Entry | void>;
  deleteEntry: (id: string) => Promise<void>;
  onNavigate: (tab: 'log' | 'timeline' | 'casefile') => void;
  loading?: boolean;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up?';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Winding down?';
}

export function Home({ entries, stats, tagFrequency, addEntry, deleteEntry, onNavigate, loading }: HomeProps) {
  const suggestedTags = useMemo(() => {
    const ranked = Object.entries(tagFrequency)
      .filter(([tag]) => tag !== 'other')
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
    const merged = [...ranked, ...DEFAULT_STARTER_TAGS.filter(t => !ranked.includes(t))];
    return merged.slice(0, 6);
  }, [tagFrequency]);

  const entriesThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return entries.filter(e => new Date(e.created_at).getTime() >= weekAgo).length;
  }, [entries]);

  const streak = useMemo(() => computeStreak(entries), [entries]);
  const cycleDay = useMemo(() => estimateCurrentCycleDay(entries, getAvgCycleLength()), [entries]);
  const recentEntries = entries.slice(0, 4);

  const handleQuickLog = (tag: string) => addEntry([{ tag, severity: 3 }]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-semibold text-rose-900">
          <TextReveal text={`${greeting()}.`} staggerMs={35} />
        </h1>
        <p className="text-rose-500 text-sm mt-1">
          {entries.length === 0
            ? "Nothing logged yet — start whenever you're ready, there's no wrong way to begin."
            : "Here's where things stand."}
        </p>
      </div>

      <QuickLogCard
        suggestedTags={suggestedTags}
        onQuickLog={handleQuickLog}
        onDelete={deleteEntry}
        onOpenFullLogger={() => onNavigate('log')}
        disabled={loading}
      />

      {entries.length > 0 && (
        <>
          <StatsStrip entriesThisWeek={entriesThisWeek} streak={streak} cycleDay={cycleDay} />

          <InsightTeaser entries={entries} stats={stats} />

          <div className="bg-white/40 border border-rose-200/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-rose-800">Recent entries</h3>
              <button
                onClick={() => onNavigate('timeline')}
                className="flex items-center gap-1 text-sm font-medium text-rose-400 hover:text-rose-600 transition-colors"
              >
                View all
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              {recentEntries.map((entry, i) => (
                <EntryRow key={entry.id} entry={entry} index={i} onDelete={deleteEntry} compact />
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('casefile')}
            className="w-full text-left bg-gradient-to-r from-rose-500 to-rose-600 rounded-2xl p-5 sm:p-6 text-white shadow-glow-soft hover:shadow-glow transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold">
                  {entries.length >= CASE_FILE_READY_THRESHOLD
                    ? 'Your Case File is ready to generate'
                    : `${CASE_FILE_READY_THRESHOLD - entries.length} more entr${
                        CASE_FILE_READY_THRESHOLD - entries.length === 1 ? 'y' : 'ies'
                      } for a richer Case File`}
                </h3>
                <p className="text-rose-100 text-sm mt-0.5">
                  {entries.length >= CASE_FILE_READY_THRESHOLD
                    ? "A clinical summary built from everything you've logged"
                    : 'Or generate now — it works from what you have, this just makes it stronger'}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0 opacity-70 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </>
      )}

      {entries.length === 0 && (
        <div className="text-center py-8">
          <EmptyStateIllustration variant="seedling" />
          <p className="text-sm text-rose-400 max-w-xs mx-auto">
            Your weekly trends, streak, and first insights will show up right here after your first entry.
          </p>
        </div>
      )}
    </div>
  );
}

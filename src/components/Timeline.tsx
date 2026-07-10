import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { List, Grid3X3, Clock, Trash2 } from 'lucide-react';
import type { Entry } from '../lib/types';
import { EntryRow } from './EntryRow';
import { TimelineHeatmap } from './TimelineHeatmap';
import { EmptyStateIllustration } from './EmptyStateIllustration';

type ViewMode = 'list' | 'heatmap';

interface TimelineProps {
  entries: Entry[];
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
}

export function Timeline({ entries, onDelete, loading }: TimelineProps) {
  const [view, setView] = useState<ViewMode>('heatmap');

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [entries]
  );

  if (entries.length === 0) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="text-center py-16">
          <EmptyStateIllustration variant="dormant-bud" />
          <h2 className="font-display text-xl font-semibold text-rose-800 mb-2">
            Your timeline starts here
          </h2>
          <p className="text-sm text-rose-500 max-w-xs mx-auto">
            Log your first entry and the heatmap will begin filling in
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-5">
      {/* header + view toggle */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-rose-800">Timeline</h2>
          <p className="text-sm text-rose-500 mt-0.5">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} logged
          </p>
        </div>
        <div className="flex items-center bg-rose-100/70 rounded-xl p-0.5 border border-rose-200/50">
          <ToggleButton
            active={view === 'heatmap'}
            onClick={() => setView('heatmap')}
            icon={<Grid3X3 className="w-4 h-4" />}
            label="Heatmap"
          />
          <ToggleButton
            active={view === 'list'}
            onClick={() => setView('list')}
            icon={<List className="w-4 h-4" />}
            label="List"
          />
        </div>
      </div>

      {/* content */}
      {view === 'heatmap' && (
        <motion.div
          key="heatmap"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white/50 border border-rose-200/50 rounded-2xl p-6 overflow-x-auto"
        >
          <TimelineHeatmap entries={entries} />
        </motion.div>
      )}

      {view === 'list' && (
        <motion.div
          key="list"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative"
        >
          {/* timeline spine */}
          <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gradient-to-b from-rose-300 via-rose-200/60 to-transparent" />

          <div className="space-y-3">
            {sortedEntries.map((entry, i) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                index={i}
                onDelete={onDelete}
                loading={loading}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 z-10 ${
        active ? 'text-white' : 'text-rose-400 hover:text-rose-600'
      }`}
    >
      {active && (
        <motion.div
          layoutId="timelineViewPill"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-rose-500 to-rose-600 rounded-lg shadow-sm"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

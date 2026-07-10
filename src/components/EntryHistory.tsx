import { motion } from 'framer-motion';
import { Clock, Trash2 } from 'lucide-react';
import type { Entry } from '../lib/types';
import { getTagLabel } from '../lib/tagLabels';
import { EmptyStateIllustration } from './EmptyStateIllustration';

interface EntryHistoryProps {
  entries: Entry[];
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
}

export function EntryHistory({ entries, onDelete, loading }: EntryHistoryProps) {
  const formatDate = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <EmptyStateIllustration variant="seedling" />
        <p className="text-base text-rose-600 mb-1 font-semibold">No entries yet</p>
        <p className="text-sm text-rose-400">Your logged symptoms will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium text-slate-400">
          <Clock className="w-4 h-4" />
          Recent Entries
        </h3>
        <span className="text-xs text-slate-600 px-2 py-1 bg-slate-800/30 rounded-md">
          {entries.length} total
        </span>
      </div>

      <div className="relative max-h-[480px] overflow-y-auto pr-1">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-rose-200 via-rose-200/60 to-transparent" />
        <div className="space-y-3">
          {entries.slice(0, 8).map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06, duration: 0.4 }}
              className="relative pl-9"
            >
              <div className="absolute left-[10px] top-4 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 ring-4 ring-rose-50" />

              <div className="group bg-white/60 hover:bg-white border border-rose-200/50 hover:border-rose-300/60 rounded-2xl p-3.5 transition-all duration-300 hover:shadow-soft shimmer-overlay">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm text-rose-400 mb-2 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(entry.created_at)}
                      {entry.cycle_day && (
                        <span className="text-rose-500 font-semibold">· Day {entry.cycle_day}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {entry.tags.map((t, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-rose-50 to-blush-50 rounded-lg text-sm font-semibold border border-rose-100"
                        >
                          {t.tag === 'other' ? (
                            <span className="text-blush-600 italic truncate max-w-[100px]">
                              "{t.note?.slice(0, 10)}..."
                            </span>
                          ) : (
                            <>
                              <span className="text-rose-800">{getTagLabel(t.tag)}</span>
                              <span className="text-rose-500 font-bold">{t.severity}</span>
                            </>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onDelete(entry.id)}
                    disabled={loading}
                    className="p-1.5 rounded-lg text-rose-300 hover:text-blush-600 hover:bg-blush-400/10 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {entries.length > 8 && (
        <div className="text-center pt-2">
          <span className="text-xs text-slate-600">
            Showing 8 most recent of {entries.length} entries
          </span>
        </div>
      )}
    </div>
  );
}

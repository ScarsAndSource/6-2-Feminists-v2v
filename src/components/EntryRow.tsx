import { motion } from 'framer-motion';
import { Clock, Trash2 } from 'lucide-react';
import type { Entry } from '../lib/types';
import { getTagLabel } from '../lib/tagLabels';

interface EntryRowProps {
  entry: Entry;
  index: number;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
  compact?: boolean;
}

function formatEntryDate(iso: string): string {
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
}

export function EntryRow({ entry, index, onDelete, loading, compact }: EntryRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="relative pl-9"
    >
      <div className="absolute left-[10px] top-4 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 ring-4 ring-rose-50" />
      <div
        className={`${entry.user_id === 'optimistic' ? 'animate-pulse' : ''} bg-white/60 hover:bg-white border border-rose-200/50 hover:border-rose-300/60 rounded-2xl transition-all duration-300 hover:shadow-soft shimmer-overlay ${
          compact ? 'p-3' : 'p-3.5'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm text-rose-400 mb-2 font-medium">
              <Clock className="w-3.5 h-3.5" />
              {formatEntryDate(entry.created_at)}
              {entry.cycle_day && <span className="text-rose-500 font-semibold">· Day {entry.cycle_day}</span>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.map((t, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-rose-50 to-blush-50 rounded-lg text-sm font-semibold border border-rose-100"
                >
                  {t.tag === 'other' ? (
                    <span className="text-blush-600 italic truncate max-w-[100px]">"{t.note?.slice(0, 10)}..."</span>
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
            className="p-1.5 rounded-lg text-rose-300/60 hover:text-blush-600 hover:bg-blush-400/10 transition-all active:scale-90"
            title="Delete entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

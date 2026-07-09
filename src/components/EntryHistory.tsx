import { Clock, Trash2 } from 'lucide-react';
import type { Entry } from '../lib/types';
import { TAG_LABELS } from '../lib/types';

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

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-white/60 border border-rose-200/50 flex items-center justify-center shadow-soft float-element">
          <Clock className="w-8 h-8 text-rose-300" />
        </div>
        <p className="text-sm text-rose-500 mb-1 font-medium">No entries yet</p>
        <p className="text-xs text-rose-400">
          Your logged symptoms will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-rose-500">
          <Clock className="w-4 h-4" />
          Recent Entries
        </h3>
        <span className="text-xs text-rose-400 px-2.5 py-1 bg-white/60 rounded-full border border-rose-200/50 font-medium">
          {entries.length} total
        </span>
      </div>

      {/* Entries List */}
      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {entries.slice(0, 8).map((entry, index) => (
          <div
            key={entry.id}
            className="group bg-white/60 hover:bg-white border border-rose-200/50 hover:border-rose-300/60 rounded-2xl p-3.5 transition-all duration-300 stagger-item hover:shadow-soft hover:translate-x-1 shimmer-overlay"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {entry.tags.map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-rose-50 to-blush-50 rounded-lg text-xs font-semibold border border-rose-100"
                    >
                      {t.tag === 'other' ? (
                        <span className="text-blush-600 italic truncate max-w-[80px]">
                          "{t.note?.slice(0, 10)}..."
                        </span>
                      ) : (
                        <>
                          <span className="text-rose-800">
                            {TAG_LABELS[t.tag]}
                          </span>
                          <span className="text-rose-500 font-bold">
                            {t.severity}
                          </span>
                        </>
                      )}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-rose-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(entry.created_at)}
                  </span>
                  {entry.cycle_day && (
                    <span className="flex items-center gap-1 text-rose-500 font-medium">
                      Day {entry.cycle_day}
                    </span>
                  )}
                </div>
              </div>

              {/* Delete Button */}
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
        ))}
      </div>

      {/* Show More */}
      {entries.length > 8 && (
        <div className="text-center pt-2">
          <span className="text-xs text-rose-400">
            Showing 8 most recent of {entries.length} entries
          </span>
        </div>
      )}
    </div>
  );
}

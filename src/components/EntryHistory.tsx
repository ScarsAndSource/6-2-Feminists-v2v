import { Clock, Trash2, Calendar } from 'lucide-react';
import type { Entry } from '../lib/types';
import { getTagLabel } from '../lib/tagLabels';

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
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
          <Clock className="w-7 h-7 text-slate-600" />
        </div>
        <p className="text-sm text-slate-500 mb-1">No entries yet</p>
        <p className="text-xs text-slate-600">Your logged symptoms will appear here</p>
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

      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {entries.slice(0, 8).map((entry, index) => (
          <div
            key={entry.id}
            className="group bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30 hover:border-slate-700/50 rounded-xl p-3 transition-all stagger-item"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {entry.tags.map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 rounded-md text-xs font-medium"
                    >
                      {t.tag === 'other' ? (
                        <span className="text-coral-400 italic truncate max-w-[80px]">
                          "{t.note?.slice(0, 10)}..."
                        </span>
                      ) : (
                        <>
                          <span className="text-slate-300">{getTagLabel(t.tag)}</span>
                          <span className="text-teal-400">{t.severity}</span>
                        </>
                      )}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(entry.created_at)}
                  </span>
                  {entry.cycle_day && (
                    <span className="flex items-center gap-1 text-teal-500/80">
                      <Calendar className="w-3 h-3" />
                      Day {entry.cycle_day}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDelete(entry.id)}
                disabled={loading}
                className="p-1.5 rounded-lg text-slate-600 hover:text-coral-400 hover:bg-coral-500/10 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
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

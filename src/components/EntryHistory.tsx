import { Clock } from 'lucide-react';
import type { Entry } from '../lib/types';
import { EmptyStateIllustration } from './EmptyStateIllustration';
import { EntryRow } from './EntryRow';

interface EntryHistoryProps {
  entries: Entry[];
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
}

export function EntryHistory({ entries, onDelete, loading }: EntryHistoryProps) {
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
        <h3 className="flex items-center gap-2 text-sm font-medium text-rose-500">
          <Clock className="w-4 h-4" />
          Recent Entries
        </h3>
        <span className="text-xs text-rose-400 px-2 py-1 bg-rose-100/50 rounded-md">{entries.length} total</span>
      </div>

      <div className="relative max-h-[480px] overflow-y-auto pr-1">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-rose-200 via-rose-200/60 to-transparent" />
        <div className="space-y-3">
          {entries.slice(0, 8).map((entry, index) => (
            <EntryRow key={entry.id} entry={entry} index={index} onDelete={onDelete} loading={loading} />
          ))}
        </div>
      </div>

      {entries.length > 8 && (
        <div className="text-center pt-2">
          <span className="text-xs text-rose-400">Showing 8 most recent of {entries.length} entries</span>
        </div>
      )}
    </div>
  );
}

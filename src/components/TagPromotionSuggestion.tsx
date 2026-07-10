import { useMemo, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { findTagPromotionSuggestion } from '../lib/fuzzyMatch';
import { useCustomTags } from '../hooks/useCustomTags';
import type { Entry } from '../lib/types';

interface TagPromotionSuggestionProps {
  entries: Entry[];
}

export function TagPromotionSuggestion({ entries }: TagPromotionSuggestionProps) {
  const { customTags, addCustomTag } = useCustomTags();
  const [dismissedNote, setDismissedNote] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const suggestion = useMemo(
    () => findTagPromotionSuggestion(entries, customTags.map(t => t.source_note)),
    [entries, customTags]
  );

  if (!suggestion || suggestion.representativeNote === dismissedNote) return null;

  const displayLabel = suggestion.representativeNote
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const handleAdd = async () => {
    setAdding(true);
    try {
      await addCustomTag(displayLabel, suggestion.representativeNote);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 bg-teal-500/10 border border-teal-500/20 rounded-xl px-4 py-3 mb-4 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-teal-200">
        <Sparkles className="w-4 h-4 shrink-0" />
        <span>
          You've described "{suggestion.representativeNote}" {suggestion.count} times — add it as a tag you can track?
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleAdd}
          disabled={adding}
          className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
        >
          {adding ? 'Adding...' : 'Add tag'}
        </button>
        <button onClick={() => setDismissedNote(suggestion.representativeNote)} className="text-teal-300/60 hover:text-teal-200">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

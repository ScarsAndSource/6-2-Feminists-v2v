import { useState } from 'react';
import type { ComfortSuggestion } from '../lib/comfortSuggestions';
import { storageGet, storageSet } from '../lib/storage';
import { Icon } from './Icon';
const KEY = 'tried_suggestions';
export function ComfortSuggestions({ suggestions }: { suggestions: ComfortSuggestion[] }) {
  const [tried, setTried] = useState<Record<string, number>>(() => storageGet(KEY, {})); if (!suggestions.length) return null;
  const markTried = (id: string) => { const next = { ...tried, [id]: (tried[id] ?? 0) + 1 }; storageSet(KEY, next); setTried(next); };
  return <section className="glass mt-5 rounded-3xl p-6"><h2 className="flex items-center gap-2 font-display text-xl italic text-rose-800"><Icon name="spa" />A few comfort ideas for today</h2><p className="mt-1 text-xs text-rose-950/55">General self-care ideas based on what you logged. Not medical advice.</p><div className="mt-5 space-y-3">{suggestions.map(suggestion => <div key={suggestion.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white/55 px-4 py-3"><span className="text-sm text-rose-950/80">{suggestion.text}</span>{tried[suggestion.id] ? <span className="inline-flex shrink-0 items-center gap-1 text-xs text-rose-600"><Icon name="check_circle" size={16} filled />Tried{tried[suggestion.id] > 1 ? ` ${tried[suggestion.id]}×` : ''}</span> : <button onClick={() => markTried(suggestion.id)} className="shrink-0 rounded-full bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-200">I’ll give it a try</button>}</div>)}</div></section>;
}

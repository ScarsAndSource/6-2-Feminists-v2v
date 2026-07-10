import { useState, useCallback, useEffect } from 'react';
import type { Entry, TagEntry } from '../lib/types';
import { onStorageChange, storageGet, storageSet } from '../lib/storage';
const KEY = 'entries';
const sort = (entries: Entry[]) => [...entries].sort((a, b) => b.created_at.localeCompare(a.created_at));
export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>(() => sort(storageGet<Entry[]>(KEY, [])));
  useEffect(() => onStorageChange(KEY, () => setEntries(sort(storageGet<Entry[]>(KEY, [])))), []);
  const addEntry = useCallback(async (tags: TagEntry[], cycleDay?: number) => { const entry: Entry = { id: crypto.randomUUID(), user_id: 'local', tags, cycle_day: cycleDay ?? null, created_at: new Date().toISOString() }; const next = sort([entry, ...storageGet<Entry[]>(KEY, [])]); if (!storageSet(KEY, next)) throw new Error('Your browser could not save this entry. Check available storage and try again.'); setEntries(next); return entry; }, []);
  const deleteEntry = useCallback(async (id: string) => { const next = storageGet<Entry[]>(KEY, []).filter(entry => entry.id !== id); storageSet(KEY, next); setEntries(sort(next)); }, []);
  const refetch = useCallback(async () => setEntries(sort(storageGet<Entry[]>(KEY, []))), []);
  return { entries, loading: false, error: null, addEntry, deleteEntry, refetch };
}

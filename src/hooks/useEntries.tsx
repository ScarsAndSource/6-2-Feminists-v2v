/**
 * useEntries — localStorage-backed, no authentication required.
 *
 * Entries are stored as JSON under the key "undismissed:entries" in
 * localStorage. Every write is fire-and-forget; the UI is always updated
 * optimistically via React state before localStorage is touched.
 */
import { useState, useCallback, useEffect } from 'react';
import type { Entry, TagEntry } from '../lib/types';

const STORAGE_KEY = 'undismissed:entries';

function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: Entry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // storage full / unavailable — fail silently
  }
}

function makeId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries());
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // Persist whenever entries change
  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  const addEntry = useCallback(async (tags: TagEntry[], cycleDay?: number): Promise<Entry> => {
    const entry: Entry = {
      id: makeId(),
      user_id: 'local',
      tags,
      cycle_day: cycleDay ?? null,
      created_at: new Date().toISOString(),
    };
    setEntries(prev => {
      const next = [entry, ...prev];
      saveEntries(next);
      return next;
    });
    return entry;
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    setEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      saveEntries(next);
      return next;
    });
  }, []);

  const fetchEntries = useCallback(async () => {
    setEntries(loadEntries());
  }, []);

  return {
    entries,
    loading,
    error,
    addEntry,
    deleteEntry,
    refetch: fetchEntries,
  };
}

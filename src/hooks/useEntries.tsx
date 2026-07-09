import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Entry, TagEntry } from '../lib/types';

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setEntries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch entries');
      console.error('Failed to fetch entries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = useCallback(
    async (tags: TagEntry[], cycleDay?: number) => {
      try {
        const { data, error: insertError } = await supabase
          .from('entries')
          .insert({ tags, cycle_day: cycleDay ?? null })
          .select()
          .single();

        if (insertError) throw insertError;

        setEntries(prev => [data, ...prev]);
        return data;
      } catch (err) {
        console.error('Failed to add entry:', err);
        throw err;
      }
    },
    []
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      try {
        const { error: deleteError } = await supabase
          .from('entries')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        setEntries(prev => prev.filter(e => e.id !== id));
      } catch (err) {
        console.error('Failed to delete entry:', err);
        throw err;
      }
    },
    []
  );

  return {
    entries,
    loading,
    error,
    addEntry,
    deleteEntry,
    refetch: fetchEntries
  };
}

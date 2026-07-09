import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Entry } from '../lib/types';

export function useDemoEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchDemoEntries = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke<{ entries: Entry[] }>(
        'get-demo-entries'
      );
      if (fnError) throw fnError;
      setEntries(data?.entries ?? []);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample data');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  return { entries, loading, error, loaded, fetchDemoEntries };
}

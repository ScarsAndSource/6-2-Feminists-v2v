import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { CustomTag } from '../lib/types';

export function useCustomTags() {
  const [customTags, setCustomTags] = useState<CustomTag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomTags = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('custom_tags')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error) setCustomTags(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomTags();
  }, [fetchCustomTags]);

  const addCustomTag = useCallback(async (label: string, sourceNote: string) => {
    const { data, error } = await supabase
      .from('custom_tags')
      .insert({ label: label.trim(), source_note: sourceNote })
      .select()
      .single();
    if (error) throw error;
    setCustomTags(prev => [...prev, data]);
    return data;
  }, []);

  return { customTags, loading, addCustomTag, refetch: fetchCustomTags };
}

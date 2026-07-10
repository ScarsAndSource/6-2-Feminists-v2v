import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { CustomTag } from '../lib/types';

export function useCustomTags() {
  const { user, loading: authLoading } = useAuth();
  const [customTags, setCustomTags] = useState<CustomTag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomTags = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('custom_tags')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error) setCustomTags(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      fetchCustomTags();
    } else {
      setCustomTags([]);
      setLoading(false);
    }
  }, [fetchCustomTags, user, authLoading]);

  const addCustomTag = useCallback(async (label: string, sourceNote: string) => {
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase
      .from('custom_tags')
      .insert({ user_id: user.id, label: label.trim(), source_note: sourceNote })
      .select()
      .single();
    if (error) throw error;
    setCustomTags(prev => [...prev, data]);
    return data;
  }, [user]);

  return { customTags, loading, addCustomTag, refetch: fetchCustomTags };
}

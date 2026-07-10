import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { UserSettings } from '../lib/types';

export function useUserSettings() {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('user_settings').select('*').maybeSingle();
    if (!error) setSettings(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      fetchSettings();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [fetchSettings, user, authLoading]);

  const setNextAppointment = useCallback(async (dateIso: string | null) => {
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, next_appointment_at: dateIso, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    setSettings(data);
    return data;
  }, [user]);

  return { settings, loading, setNextAppointment };
}

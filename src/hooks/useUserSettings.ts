import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { UserSettings } from '../lib/types';

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('user_settings').select('*').maybeSingle();
    if (!error) setSettings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const setNextAppointment = useCallback(async (dateIso: string | null) => {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({ next_appointment_at: dateIso }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    setSettings(data);
    return data;
  }, []);

  return { settings, loading, setNextAppointment };
}

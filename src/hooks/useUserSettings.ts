/**
 * useUserSettings — localStorage-backed, no authentication required.
 *
 * Stores user settings (next_appointment_at) locally.
 * Preserves the exact same hook API so AppointmentPrompt.tsx and App.tsx
 * need no modifications.
 */
import { useState, useCallback, useEffect } from 'react';
import type { UserSettings } from '../lib/types';

const STORAGE_KEY = 'undismissed:user_settings';

function load(): UserSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSettings;
  } catch {
    return null;
  }
}

function save(settings: UserSettings | null) {
  try {
    if (settings == null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  } catch {
    // ignore
  }
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(() => load());
  const [loading] = useState(false);

  useEffect(() => {
    save(settings);
  }, [settings]);

  const setNextAppointment = useCallback(async (dateIso: string | null): Promise<UserSettings> => {
    const updated: UserSettings = {
      user_id: 'local',
      next_appointment_at: dateIso,
      updated_at: new Date().toISOString(),
    };
    setSettings(updated);
    save(updated);
    return updated;
  }, []);

  return { settings, loading, setNextAppointment };
}

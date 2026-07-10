/**
 * useCustomTags — localStorage-backed, no authentication required.
 */
import { useState, useCallback, useEffect } from 'react';
import type { CustomTag } from '../lib/types';

const STORAGE_KEY = 'undismissed:custom_tags';

function load(): CustomTag[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(tags: CustomTag[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
  } catch {
    // ignore
  }
}

function makeId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useCustomTags() {
  const [customTags, setCustomTags] = useState<CustomTag[]>(() => load());
  const [loading] = useState(false);

  useEffect(() => {
    save(customTags);
  }, [customTags]);

  const addCustomTag = useCallback(async (label: string, sourceNote: string): Promise<CustomTag> => {
    const tag: CustomTag = {
      id: makeId(),
      user_id: 'local',
      label: label.trim(),
      source_note: sourceNote,
      created_at: new Date().toISOString(),
    };
    setCustomTags(prev => {
      const next = [...prev, tag];
      save(next);
      return next;
    });
    return tag;
  }, []);

  const refetch = useCallback(async () => {
    setCustomTags(load());
  }, []);

  return { customTags, loading, addCustomTag, refetch };
}

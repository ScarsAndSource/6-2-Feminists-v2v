/**
 * useFollowups — localStorage-backed, no authentication required.
 *
 * Follow-up ledger entries are stored as JSON under "undismissed:followups".
 * Preserves the exact same hook API so FollowupLedger.tsx needs no changes.
 */
import { useState, useCallback, useEffect } from 'react';
import type { VisitFollowup, FollowupOutcome } from '../lib/types';

const STORAGE_KEY = 'undismissed:followups';

function load(): VisitFollowup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(followups: VisitFollowup[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(followups));
  } catch {
    // ignore
  }
}

function makeId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useFollowups() {
  const [followups, setFollowups] = useState<VisitFollowup[]>(() => load());
  const [loading] = useState(false);

  useEffect(() => {
    save(followups);
  }, [followups]);

  const fetchFollowups = useCallback(async () => {
    setFollowups(load());
  }, []);

  const addFollowup = useCallback(
    async (params: {
      patternReportId: string | null;
      mentionedBefore: boolean;
      outcome: FollowupOutcome | null;
      outcomeNote?: string;
      visitDate?: string;
      relatedTag?: string;
    }): Promise<VisitFollowup> => {
      const entry: VisitFollowup = {
        id: makeId(),
        user_id: 'local',
        pattern_report_id: params.patternReportId,
        mentioned_before: params.mentionedBefore,
        outcome: params.outcome,
        outcome_note: params.outcomeNote || null,
        visit_date: params.visitDate || null,
        related_tag: params.relatedTag || null,
        created_at: new Date().toISOString(),
      };
      setFollowups(prev => {
        const next = [entry, ...prev];
        save(next);
        return next;
      });
      return entry;
    },
    []
  );

  return { followups, loading, addFollowup, refetch: fetchFollowups };
}

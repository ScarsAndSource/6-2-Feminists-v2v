import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { VisitFollowup, FollowupOutcome } from '../lib/types';

export function useFollowups() {
  const [followups, setFollowups] = useState<VisitFollowup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('visit_followups')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setFollowups(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  const addFollowup = useCallback(
    async (params: {
      patternReportId: string | null;
      mentionedBefore: boolean;
      outcome: FollowupOutcome | null;
      outcomeNote?: string;
      visitDate?: string;
      relatedTag?: string;
    }) => {
      const { data, error } = await supabase
        .from('visit_followups')
        .insert({
          pattern_report_id: params.patternReportId,
          mentioned_before: params.mentionedBefore,
          outcome: params.outcome,
          outcome_note: params.outcomeNote || null,
          visit_date: params.visitDate || null,
          related_tag: params.relatedTag || null
        })
        .select()
        .single();
      if (error) throw error;
      setFollowups(prev => [data, ...prev]);
      return data;
    },
    []
  );

  return { followups, loading, addFollowup, refetch: fetchFollowups };
}

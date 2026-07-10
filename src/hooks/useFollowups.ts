import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { VisitFollowup, FollowupOutcome } from '../lib/types';

export function useFollowups() {
  const { user, loading: authLoading } = useAuth();
  const [followups, setFollowups] = useState<VisitFollowup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('visit_followups')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setFollowups(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      fetchFollowups();
    } else {
      setFollowups([]);
      setLoading(false);
    }
  }, [fetchFollowups, user, authLoading]);

  const addFollowup = useCallback(
    async (params: {
      patternReportId: string | null;
      mentionedBefore: boolean;
      outcome: FollowupOutcome | null;
      outcomeNote?: string;
      visitDate?: string;
      relatedTag?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('visit_followups')
        .insert({
          user_id: user.id,
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
    [user]
  );

  return { followups, loading, addFollowup, refetch: fetchFollowups };
}

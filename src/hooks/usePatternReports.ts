import { useCallback, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { PatternReport } from '../lib/types';

export function usePatternReports() {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<PatternReport[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pattern_reports')
        .select('id, user_id, computed_stats, narrative, provider, generated_at')
        .order('generated_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Failed to fetch pattern reports:', error);
        return;
      }

      setReports((data ?? []) as PatternReport[]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // fetch when auth state resolves
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      fetchReports();
    } else {
      setReports([]);
      setLoading(false);
    }
  }, [fetchReports, user, authLoading]);

  const saveReport = useCallback(async (report: PatternReport): Promise<string | null> => {
    if (!user) {
      console.error('Failed to save pattern report: user not authenticated');
      return null;
    }
    const { data, error } = await supabase
      .from('pattern_reports')
      .insert({
        user_id: user.id,
        computed_stats: report.computed_stats,
        narrative: report.narrative,
        provider: report.provider
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to save pattern report:', error);
      return null;
    }

    // add the new report to the front of the local list
    const newReport: PatternReport = {
      ...report,
      id: data.id as string,
    };
    setReports(prev => [newReport, ...prev]);

    return data.id as string;
  }, [user]);

  return { reports, loading, fetchReports, saveReport };
}

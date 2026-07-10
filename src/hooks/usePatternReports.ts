import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { PatternReport } from '../lib/types';

export function usePatternReports() {
  const saveReport = useCallback(async (report: PatternReport): Promise<string | null> => {
    const { data, error } = await supabase
      .from('pattern_reports')
      .insert({
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
    return data.id as string;
  }, []);

  return { saveReport };
}

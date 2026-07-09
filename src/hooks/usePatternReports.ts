import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { PatternReport } from '../lib/types';

export function usePatternReports() {
  const saveReport = useCallback(async (report: PatternReport) => {
    const { error } = await supabase.from('pattern_reports').insert({
      computed_stats: report.computed_stats,
      narrative: report.narrative,
      provider: report.provider
    });

    if (error) {
      console.error('Failed to save pattern report:', error);
    }
  }, []);

  return { saveReport };
}

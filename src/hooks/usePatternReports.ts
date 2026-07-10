import { useCallback, useEffect, useState } from 'react';
import type { PatternReport } from '../lib/types';
import { onStorageChange, storageGet, storageSet } from '../lib/storage';
const KEY = 'pattern_reports';
export function usePatternReports() {
  const [reports, setReports] = useState<PatternReport[]>(() => storageGet<PatternReport[]>(KEY, []));
  useEffect(() => onStorageChange(KEY, () => setReports(storageGet<PatternReport[]>(KEY, []))), []);
  const fetchReports = useCallback(async () => setReports(storageGet<PatternReport[]>(KEY, [])), []);
  const saveReport = useCallback(async (report: PatternReport) => { const withId = { ...report, id: crypto.randomUUID(), generated_at: new Date().toISOString() }; const next = [withId, ...storageGet<PatternReport[]>(KEY, [])].slice(0, 20); storageSet(KEY, next); setReports(next); return withId.id; }, []);
  return { reports, loading: false, fetchReports, saveReport };
}

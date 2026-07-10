/**
 * usePatternReports — localStorage-backed, no authentication required.
 *
 * Reports are stored as JSON under "undismissed:pattern_reports".
 * The saveReport / fetchReports API is preserved exactly so CaseFile.tsx
 * and App.tsx need no modifications.
 */
import { useCallback, useState, useEffect } from 'react';
import type { PatternReport } from '../lib/types';

const STORAGE_KEY = 'undismissed:pattern_reports';

function load(): PatternReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(reports: PatternReport[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // ignore
  }
}

function makeId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function usePatternReports() {
  const [reports, setReports] = useState<PatternReport[]>(() => load());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    save(reports);
  }, [reports]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setReports(load());
    setLoading(false);
  }, []);

  const saveReport = useCallback(async (report: PatternReport): Promise<string | null> => {
    const id = makeId();
    const newReport: PatternReport = {
      ...report,
      id,
      generated_at: report.generated_at || new Date().toISOString(),
    };
    setReports(prev => {
      const next = [newReport, ...prev].slice(0, 20); // keep latest 20
      save(next);
      return next;
    });
    return id;
  }, []);

  return { reports, loading, fetchReports, saveReport };
}

import { useState, useCallback, useEffect } from 'react';
import { storageGet, storageSet, onStorageChange } from '../lib/storage';
import { getAvgCycleLength, getManualCycleDay } from '../lib/localFlags';
import { todayKey, daysBetweenKeys, addDaysToKey } from '../lib/dateUtils';
import type { PeriodLog } from '../lib/types';

const KEY = 'period_logs';

function sortDesc(logs: PeriodLog[]): PeriodLog[] {
  return [...logs].sort((a, b) => b.start_date.localeCompare(a.start_date));
}

export function usePeriodLog() {
  const [logs, setLogs] = useState<PeriodLog[]>(() => sortDesc(storageGet<PeriodLog[]>(KEY, [])));

  useEffect(() => onStorageChange(KEY, () => setLogs(sortDesc(storageGet<PeriodLog[]>(KEY, [])))), []);

  const persist = useCallback((next: PeriodLog[]) => {
    const sorted = sortDesc(next);
    storageSet(KEY, sorted);
    setLogs(sorted);
  }, []);

  const startPeriod = useCallback((date: string = todayKey()) => {
    const current = storageGet<PeriodLog[]>(KEY, []);
    const alreadyOpen = current.find(l => l.end_date === null);
    if (alreadyOpen) {
      persist(current.map(l => (l.id === alreadyOpen.id ? { ...l, start_date: date } : l)));
      return;
    }
    const log: PeriodLog = { id: crypto.randomUUID(), start_date: date, end_date: null, created_at: new Date().toISOString() };
    persist([log, ...current]);
  }, [persist]);

  const endPeriod = useCallback((id: string, date: string = todayKey()) => {
    const current = storageGet<PeriodLog[]>(KEY, []);
    persist(current.map(l => (l.id === id ? { ...l, end_date: date < l.start_date ? l.start_date : date } : l)));
  }, [persist]);

  const editPeriod = useCallback((id: string, updates: Partial<Pick<PeriodLog, 'start_date' | 'end_date'>>) => {
    const current = storageGet<PeriodLog[]>(KEY, []);
    persist(current.map(l => (l.id === id ? { ...l, ...updates } : l)));
  }, [persist]);

  const deletePeriod = useCallback((id: string) => {
    const current = storageGet<PeriodLog[]>(KEY, []);
    persist(current.filter(l => l.id !== id));
  }, [persist]);

  const addPastPeriod = useCallback((start_date: string, end_date: string) => {
    if (end_date < start_date) end_date = start_date;
    const current = storageGet<PeriodLog[]>(KEY, []);
    const log: PeriodLog = { id: crypto.randomUUID(), start_date, end_date, created_at: new Date().toISOString() };
    persist([log, ...current]);
  }, [persist]);

  const currentCycleDay = useCallback((): number | null => {
    const manual = getManualCycleDay();
    if (manual) return manual;
    if (logs.length === 0) return null;
    const daysSince = daysBetweenKeys(logs[0].start_date, todayKey()) + 1;
    const userCycle = getAvgCycleLength();
    if (userCycle && daysSince > userCycle) {
      return ((daysSince - 1) % userCycle) + 1;
    }
    return daysSince;
  }, [logs]);

  const averagePeriodLength = useCallback((): number | null => {
    const completed = logs.filter(l => l.end_date).slice(0, 6);
    if (completed.length === 0) return null;
    const lengths = completed.map(l => daysBetweenKeys(l.start_date, l.end_date!) + 1);
    return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
  }, [logs]);

  const predictedNextPeriod = useCallback((): { date: string; avgCycleLength: number; confidence: 'low' | 'ok' } | null => {
    if (logs.length === 0) return null;
    const userCycle = getAvgCycleLength();
    if (userCycle && userCycle >= 15 && userCycle <= 60) {
      return {
        date: addDaysToKey(logs[0].start_date, userCycle),
        avgCycleLength: userCycle,
        confidence: 'ok'
      };
    }
    const completed = logs.filter(l => l.end_date).slice(0, 6);
    if (completed.length < 2) return null;
    const gaps: number[] = [];
    for (let i = 0; i < completed.length - 1; i++) {
      const gap = Math.abs(daysBetweenKeys(completed[i].start_date, completed[i + 1].start_date));
      if (gap >= 15 && gap <= 60) gaps.push(gap);
    }
    if (gaps.length === 0) return null;
    const avg = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
    return {
      date: addDaysToKey(logs[0].start_date, avg),
      avgCycleLength: avg,
      confidence: gaps.length >= 3 ? 'ok' : 'low'
    };
  }, [logs]);

  const isOnPeriod = logs.length > 0 && logs[0].end_date === null;
  const activeLog = logs.find(l => l.end_date === null) ?? null;

  return {
    logs, startPeriod, endPeriod, editPeriod, deletePeriod, addPastPeriod,
    currentCycleDay, averagePeriodLength, predictedNextPeriod,
    isOnPeriod, activeLog
  };
}

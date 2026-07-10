import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PeriodLog } from '../lib/types';
import { onStorageChange, storageGet, storageSet } from '../lib/storage';
const KEY = 'period_logs';
const dayMs = 86_400_000;
const asLocalDate = (value: string) => new Date(`${value}T12:00:00`);
const todayKey = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
const daysBetween = (start: string, end: string) => Math.round((asLocalDate(end).getTime() - asLocalDate(start).getTime()) / dayMs);
const sort = (logs: PeriodLog[]) => [...logs].sort((a, b) => b.start_date.localeCompare(a.start_date));
export function usePeriodLog() {
  const [logs, setLogs] = useState<PeriodLog[]>(() => sort(storageGet<PeriodLog[]>(KEY, [])));
  useEffect(() => onStorageChange(KEY, () => setLogs(sort(storageGet<PeriodLog[]>(KEY, [])))), []);
  const save = useCallback((next: PeriodLog[]) => { storageSet(KEY, next); setLogs(sort(next)); }, []);
  const startPeriod = useCallback((date = todayKey()) => { if (logs.some(log => log.end_date === null)) return; save([{ id: crypto.randomUUID(), start_date: date, end_date: null, created_at: new Date().toISOString() }, ...storageGet<PeriodLog[]>(KEY, [])]); }, [logs, save]);
  const endPeriod = useCallback((id: string, date = todayKey()) => save(storageGet<PeriodLog[]>(KEY, []).map(log => log.id === id ? { ...log, end_date: date < log.start_date ? log.start_date : date } : log)), [save]);
  const currentCycleDay = useCallback((date = todayKey()) => logs[0] ? Math.max(1, daysBetween(logs[0].start_date, date) + 1) : null, [logs]);
  const prediction = useMemo(() => { const completed = logs.filter(log => log.end_date); if (completed.length < 2) return null; const ordered = [...completed].sort((a, b) => a.start_date.localeCompare(b.start_date)); const gaps = ordered.slice(1).map((log, index) => daysBetween(ordered[index].start_date, log.start_date)).filter(gap => gap >= 15 && gap <= 60); if (!gaps.length) return null; const average = Math.round(gaps.slice(-6).reduce((sum, gap) => sum + gap, 0) / Math.min(gaps.length, 6)); const next = asLocalDate(logs[0].start_date); next.setDate(next.getDate() + average); return { date: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`, avgCycleLength: average }; }, [logs]);
  return { logs, startPeriod, endPeriod, currentCycleDay, predictedNextPeriod: prediction, isOnPeriod: logs.some(log => log.end_date === null) };
}

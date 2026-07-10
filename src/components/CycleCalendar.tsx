import { useState, useMemo } from 'react';
import { Icon } from './Icon';
import { usePeriodLog } from '../hooks/usePeriodLog';
import { toDateKey, todayKey, dateKeyFromTimestamp, formatDateLabel, daysBetweenKeys } from '../lib/dateUtils';
import type { Entry } from '../lib/types';

interface CycleCalendarProps {
  entries: Entry[];
  compact?: boolean;
}

export function CycleCalendar({ entries, compact = false }: CycleCalendarProps) {
  const { logs, startPeriod, endPeriod, isOnPeriod, activeLog, predictedNextPeriod, averagePeriodLength } = usePeriodLog();
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const periodDaySet = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(log => {
      const end = log.end_date ? new Date(log.end_date + 'T00:00:00') : new Date();
      const cursor = new Date(log.start_date + 'T00:00:00');
      while (cursor <= end) {
        set.add(toDateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    return set;
  }, [logs]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    entries.forEach(e => {
      const day = dateKeyFromTimestamp(e.created_at);
      map.set(day, [...(map.get(day) || []), e]);
    });
    return map;
  }, [entries]);

  const severityByDay = useMemo(() => {
    const map = new Map<string, number>();
    entriesByDay.forEach((dayEntries, day) => {
      map.set(day, Math.max(...dayEntries.flatMap(e => e.tags.map(t => t.severity)), 0));
    });
    return map;
  }, [entriesByDay]);

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const prediction = predictedNextPeriod();
  const todayK = todayKey();

  const selectedDayEntries = selectedDay ? entriesByDay.get(selectedDay) || [] : [];
  const selectedDayIsPeriod = selectedDay ? periodDaySet.has(selectedDay) : false;
  const selectedCycleDay = selectedDay && logs.length > 0 ? daysBetweenKeys(logs[0].start_date, selectedDay) + 1 : null;

  return (
    <div className={`glass rounded-3xl ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} aria-label="Previous month">
          <Icon name="chevron_left" className="text-rose-800" />
        </button>
        <h3 className="font-display italic text-lg text-rose-800">{monthLabel}</h3>
        <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} aria-label="Next month">
          <Icon name="chevron_right" className="text-rose-800" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="text-xs font-sans text-rose-950/40">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = toDateKey(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
          const isPeriod = periodDaySet.has(dateKey);
          const isPredicted = prediction && dateKey === prediction.date;
          const severity = severityByDay.get(dateKey);
          const isToday = dateKey === todayK;
          const isFuture = dateKey > todayK;
          const isSelected = dateKey === selectedDay;

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(dateKey === selectedDay ? null : dateKey)}
              className={`aspect-square rounded-full flex items-center justify-center text-xs font-sans relative transition-transform
                ${isPeriod ? 'bg-rose-500 text-white' : isPredicted ? 'border-2 border-dashed border-rose-300 text-rose-500' : isFuture ? 'text-rose-950/30' : 'text-rose-950/70'}
                ${isToday ? 'ring-2 ring-rose-800 ring-offset-1' : ''}
                ${isSelected ? 'scale-110 ring-2 ring-rose-400 ring-offset-1' : ''}
                hover:bg-rose-100/60`}
            >
              {day}
              {severity ? (
                <span
                  className={`absolute -bottom-0.5 w-1.5 h-1.5 rounded-full ${isPeriod ? 'bg-white' : 'bg-blush-500'}`}
                  style={{ opacity: Math.max(severity / 5, 0.35) }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {selectedDay && !compact && (
        <div className="mt-5 pt-5 border-t border-rose-200/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-sans text-sm font-medium text-rose-900">{formatDateLabel(selectedDay)}</span>
            {selectedCycleDay !== null && selectedCycleDay > 0 && (
              <span className="text-xs font-sans text-rose-950/50">Cycle day {selectedCycleDay}</span>
            )}
          </div>

          {selectedDayEntries.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedDayEntries.flatMap(e => e.tags).map((t, i) => (
                <span key={i} className="text-xs font-sans bg-white/60 text-rose-900 rounded-full px-2.5 py-1">
                  {t.tag.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!selectedDayIsPeriod && (
              <button
                onClick={() => { startPeriod(selectedDay); setSelectedDay(null); }}
                className="text-xs font-sans font-medium text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-full px-3 py-1.5 flex items-center gap-1.5"
              >
                <Icon name="water_drop" size={14} /> Set as period start
              </button>
            )}
            {isOnPeriod && activeLog && selectedDay >= activeLog.start_date && (
              <button
                onClick={() => { endPeriod(activeLog.id, selectedDay); setSelectedDay(null); }}
                className="text-xs font-sans font-medium text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-full px-3 py-1.5 flex items-center gap-1.5"
              >
                <Icon name="event_busy" size={14} /> Set as period end
              </button>
            )}
            {activeLog && selectedDay === activeLog.start_date && (
              <span className="text-xs font-sans text-rose-950/40 self-center">Current period start</span>
            )}
          </div>
        </div>
      )}

      <div className={`flex items-center justify-between flex-wrap gap-2 ${selectedDay && !compact ? 'mt-4' : 'mt-4'}`}>
        {isOnPeriod && activeLog ? (
          <button onClick={() => endPeriod(activeLog.id)} className="text-sm font-sans font-medium text-rose-800 flex items-center gap-2">
            <Icon name="event_busy" size={18} /> Mark period ended today
          </button>
        ) : (
          <button onClick={() => startPeriod()} className="text-sm font-sans font-medium text-rose-800 flex items-center gap-2">
            <Icon name="water_drop" size={18} /> Log period start today
          </button>
        )}
        <div className="text-right">
          {prediction && (
            <div className="text-xs font-sans text-rose-950/50">
              Next expected around {formatDateLabel(prediction.date)}{prediction.confidence === 'low' && ' (rough estimate)'}
            </div>
          )}
          {averagePeriodLength() && (
            <div className="text-xs font-sans text-rose-950/40">Avg period length: {averagePeriodLength()} days</div>
          )}
        </div>
      </div>
    </div>
  );
}

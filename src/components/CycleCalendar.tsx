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
  const { logs, startPeriod, endPeriod, editPeriod, deletePeriod, addPastPeriod, isOnPeriod, activeLog, predictedNextPeriod, averagePeriodLength } = usePeriodLog();
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showPastForm, setShowPastForm] = useState(false);
  const [pastStart, setPastStart] = useState('');
  const [pastEnd, setPastEnd] = useState('');

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

  const selectedPeriodLog = selectedDay ? logs.find(l => selectedDay >= l.start_date && (!l.end_date || selectedDay <= l.end_date)) ?? null : null;
  const [editingPeriod, setEditingPeriod] = useState<string | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  const handleEditPeriod = (logId: string) => {
    const log = logs.find(l => l.id === logId);
    if (!log) return;
    setEditingPeriod(logId);
    setEditStart(log.start_date);
    setEditEnd(log.end_date ?? '');
  };

  const handleSaveEdit = () => {
    if (!editingPeriod) return;
    if (editStart) editPeriod(editingPeriod, { start_date: editStart });
    if (editEnd) editPeriod(editingPeriod, { end_date: editEnd });
    setEditingPeriod(null);
    setSelectedDay(null);
  };

  const handleDeletePeriod = (id: string) => {
    deletePeriod(id);
    setSelectedDay(null);
  };

  const handleAddPastPeriod = () => {
    if (!pastStart || !pastEnd) return;
    addPastPeriod(pastStart, pastEnd);
    setPastStart('');
    setPastEnd('');
    setShowPastForm(false);
    setSelectedDay(null);
  };

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
              onClick={() => {
                setSelectedDay(dateKey === selectedDay ? null : dateKey);
                setEditingPeriod(null);
              }}
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

          {selectedPeriodLog && editingPeriod === selectedPeriodLog.id ? (
            <div className="space-y-3 bg-rose-50/80 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-sans text-rose-600">Start:</label>
                <input type="date" value={editStart} onChange={e => setEditStart(e.target.value)} className="flex-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-sm text-rose-800" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-sans text-rose-600">End:</label>
                <input type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} className="flex-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-sm text-rose-800" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} className="text-xs font-sans font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-full px-4 py-1.5">Save</button>
                <button onClick={() => setEditingPeriod(null)} className="text-xs font-sans font-medium text-rose-600 bg-rose-100 hover:bg-rose-200 rounded-full px-4 py-1.5">Cancel</button>
                <button onClick={() => { handleDeletePeriod(selectedPeriodLog.id); setEditingPeriod(null); }} className="text-xs font-sans font-medium text-rose-500 bg-rose-100 hover:bg-rose-200 rounded-full px-4 py-1.5 ml-auto">Delete period</button>
              </div>
            </div>
          ) : selectedPeriodLog ? (
            <div className="flex items-center justify-between bg-rose-50/60 rounded-2xl px-4 py-2.5">
              <div className="flex items-center gap-3 text-xs font-sans text-rose-700">
                <Icon name="water_drop" size={16} />
                <span>{formatDateLabel(selectedPeriodLog.start_date)}</span>
                <span className="text-rose-300">→</span>
                <span>{selectedPeriodLog.end_date ? formatDateLabel(selectedPeriodLog.end_date) : 'ongoing'}</span>
                {selectedPeriodLog.end_date && (
                  <span className="text-rose-400">({daysBetweenKeys(selectedPeriodLog.start_date, selectedPeriodLog.end_date) + 1} days)</span>
                )}
              </div>
              <button onClick={() => handleEditPeriod(selectedPeriodLog.id)} className="text-xs font-sans text-rose-500 hover:text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-full px-3 py-1">Edit</button>
            </div>
          ) : null}

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

      <div className="flex items-center justify-between flex-wrap gap-2 mt-4">
        {isOnPeriod && activeLog ? (
          <button onClick={() => endPeriod(activeLog.id)} className="text-sm font-sans font-medium text-rose-800 flex items-center gap-2">
            <Icon name="event_busy" size={18} /> Mark period ended today
          </button>
        ) : (
          <button onClick={() => startPeriod()} className="text-sm font-sans font-medium text-rose-800 flex items-center gap-2">
            <Icon name="water_drop" size={18} /> Log period start today
          </button>
        )}
        <button onClick={() => setShowPastForm(!showPastForm)} className="text-sm font-sans font-medium text-rose-600 hover:text-rose-800 flex items-center gap-2">
          <Icon name="history" size={18} /> Log past period
        </button>
        <div className="text-right w-full sm:w-auto">
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

      {showPastForm && (
        <div className="mt-4 pt-4 border-t border-rose-200/40 space-y-3 animate-fade-in">
          <p className="text-xs font-sans text-rose-600">Add a past period with both start and end dates:</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-sans text-rose-500">Start:</label>
              <input type="date" value={pastStart} onChange={e => setPastStart(e.target.value)} className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-sm text-rose-800" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-sans text-rose-500">End:</label>
              <input type="date" value={pastEnd} onChange={e => setPastEnd(e.target.value)} className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-sm text-rose-800" />
            </div>
            <button onClick={handleAddPastPeriod} disabled={!pastStart || !pastEnd} className="text-xs font-sans font-medium text-white bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 disabled:cursor-not-allowed rounded-full px-4 py-1.5">Add</button>
            <button onClick={() => { setShowPastForm(false); setPastStart(''); setPastEnd(''); }} className="text-xs font-sans font-medium text-rose-600 bg-rose-100 hover:bg-rose-200 rounded-full px-4 py-1.5">Cancel</button>
          </div>
        </div>
      )}

      {logs.length > 0 && !compact && (
        <div className="mt-5 pt-4 border-t border-rose-200/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-sans font-semibold text-rose-600 uppercase tracking-wide">Period history</span>
            <span className="text-xs font-sans text-rose-400">{logs.length} logged</span>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="flex items-center justify-between bg-white/40 rounded-xl px-3 py-2 text-xs font-sans text-rose-700">
                <span>
                  {formatDateLabel(log.start_date)} {log.end_date ? `→ ${formatDateLabel(log.end_date)} (${daysBetweenKeys(log.start_date, log.end_date) + 1}d)` : '→ ongoing'}
                </span>
                <div className="flex gap-1.5">
                  <button onClick={() => { handleEditPeriod(log.id); setSelectedDay(log.start_date); }} className="text-rose-400 hover:text-rose-600"><Icon name="edit" size={14} /></button>
                  <button onClick={() => deletePeriod(log.id)} className="text-rose-400 hover:text-rose-600"><Icon name="delete" size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

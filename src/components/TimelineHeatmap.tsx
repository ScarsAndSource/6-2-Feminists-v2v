import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Entry } from '../lib/types';
import { getCyclePhase, PHASE_THEME, NEUTRAL_THEME } from '../lib/cyclePhase';
import { getTagLabel } from '../lib/tagLabels';

interface TimelineHeatmapProps {
  entries: Entry[];
}

interface DayCellData {
  date: string;        // YYYY-MM-DD
  maxSeverity: number; // 0-5
  entryCount: number;
  cycleDay: number | null;
  tags: { tag: string; severity: number }[];
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function severityColor(severity: number): string {
  if (severity <= 0) return 'transparent';
  if (severity === 1) return 'rgba(252,214,227,0.7)';   // rose-100ish
  if (severity === 2) return 'rgba(249,179,207,0.75)';   // rose-200ish
  if (severity === 3) return 'rgba(232,103,155,0.6)';     // rose-400ish
  if (severity === 4) return 'rgba(212,69,127,0.7)';      // rose-500ish
  return 'rgba(156,42,90,0.85)';                          // rose-700ish
}

function phaseOverlayColor(cycleDay: number | null): string {
  const phase = getCyclePhase(cycleDay);
  if (!phase) return 'transparent';
  const theme = PHASE_THEME[phase] ?? NEUTRAL_THEME;
  // subtle tint overlay
  return theme.glow.replace(/[\d.]+\)$/, '0.10)');
}

export function TimelineHeatmap({ entries }: TimelineHeatmapProps) {
  const [tooltip, setTooltip] = useState<DayCellData | null>(null);

  const { weeks, monthLabels } = useMemo(() => {
    // build a 16-week window ending today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const numWeeks = 16;
    const totalDays = numWeeks * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + 1);
    // align to start of week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // index entries by day key
    const dayMap = new Map<string, DayCellData>();
    for (const e of entries) {
      const d = new Date(e.created_at);
      const key = d.toISOString().slice(0, 10);
      const existing = dayMap.get(key);
      if (!existing) {
        dayMap.set(key, {
          date: key,
          maxSeverity: Math.max(...e.tags.map(t => t.severity), 0),
          entryCount: 1,
          cycleDay: e.cycle_day,
          tags: e.tags.map(t => ({ tag: t.tag, severity: t.severity })),
        });
      } else {
        existing.entryCount += 1;
        existing.maxSeverity = Math.max(existing.maxSeverity, ...e.tags.map(t => t.severity));
        if (e.cycle_day != null) existing.cycleDay = e.cycle_day;
        existing.tags.push(...e.tags.map(t => ({ tag: t.tag, severity: t.severity })));
      }
    }

    // build weeks grid
    const weeks: DayCellData[][] = [];
    const months: { label: string; colStart: number }[] = [];
    let lastMonth = -1;

    const cursor = new Date(startDate);
    const totalCols = Math.ceil((today.getTime() - startDate.getTime()) / (86400000 * 7)) + 1;

    for (let w = 0; w < totalCols; w++) {
      const week: DayCellData[] = [];
      for (let d = 0; d < 7; d++) {
        const key = cursor.toISOString().slice(0, 10);
        const isFuture = cursor.getTime() > today.getTime();
        const cell: DayCellData = dayMap.get(key) ?? {
          date: key,
          maxSeverity: 0,
          entryCount: 0,
          cycleDay: null,
          tags: [],
        };

        if (isFuture) {
          cell.maxSeverity = -1; // flag for dim/empty future cell
        }

        // month label tracking
        if (cursor.getMonth() !== lastMonth && !isFuture) {
          lastMonth = cursor.getMonth();
          months.push({
            label: cursor.toLocaleDateString('en-US', { month: 'short' }),
            colStart: w,
          });
        }

        week.push(cell);
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }

    return { weeks, monthLabels: months };
  }, [entries]);

  return (
    <div className="relative">
      {/* month labels */}
      <div
        className="flex text-[10px] text-rose-400 font-semibold tracking-wide mb-1.5 pl-7"
        style={{ gap: 0 }}
      >
        {monthLabels.map((m, i) => (
          <span
            key={i}
            className="absolute"
            style={{ left: `calc(${m.colStart * (16 + 3)}px + 28px)` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex gap-0 mt-5">
        {/* weekday labels */}
        <div className="flex flex-col gap-[3px] mr-1.5 pt-0">
          {WEEKDAYS.map((d, i) => (
            <div
              key={i}
              className="h-4 w-5 flex items-center justify-center text-[9px] text-rose-400 font-medium"
            >
              {i % 2 === 1 ? d : ''}
            </div>
          ))}
        </div>

        {/* grid */}
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell, di) => {
                const isFuture = cell.maxSeverity === -1;
                const isEmpty = cell.maxSeverity <= 0 && !isFuture;
                const severity = Math.max(cell.maxSeverity, 0);

                return (
                  <button
                    key={`${wi}-${di}`}
                    className={`w-4 h-4 rounded-[3px] transition-all duration-200 outline-none ${
                      isFuture
                        ? 'bg-rose-100/20 cursor-default'
                        : isEmpty
                        ? 'bg-rose-100/40 hover:bg-rose-100/70'
                        : 'hover:ring-2 hover:ring-rose-300/50 hover:ring-offset-1 hover:ring-offset-rose-50 cursor-pointer hover:scale-125'
                    }`}
                    style={{
                      backgroundColor: isFuture
                        ? undefined
                        : isEmpty
                        ? undefined
                        : severityColor(severity),
                      backgroundImage:
                        !isFuture && cell.cycleDay != null
                          ? `linear-gradient(135deg, ${phaseOverlayColor(cell.cycleDay)}, transparent)`
                          : undefined,
                    }}
                    onMouseEnter={() => !isFuture && cell.entryCount > 0 && setTooltip(cell)}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => !isFuture && cell.entryCount > 0 && setTooltip(prev => prev?.date === cell.date ? null : cell)}
                    disabled={isFuture}
                    aria-label={
                      isFuture
                        ? 'Future date'
                        : `${cell.date}: ${cell.entryCount} entries, max severity ${severity}`
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* severity legend */}
      <div className="flex items-center gap-2 mt-4 text-[10px] text-rose-400">
        <span>Less</span>
        {[0, 1, 2, 3, 4, 5].map(s => (
          <div
            key={s}
            className="w-3.5 h-3.5 rounded-[2px]"
            style={{ backgroundColor: s === 0 ? 'rgba(252,214,227,0.25)' : severityColor(s) }}
          />
        ))}
        <span>More severe</span>
      </div>

      {/* tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-20 bg-white border border-rose-200 rounded-xl p-4 shadow-card min-w-[220px] max-w-[280px]"
          >
            <div className="text-xs font-semibold text-rose-500 mb-2">
              {new Date(tooltip.date + 'T00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
              {tooltip.cycleDay != null && (
                <span className="text-plum-500 ml-2">· Day {tooltip.cycleDay}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {/* deduplicate tags, show highest severity per tag */}
              {Object.values(
                tooltip.tags.reduce<Record<string, { tag: string; severity: number }>>(
                  (acc, t) => {
                    if (!acc[t.tag] || t.severity > acc[t.tag].severity) {
                      acc[t.tag] = t;
                    }
                    return acc;
                  },
                  {}
                )
              ).map((t, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 border border-rose-100 text-rose-700"
                >
                  {t.tag === 'other' ? 'Other' : getTagLabel(t.tag)}
                  <span className="text-rose-400 font-bold">{t.severity}</span>
                </span>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-rose-400">
              {tooltip.entryCount} {tooltip.entryCount === 1 ? 'entry' : 'entries'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import type { ReactNode } from 'react';
import { CalendarDays, Flame, MoonStar } from 'lucide-react';

interface StatsStripProps {
  entriesThisWeek: number;
  streak: number;
  cycleDay: number | null;
}

function StatBadge({ icon, value, label, accent }: { icon: ReactNode; value: string | number; label: string; accent: string }) {
  return (
    <div className="flex items-center gap-3 bg-white/60 border border-rose-200/50 rounded-2xl px-4 py-3 flex-1 min-w-[140px] hover:shadow-soft transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>{icon}</div>
      <div className="min-w-0">
        <div className="font-display text-xl font-bold text-rose-900 leading-none">{value}</div>
        <div className="text-xs text-rose-500 mt-0.5 truncate">{label}</div>
      </div>
    </div>
  );
}

export function StatsStrip({ entriesThisWeek, streak, cycleDay }: StatsStripProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <StatBadge
        icon={<CalendarDays className="w-5 h-5 text-rose-500" />}
        value={entriesThisWeek}
        label={entriesThisWeek === 1 ? 'entry this week' : 'entries this week'}
        accent="bg-rose-100"
      />
      <StatBadge
        icon={<Flame className="w-5 h-5 text-blush-500" />}
        value={streak}
        label={streak === 1 ? 'day tracked' : 'days tracked'}
        accent="bg-blush-100"
      />
      {cycleDay !== null && (
        <StatBadge
          icon={<MoonStar className="w-5 h-5 text-plum-500" />}
          value={`Day ${cycleDay}`}
          label="estimated cycle day"
          accent="bg-plum-100"
        />
      )}
    </div>
  );
}

import { Icon } from './Icon';
import { computeDoctorRecommendation } from '../lib/doctorFlags';
import type { Entry, PeriodLog } from '../lib/types';

interface DoctorAdviceProps {
  entries: Entry[];
  periodLogs: PeriodLog[];
  userCycleLength?: number | null;
}

const URGENCY_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  urgent: { bg: 'bg-rose-800', text: 'text-white', icon: 'emergency' },
  moderate: { bg: 'bg-rose-100', text: 'text-rose-900', icon: 'event_available' },
  monitor: { bg: 'bg-white/60', text: 'text-rose-900', icon: 'visibility' },
  none: { bg: 'bg-white/60', text: 'text-rose-900', icon: 'check_circle' }
};

export function DoctorAdvice({ entries, periodLogs, userCycleLength }: DoctorAdviceProps) {
  const rec = computeDoctorRecommendation(entries, periodLogs, userCycleLength);
  const style = URGENCY_STYLE[rec.urgency] ?? URGENCY_STYLE.none;

  return (
    <div className="glass rounded-3xl p-6 space-y-5">
      <div className={`rounded-2xl p-5 ${style.bg} ${style.text} flex items-start gap-3`}>
        <Icon name={style.icon} size={24} filled />
        <div>
          <div className="font-display italic text-lg mb-1">{rec.headline}</div>
          {rec.shouldVisit && (
            <div className="text-xs font-sans opacity-80">
              Based on {rec.entryCount} logged {rec.entryCount === 1 ? 'entry' : 'entries'}. Not a diagnosis -
              just a signal it's worth a professional's read on this.
            </div>
          )}
        </div>
      </div>

      {rec.lowData && (
        <p className="text-xs font-sans text-rose-950/50">
          Pattern-based flags need at least 5 logged entries to be meaningful - you're at {rec.entryCount}.
          The single-symptom safety check above still runs on every entry regardless.
        </p>
      )}

      {rec.flags.length > 0 && (
        <div className="space-y-2">
          {rec.flags.map(f => (
            <div key={f.id} className="bg-white/50 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full ${f.urgency === 'urgent' ? 'bg-rose-800' : f.urgency === 'moderate' ? 'bg-rose-500' : 'bg-rose-300'}`} />
                <span className="font-sans text-sm font-medium text-rose-900">{f.title}</span>
              </div>
              <p className="font-sans text-xs text-rose-950/60 leading-relaxed">{f.reason}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] font-sans text-rose-950/40 leading-relaxed">
        This is a pattern signal generated locally from your own logs, not a diagnosis. It never looks at anything
        beyond what you've entered here, and it can't replace being seen by a doctor.
      </p>
    </div>
  );
}

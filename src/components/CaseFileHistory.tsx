import { motion } from 'framer-motion';
import { FileText, Clock, ChevronRight } from 'lucide-react';
import type { PatternReport } from '../lib/types';

interface CaseFileHistoryProps {
  reports: PatternReport[];
  loading: boolean;
  onSelect: (report: PatternReport) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CaseFileHistory({ reports, loading, onSelect }: CaseFileHistoryProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-sm text-rose-400">
        <div className="w-4 h-4 border-2 border-rose-300/40 border-t-rose-500 rounded-full animate-spin" />
        Loading past Case Files…
      </div>
    );
  }

  if (reports.length === 0) {
    return null; // don't render anything if no history
  }

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-500">
        <Clock className="w-4 h-4" />
        Past Case Files
      </h3>
      <div className="space-y-2">
        {reports.map((report, i) => (
          <motion.button
            key={report.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            onClick={() => onSelect(report)}
            className="w-full flex items-center gap-3 p-3.5 bg-white/50 hover:bg-white border border-rose-200/50 hover:border-rose-300/60 rounded-xl transition-all duration-200 hover:shadow-soft group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200/80 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-rose-800 truncate">
                {report.computed_stats.entry_count} entries ·{' '}
                {report.computed_stats.tag_frequency.filter(t => t.tag !== 'other').length} symptoms
              </div>
              <div className="text-xs text-rose-400 mt-0.5">{formatDate(report.generated_at)}</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-rose-400 shrink-0">
              <span className="px-2 py-0.5 rounded-md bg-rose-100/60 font-medium capitalize">
                {report.provider === 'template' ? 'Local' : report.provider}
              </span>
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

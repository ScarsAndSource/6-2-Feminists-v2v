import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface InsightCardProps {
  icon: ReactNode;
  label: string;
  title: string;
  body: string;
  footnote?: string;
  index?: number;
}

export function InsightCard({ icon, label, title, body, footnote, index = 0 }: InsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      className="group bg-white/60 hover:bg-white border border-rose-200/50 hover:border-rose-300/60 rounded-2xl p-6 transition-all duration-300 hover:shadow-card shimmer-overlay"
    >
      {/* header strip */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
          {icon}
        </div>
        <span className="text-[11px] font-bold text-rose-400 uppercase tracking-widest leading-none">
          {label}
        </span>
      </div>

      {/* content */}
      <h4 className="font-display text-lg font-semibold text-rose-900 mb-1.5 leading-snug">
        {title}
      </h4>
      <p className="text-sm text-rose-600 leading-relaxed">{body}</p>

      {/* footnote */}
      {footnote && (
        <p className="mt-3 pt-2.5 border-t border-rose-100/80 text-xs text-rose-400 leading-relaxed italic">
          {footnote}
        </p>
      )}
    </motion.div>
  );
}

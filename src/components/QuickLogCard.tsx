import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Undo2, X, ArrowRight } from 'lucide-react';
import type { Entry } from '../lib/types';
import { getTagLabel } from '../lib/tagLabels';

interface QuickLogCardProps {
  suggestedTags: string[];
  onQuickLog: (tag: string) => Promise<Entry | void>;
  onDelete: (id: string) => Promise<void>;
  onOpenFullLogger: () => void;
  disabled?: boolean;
}

const UNDO_WINDOW_MS = 6000;

export function QuickLogCard({ suggestedTags, onQuickLog, onDelete, onOpenFullLogger, disabled }: QuickLogCardProps) {
  const [pendingTag, setPendingTag] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ id: string; tag: string } | null>(null);
  const [undoing, setUndoing] = useState(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = useCallback(
    async (tag: string) => {
      if (disabled || pendingTag) return;
      setPendingTag(tag);
      try {
        const inserted = await onQuickLog(tag);
        if (inserted && 'id' in inserted) {
          setUndo({ id: inserted.id, tag });
          if (undoTimer.current) clearTimeout(undoTimer.current);
          undoTimer.current = setTimeout(() => setUndo(null), UNDO_WINDOW_MS);
        }
      } finally {
        setPendingTag(null);
      }
    },
    [disabled, pendingTag, onQuickLog]
  );

  const handleUndo = async () => {
    if (!undo || undoing) return;
    setUndoing(true);
    try {
      await onDelete(undo.id);
    } finally {
      setUndo(null);
      setUndoing(false);
    }
  };

  return (
    <div className="gradient-border-animated">
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-rose-800">How are you, right now?</h2>
            <p className="text-sm text-rose-500 mt-1">
              Tap what fits — severity defaults to moderate, adjust later if it wasn't
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-glow-soft shrink-0 bloom">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {suggestedTags.map(tag => {
            const isPending = pendingTag === tag;
            return (
              <motion.button
                key={tag}
                onClick={() => handleTap(tag)}
                disabled={disabled || !!pendingTag}
                whileTap={{ scale: 0.92 }}
                className={`relative min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors duration-300 ${
                  isPending
                    ? 'bg-rose-500/20 text-rose-600 border-rose-400/50'
                    : 'bg-rose-100/50 text-rose-600 hover:bg-rose-200 hover:text-rose-800 border-transparent hover:scale-105 transition-transform'
                }`}
              >
                {isPending ? (
                  <span className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 border-2 border-rose-400/40 border-t-rose-600 rounded-full animate-spin" />
                    Logging
                  </span>
                ) : (
                  getTagLabel(tag)
                )}
              </motion.button>
            );
          })}
        </div>

        <button
          onClick={onOpenFullLogger}
          className="group mt-5 flex items-center gap-1.5 text-sm font-medium text-rose-400 hover:text-rose-600 transition-colors"
        >
          Something else, or want to set severity first?
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <AnimatePresence>
        {undo && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 bg-rose-100 border border-rose-200 rounded-2xl px-5 py-3 shadow-2xl">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-rose-500" />
              </div>
              <span className="text-sm text-rose-800 font-medium">{getTagLabel(undo.tag)} logged</span>
              <button
                onClick={handleUndo}
                disabled={undoing}
                className="flex items-center gap-1.5 text-sm font-semibold text-rose-500 hover:text-rose-600 disabled:opacity-50 transition-colors"
              >
                <Undo2 className="w-4 h-4" />
                {undoing ? 'Undoing...' : 'Undo'}
              </button>
              <button onClick={() => setUndo(null)} className="text-rose-400 hover:text-rose-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

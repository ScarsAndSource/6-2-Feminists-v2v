import { useState } from 'react';
import { FileText, Printer, Loader2, Sparkles } from 'lucide-react';
import { generateAdvocacyNote } from '../lib/advocacyNote';
import type { AdvocacyStatsContext, AdvocacyFollowupContext } from '../lib/advocacyContext';

interface AdvocacyNoteProps {
  stats: AdvocacyStatsContext;
  followup: AdvocacyFollowupContext;
}

export function AdvocacyNote({ stats, followup }: AdvocacyNoteProps) {
  const [note, setNote] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateAdvocacyNote(stats, followup);
      setNote(result.text);
      setProvider(result.provider);
    } finally {
      setLoading(false);
    }
  };

  if (!note && !loading) {
    return (
      <button
        onClick={handleGenerate}
        className="w-full flex items-center justify-center gap-2 py-3 bg-rose-100 hover:bg-rose-200 text-rose-700 font-medium rounded-xl transition-all active:scale-98 border border-rose-200/40"
      >
        <Sparkles className="w-4 h-4" />
        Draft an advocacy note
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-rose-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Drafting your note...
      </div>
    );
  }

  return (
    <div className="print-area">
      <div className="no-print flex items-center justify-between mb-2">
        <span className="text-xs text-rose-400">
          {provider === 'template' ? 'Generated from your data' : `Generated with AI (${provider})`}
        </span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 transition-colors font-medium"
        >
          <Printer className="w-3.5 h-3.5" />
          Print / PDF
        </button>
      </div>
      <div className="bg-white text-rose-950 rounded-xl p-5 text-sm leading-relaxed border border-rose-200/50 shadow-soft">
        <div className="flex items-center gap-2 mb-3 text-rose-400">
          <FileText className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">Advocacy Note</span>
        </div>
        <p className="whitespace-pre-line">{note}</p>
        <p className="text-xs text-rose-400 mt-4 pt-3 border-t border-rose-100">
          Patient-compiled note based on logged data. Not a diagnosis.
        </p>
      </div>
    </div>
  );
}

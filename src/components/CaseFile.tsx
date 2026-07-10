import { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  AlertCircle,
  Calendar,
  TrendingUp,
  BarChart3,
  Download,
  Clock,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import type { ComputedStats, PatternReport, Entry } from '../lib/types';
import { getTagLabel } from '../lib/tagLabels';
import { computeStats } from '../lib/aggregation';
import { generateNarrative } from '../lib/narration';
import { FollowupLedger } from './FollowupLedger';
import { PetalLoader } from './PetalLoader';
import { TextReveal } from './TextReveal';
import { EmptyStateIllustration } from './EmptyStateIllustration';

const LOADING_MESSAGES = [
  'Computing patterns...',
  'Analyzing frequencies...',
  'Checking sample sizes...',
  'Drafting narrative...',
  'Finalizing...'
];

interface CaseFileProps {
  entries: Entry[];
  onGenerated?: (report: PatternReport) => Promise<string | null> | void;
  isDemo?: boolean;
}

function Heart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export function CaseFile({ entries, onGenerated, isDemo = false }: CaseFileProps) {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(0);
  const [stats, setStats] = useState<ComputedStats | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [patternReportId, setPatternReportId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMessage(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleGenerate = async () => {
    if (entries.length === 0) return;

    setLoading(true);
    setError(null);
    setPatternReportId(null);

    try {
      const computed = computeStats(entries);
      setStats(computed);

      if (computed.entry_count === 0) {
        setNarrative('No symptom data available to analyze.');
        setProvider('template');
        return;
      }

      const genResult = await generateNarrative(computed);
      setNarrative(genResult.text);
      setProvider(genResult.provider);

      if (onGenerated) {
        const maybeId = await onGenerated({
          id: crypto.randomUUID(),
          user_id: entries[0]?.user_id || null,
          computed_stats: computed,
          narrative: genResult.text,
          provider: genResult.provider,
          generated_at: new Date().toISOString()
        });
        if (typeof maybeId === 'string') setPatternReportId(maybeId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate Case File');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const weeksTracked = stats
    ? Math.ceil(
        (new Date(stats.date_range.end).getTime() - new Date(stats.date_range.start).getTime()) /
          (1000 * 60 * 60 * 24 * 7)
      )
    : 0;

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <EmptyStateIllustration variant="open-journal" className="w-24 h-24" />
        <h3 className="text-xl font-display font-semibold text-rose-950 mb-2">No Data Yet</h3>
        <p className="text-rose-500 mb-6 max-w-xs mx-auto text-base">
          Start logging symptoms to generate your first Case File
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 rounded-full text-sm text-rose-500 border border-rose-200/50">
          <Info className="w-4 h-4" />
          <span>Need at least 1 entry to generate</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-coral-500/10 border border-coral-500/20 rounded-xl text-coral-400 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!stats && !loading && (
        <div className="no-print">
          <div className="gradient-border">
            <div className="p-6 sm:p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 mb-4 shadow-glow">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{entries.length} entries ready</h3>
              <p className="text-slate-400 mb-6 text-sm">
                Generate a clinical summary to bring to your next appointment
              </p>
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-semibold rounded-xl transition-all shadow-glow hover:shadow-lg hover:scale-[1.02]"
              >
                <FileText className="w-5 h-5" />
                Generate Case File
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <PetalLoader messageIndex={loadingMessage} message={LOADING_MESSAGES[loadingMessage]} />
      )}

      {stats && narrative && !loading && (
        <div className="space-y-4 animate-fade-in">
          <div className="no-print flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <span>Generated with {provider === 'template' ? 'deterministic analysis' : `AI (${provider})`}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-all"
              >
                <Printer className="w-4 h-4" />
                Print / PDF
              </button>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white text-slate-900 rounded-2xl shadow-soft doc-shadow print:shadow-none print:rounded-none overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-8 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-500">HerWellness</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">Symptom Case File</h1>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <div className="flex items-center gap-1.5 justify-end mb-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(stats.date_range.start)} – {formatDate(stats.date_range.end)}
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Clock className="w-4 h-4" />
                    Generated {formatDateTime(new Date().toISOString())}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <StatPill value={stats.entry_count} label="entries" />
                <StatPill value={weeksTracked} label="weeks" />
                {stats.tag_frequency.filter(t => t.tag !== 'other').length > 0 && (
                  <StatPill value={stats.tag_frequency.filter(t => t.tag !== 'other').length} label="symptoms tracked" />
                )}
              </div>
            </div>

            <div className="px-8 py-8">
              <div className="prose prose-slate max-w-none">
                {narrative.split('\n\n').map((para, i) =>
                  i === 0 ? (
                    <p key={i} className="text-base leading-relaxed text-slate-700 mb-4">
                      <TextReveal text={para} staggerMs={18} />
                    </p>
                  ) : (
                    <p
                      key={i}
                      className="text-base leading-relaxed text-slate-700 mb-4 last:mb-0 rise-fade"
                      style={{ animationDelay: `${600 + i * 100}ms`, opacity: 0 }}
                    >
                      {para}
                    </p>
                  )
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50/50 px-8 py-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                    <TrendingUp className="w-4 h-4" />
                    Symptom Frequency
                  </h3>
                  <div className="space-y-2">
                    {stats.tag_frequency
                      .filter(t => t.tag !== 'other')
                      .slice(0, 6)
                      .map(t => (
                        <div key={t.tag} className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">{getTagLabel(t.tag)}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-500 rounded-full"
                                style={{
                                  width: `${(t.count / Math.max(...stats.tag_frequency.map(x => x.count))) * 100}%`
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 w-8 text-right">{t.count}×</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {stats.severity_by_tag.filter(s => !s.low_confidence).length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                      <BarChart3 className="w-4 h-4" />
                      Average Severity
                    </h3>
                    <div className="space-y-2">
                      {stats.severity_by_tag
                        .filter(s => !s.low_confidence)
                        .slice(0, 5)
                        .map(s => (
                          <div key={s.tag} className="flex items-center justify-between">
                            <span className="text-sm text-slate-700">{getTagLabel(s.tag)}</span>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(sev => (
                                  <div
                                    key={sev}
                                    className={`w-3 h-3 rounded-sm ${
                                      sev <= Math.round(s.avg_severity) ? 'bg-coral-500' : 'bg-slate-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-slate-500 w-16 text-right">
                                {s.avg_severity.toFixed(1)}/5
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {stats.co_occurrence.filter(c => !c.low_confidence && c.n >= 3).length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                    <ChevronRight className="w-4 h-4" />
                    Pattern Co-occurrence
                  </h3>
                  <div className="space-y-2">
                    {stats.co_occurrence
                      .filter(c => !c.low_confidence && c.n >= 3)
                      .slice(0, 3)
                      .map(c => (
                        <div key={`${c.tag_a}-${c.tag_b}`} className="flex items-start gap-2 text-sm text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                          <span>
                            <strong className="text-slate-700">{getTagLabel(c.tag_a)}</strong> and{' '}
                            <strong className="text-slate-700">{getTagLabel(c.tag_b)}</strong> appeared together{' '}
                            {c.n} times, typically within {c.lag_days_avg.toFixed(0)} days
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-8 py-5 bg-slate-50 print:break-before-avoid">
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong className="text-slate-600">Disclaimer:</strong> Patient-compiled symptom summary.
                Not a diagnosis. Computed only from what was logged — gaps in tracking may mean gaps in this picture.
                Generated by an AI assistant that only describes logged data and cannot make medical judgments.
              </p>
              {stats.coverage_gap_flag && (
                <div className="mt-2 flex items-start gap-2 text-xs text-amber-600">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>There were gaps of more than two weeks between some entries.</span>
                </div>
              )}
            </div>
          </div>

          {!isDemo && <FollowupLedger patternReportId={patternReportId} />}
        </div>
      )}
    </div>
  );
}

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm">
      <span className="text-lg font-bold text-teal-600">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

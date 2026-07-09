import { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Loader2,
  AlertCircle,
  Calendar,
  TrendingUp,
  BarChart3,
  Download,
  Clock,
  ChevronRight,
  Sparkles,
  Info,
  Heart,
} from 'lucide-react';
import type { ComputedStats, PatternReport, Entry } from '../lib/types';
import { TAG_LABELS } from '../lib/types';
import { computeStats } from '../lib/aggregation';
import { generateNarrative } from '../lib/narration';

const LOADING_MESSAGES = [
  'Computing patterns...',
  'Analyzing frequencies...',
  'Checking sample sizes...',
  'Drafting narrative...',
  'Finalizing...'
];

interface CaseFileProps {
  entries: Entry[];
  onGenerated?: (report: PatternReport) => void;
}

export function CaseFile({ entries, onGenerated }: CaseFileProps) {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(0);
  const [stats, setStats] = useState<ComputedStats | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    try {
      const computed = computeStats(entries);
      setStats(computed);

      if (computed.entry_count === 0) {
        setNarrative('No symptom data available to analyze.');
        setProvider('template');
        return;
      }

      const result = await generateNarrative(computed);
      setNarrative(result.text);
      setProvider(result.provider);

      if (onGenerated) {
        onGenerated({
          id: crypto.randomUUID(),
          user_id: entries[0]?.user_id || null,
          computed_stats: computed,
          narrative: result.text,
          provider: result.provider,
          generated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate Case File');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

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
        (new Date(stats.date_range.end).getTime() -
          new Date(stats.date_range.start).getTime()) /
          (1000 * 60 * 60 * 24 * 7)
      )
    : 0;

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/60 border border-rose-200/50 flex items-center justify-center shadow-soft float-element">
          <FileText className="w-10 h-10 text-rose-300" />
        </div>
        <h3 className="text-lg font-display font-semibold text-rose-950 mb-2">No Data Yet</h3>
        <p className="text-rose-500 mb-6 max-w-xs mx-auto">
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
      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-blush-400/10 border border-blush-400/20 rounded-2xl text-blush-600 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Action Buttons - Hidden in print */}
      {!stats && !loading && (
        <div className="no-print">
          <div className="gradient-border-animated">
            <div className="p-6 sm:p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-rose-400 to-rose-600 mb-4 shadow-glow-soft bloom">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-display font-semibold text-rose-950 mb-2">
                {entries.length} entries ready
              </h3>
              <p className="text-rose-500 mb-6 text-sm">
                Generate a clinical summary to bring to your next appointment
              </p>
              <button
                onClick={handleGenerate}
                className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-semibold rounded-full transition-all duration-300 shadow-glow hover:shadow-petal hover:scale-[1.03] glow-pulse shimmer-overlay"
              >
                <FileText className="w-5 h-5 group-hover:sway" />
                Generate Case File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-rose-100 to-rose-200 border border-rose-200 mb-4 bloom">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          </div>
          <p className="text-lg font-display font-medium text-rose-950 mb-1 shimmer-text">{LOADING_MESSAGES[loadingMessage]}</p>
          <p className="text-sm text-rose-400">This may take a few seconds</p>
        </div>
      )}

      {/* Generated Document */}
      {stats && narrative && !loading && (
        <div className="space-y-4 animate-fade-in">
          {/* Action Bar */}
          <div className="no-print flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-rose-500">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse-soft" />
              <span>
                Generated with {provider === 'template' ? 'deterministic analysis' : `AI (${provider})`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-medium rounded-full transition-all duration-300 text-sm hover:scale-105 shadow-glow-soft shimmer-overlay"
              >
                <Printer className="w-4 h-4 group-hover:sway" />
                Print / PDF
              </button>
              <button
                onClick={handleGenerate}
                className="group flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white text-rose-600 hover:text-rose-800 rounded-full transition-all border border-rose-200/50 text-sm hover:scale-105"
              >
                <Download className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>
          </div>

          {/* Document */}
          <div className="bg-white text-rose-950 rounded-3xl shadow-card doc-shadow print:shadow-none print:rounded-none overflow-hidden ribbon">
            {/* Document Header */}
            <div className="bg-gradient-to-r from-rose-50 via-blush-50 to-rose-50 border-b border-rose-100 px-8 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-glow-soft">
                      <Heart className="w-5 h-5 text-white heartbeat" fill="white" />
                    </div>
                    <span className="text-sm font-medium text-rose-500">HerWellness</span>
                  </div>
                  <h1 className="text-2xl font-display font-bold text-rose-950">Symptom Case File</h1>
                </div>
                <div className="text-right text-sm text-rose-500">
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

              {/* Stats Pills */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <StatPill value={stats.entry_count} label="entries" />
                <StatPill value={weeksTracked} label="weeks" />
                {stats.tag_frequency.filter(t => t.tag !== 'other').length > 0 && (
                  <StatPill
                    value={stats.tag_frequency.filter(t => t.tag !== 'other').length}
                    label="symptoms tracked"
                  />
                )}
              </div>
            </div>

            {/* Narrative Section */}
            <div className="px-8 py-8">
              <div className="prose prose-rose max-w-none">
                {narrative.split('\n\n').map((para, i) => (
                  <p
                    key={i}
                    className="text-base leading-relaxed text-rose-800 mb-4 last:mb-0 rise-fade"
                    style={{ animationDelay: `${i * 100}ms`, opacity: 0 }}
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="border-t border-rose-100 bg-gradient-to-b from-rose-50/50 to-blush-50/30 px-8 py-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Frequency */}
                <div>
                  <h3 className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wide mb-4">
                    <TrendingUp className="w-4 h-4" />
                    Symptom Frequency
                  </h3>
                  <div className="space-y-2.5">
                    {stats.tag_frequency
                      .filter(t => t.tag !== 'other')
                      .slice(0, 6)
                      .map((t, i) => (
                        <div
                          key={t.tag}
                          className="flex items-center justify-between rise-fade"
                          style={{ animationDelay: `${i * 60}ms`, opacity: 0 }}
                        >
                          <span className="text-sm text-rose-800">
                            {TAG_LABELS[t.tag]}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-rose-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all duration-700"
                                style={{
                                  width: `${(t.count / Math.max(...stats.tag_frequency.map(x => x.count))) * 100}%`
                                }}
                              />
                            </div>
                            <span className="text-xs text-rose-500 w-8 text-right font-medium">
                              {t.count}×
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Severity */}
                {stats.severity_by_tag.filter(s => !s.low_confidence).length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wide mb-4">
                      <BarChart3 className="w-4 h-4" />
                      Average Severity
                    </h3>
                    <div className="space-y-2.5">
                      {stats.severity_by_tag
                        .filter(s => !s.low_confidence)
                        .slice(0, 5)
                        .map((s, i) => (
                          <div
                            key={s.tag}
                            className="flex items-center justify-between rise-fade"
                            style={{ animationDelay: `${i * 60}ms`, opacity: 0 }}
                          >
                            <span className="text-sm text-rose-800">
                              {TAG_LABELS[s.tag]}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(sev => (
                                  <div
                                    key={sev}
                                    className={`w-3 h-3 rounded-sm transition-all ${
                                      sev <= Math.round(s.avg_severity)
                                        ? 'bg-gradient-to-br from-rose-400 to-rose-600'
                                        : 'bg-rose-100'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-rose-500 w-16 text-right font-medium">
                                {s.avg_severity.toFixed(1)}/5
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Co-occurrence */}
              {stats.co_occurrence.filter(c => !c.low_confidence && c.n >= 3).length > 0 && (
                <div className="mt-6 pt-6 border-t border-rose-100">
                  <h3 className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wide mb-4">
                    <ChevronRight className="w-4 h-4" />
                    Pattern Co-occurrence
                  </h3>
                  <div className="space-y-2">
                    {stats.co_occurrence
                      .filter(c => !c.low_confidence && c.n >= 3)
                      .slice(0, 3)
                      .map((c, i) => (
                        <div
                          key={`${c.tag_a}-${c.tag_b}`}
                          className="flex items-start gap-2 text-sm text-rose-700 rise-fade"
                          style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 mt-1.5 shrink-0" />
                          <span>
                            <strong className="text-rose-900">{TAG_LABELS[c.tag_a]}</strong> and{' '}
                            <strong className="text-rose-900">{TAG_LABELS[c.tag_b]}</strong> appeared together{' '}
                            {c.n} times, typically within {c.lag_days_avg.toFixed(0)} days
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Disclaimer Footer */}
            <div className="border-t border-rose-100 px-8 py-5 bg-rose-50/30 print:break-before-avoid">
              <p className="text-xs text-rose-500 leading-relaxed">
                <strong className="text-rose-600">Disclaimer:</strong> Patient-compiled symptom summary.
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
        </div>
      )}
    </div>
  );
}

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-rose-200 shadow-soft">
      <span className="text-lg font-bold font-display gradient-text">{value}</span>
      <span className="text-xs text-rose-500">{label}</span>
    </div>
  );
}

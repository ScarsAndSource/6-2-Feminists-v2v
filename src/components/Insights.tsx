import { useMemo, useState, useEffect } from 'react';
import {
  Crown, Link2, TrendingUp, TrendingDown, Minus, Sparkles,
  BrainCircuit, KeyRound, Eye, EyeOff, RefreshCw, AlertTriangle
} from 'lucide-react';
import { InsightCard } from './InsightCard';
import { EmptyStateIllustration } from './EmptyStateIllustration';
import { computeSeverityTrend } from '../lib/aggregation';
import { getTagLabel } from '../lib/tagLabels';
import type { ComputedStats, Entry } from '../lib/types';
import { generateAIPredictions } from '../lib/gemini';

interface InsightsProps {
  entries: Entry[];
  stats: ComputedStats;
}

const LOADING_STEPS = [
  'Synthesizing logs...',
  'Analyzing temporal offsets...',
  'Checking cycle correlation...',
  'Mapping practical remedies...',
  'Compiling safety flags...'
];

export function Insights({ entries, stats }: InsightsProps) {
  const trend = useMemo(() => computeSeverityTrend(entries), [entries]);

  const topTag = stats.tag_frequency.find(t => t.tag !== 'other');
  const strongestPair = stats.co_occurrence.find(c => c.n >= 2);

  // ─── Local API Key States ───
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('undismissed:gemini_api_key') || '';
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);
  const [keyInputVal, setKeyInputVal] = useState('');

  // ─── AI Generation States ───
  const [generating, setGenerating] = useState(false);
  const [loadStepIdx, setLoadStepIdx] = useState(0);
  const [aiReport, setAiReport] = useState<string>(() => {
    return localStorage.getItem('undismissed:ai_insights_data') || '';
  });
  const [genError, setGenError] = useState<string | null>(null);

  // Rotate loading steps while generating
  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setLoadStepIdx(prev => (prev + 1) % LOADING_STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [generating]);

  const handleSaveKey = () => {
    const trimmed = keyInputVal.trim();
    localStorage.setItem('undismissed:gemini_api_key', trimmed);
    setApiKey(trimmed);
    setShowKeyInput(false);
    setKeyInputVal('');
  };

  const handleRemoveKey = () => {
    localStorage.removeItem('undismissed:gemini_api_key');
    setApiKey('');
    setAiReport('');
    localStorage.removeItem('undismissed:ai_insights_data');
  };

  const handleGenerateAI = async () => {
    if (!apiKey) return;
    setGenerating(true);
    setGenError(null);
    setLoadStepIdx(0);
    try {
      const response = await generateAIPredictions(entries, apiKey);
      setAiReport(response);
      localStorage.setItem('undismissed:ai_insights_data', response);
    } catch (err) {
      console.error(err);
      setGenError(err instanceof Error ? err.message : 'An error occurred during AI analysis.');
    } finally {
      setGenerating(false);
    }
  };

  // Custom Markdown parser for medical/wellness predictions
  const renderedAIReport = useMemo(() => {
    if (!aiReport) return null;
    const blocks: React.ReactNode[] = [];
    const lines = aiReport.split('\n');
    let currentList: React.ReactNode[] = [];
    let listKey = 0;

    const parseInlineBold = (txt: string) => {
      const parts = txt.split('**');
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return <strong key={index} className="font-semibold text-rose-950 bg-rose-100/40 px-1 rounded">{part}</strong>;
        }
        return part;
      });
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        if (currentList.length > 0) {
          blocks.push(
            <ul key={`list-${listKey++}`} className="list-disc pl-5 mb-4 space-y-2 text-sm text-rose-900/80 leading-relaxed">
              {currentList}
            </ul>
          );
          currentList = [];
        }
        continue;
      }

      if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
        if (currentList.length > 0) {
          blocks.push(
            <ul key={`list-${listKey++}`} className="list-disc pl-5 mb-4 space-y-2 text-sm text-rose-900/80 leading-relaxed">
              {currentList}
            </ul>
          );
          currentList = [];
        }

        const cleanHeading = line.replace(/^#+\s+/, '');
        const isDoctorSection = cleanHeading.toLowerCase().includes('doctor') || cleanHeading.toLowerCase().includes('consult');
        const isRemedySection = cleanHeading.toLowerCase().includes('remed') || cleanHeading.toLowerCase().includes('approach');

        blocks.push(
          <h4
            key={`h-${i}`}
            className={`font-display text-lg font-semibold mt-6 mb-3 flex items-center gap-2 ${
              isDoctorSection ? 'text-amber-800' : isRemedySection ? 'text-emerald-800' : 'text-rose-800'
            }`}
          >
            {isDoctorSection ? (
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            ) : isRemedySection ? (
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
            ) : (
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" />
            )}
            {cleanHeading}
          </h4>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        const cleanItem = line.substring(2);
        currentList.push(
          <li key={`li-${i}`} className="leading-relaxed">
            {parseInlineBold(cleanItem)}
          </li>
        );
      } else {
        if (currentList.length > 0) {
          blocks.push(
            <ul key={`list-${listKey++}`} className="list-disc pl-5 mb-4 space-y-2 text-sm text-rose-900/80 leading-relaxed">
              {currentList}
            </ul>
          );
          currentList = [];
        }

        const isDisclaimer = line.toLowerCase().includes('disclaimer') || line.toLowerCase().includes('not medical advice');
        blocks.push(
          <p
            key={`p-${i}`}
            className={`text-sm mb-4 leading-relaxed ${
              isDisclaimer
                ? 'text-xs text-rose-500/70 italic bg-rose-100/30 border border-rose-200/20 rounded-xl p-3 mt-4'
                : 'text-rose-950/80'
            }`}
          >
            {parseInlineBold(line)}
          </p>
        );
      }
    }

    if (currentList.length > 0) {
      blocks.push(
        <ul key={`list-${listKey++}`} className="list-disc pl-5 mb-4 space-y-2 text-sm text-rose-900/80 leading-relaxed">
          {currentList}
        </ul>
      );
    }

    return <div className="space-y-1">{blocks}</div>;
  }, [aiReport]);

  // zero-entry state
  if (entries.length === 0) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in text-center py-16">
        <EmptyStateIllustration variant="dormant-bud" />
        <h2 className="font-display text-xl font-semibold text-rose-800 mb-2">
          Insights appear here
        </h2>
        <p className="text-sm text-rose-500 max-w-xs mx-auto">
          Your first entry will start revealing patterns — come back after logging to see what shows up.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-rose-800">Insights</h2>
        <p className="text-sm text-rose-500 mt-0.5">
          Patterns and trends from everything you've logged
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* card 1 — most logged */}
        {topTag ? (
          <InsightCard
            icon={<Crown className="w-4.5 h-4.5 text-rose-500" />}
            label="Most logged"
            title={getTagLabel(topTag.tag)}
            body={`Logged ${topTag.count} ${topTag.count === 1 ? 'time' : 'times'} — this is your most-tracked symptom so far.`}
            index={0}
          />
        ) : (
          <InsightCard
            icon={<Crown className="w-4.5 h-4.5 text-rose-400" />}
            label="Most logged"
            title="Waiting on data"
            body="Log 2+ different symptoms to see which shows up most."
            footnote="Even one entry starts the count."
            index={0}
          />
        )}

        {/* card 2 — co-occurrence */}
        {strongestPair ? (
          <InsightCard
            icon={<Link2 className="w-4.5 h-4.5 text-rose-500" />}
            label={strongestPair.low_confidence ? 'Early pattern' : 'Often together'}
            title={`${getTagLabel(strongestPair.tag_a)} + ${getTagLabel(strongestPair.tag_b)}`}
            body={`These appeared within ${strongestPair.lag_days_avg.toFixed(0)} day${strongestPair.lag_days_avg === 1 ? '' : 's'} of each other, ${strongestPair.n} times.`}
            footnote={
              strongestPair.low_confidence
                ? 'Early pattern — log a few more days to confirm this link.'
                : undefined
            }
            index={1}
          />
        ) : (
          <InsightCard
            icon={<Link2 className="w-4.5 h-4.5 text-rose-400" />}
            label="Co-occurrence"
            title="Looking for links"
            body="Log 2+ different symptoms within a few days of each other to spot pairs."
            footnote="The engine checks which symptoms cluster together and how far apart they show up."
            index={1}
          />
        )}

        {/* card 3 — severity trend */}
        {trend ? (
          <InsightCard
            icon={
              trend.direction === 'rising' ? (
                <TrendingUp className="w-4.5 h-4.5 text-rose-500" />
              ) : trend.direction === 'falling' ? (
                <TrendingDown className="w-4.5 h-4.5 text-emerald-500" />
              ) : (
                <Minus className="w-4.5 h-4.5 text-rose-400" />
              )
            }
            label={`${getTagLabel(trend.tag)} trend`}
            title={
              trend.direction === 'rising'
                ? 'Severity is climbing'
                : trend.direction === 'falling'
                ? 'Severity is easing'
                : 'Holding steady'
            }
            body={
              trend.direction === 'rising'
                ? `Average severity moved from ${trend.earlyAvg} to ${trend.recentAvg} across your logs.`
                : trend.direction === 'falling'
                ? `Average severity dropped from ${trend.earlyAvg} to ${trend.recentAvg} — that's encouraging.`
                : `Staying around ${trend.recentAvg} on average, no significant shift yet.`
            }
            index={2}
          />
        ) : (
          <InsightCard
            icon={<TrendingUp className="w-4.5 h-4.5 text-rose-400" />}
            label="Severity trend"
            title="Need more logs"
            body="Log the same symptom on 4+ entries so the engine can compare your earlier logs to recent ones."
            footnote="This compares your first half of entries against the second half."
            index={2}
          />
        )}
      </div>

      {/* ─── AI Health Companion & Forecaster ─── */}
      <div className="bg-white/50 backdrop-blur-md border border-rose-200/50 rounded-[2rem] p-6 relative overflow-hidden shadow-soft">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-glow-soft">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-rose-900">AI Health Advisor</h3>
              <p className="text-xs text-rose-500">Forecasting, self-care remedies & clinical flags</p>
            </div>
          </div>

          {apiKey && (
            <button
              onClick={handleRemoveKey}
              className="text-xs font-semibold text-rose-400 hover:text-rose-600 transition-colors"
            >
              Disconnect API Key
            </button>
          )}
        </div>

        {/* Not Configured State */}
        {!apiKey && (
          <div className="space-y-4">
            <p className="text-sm text-rose-700/90 leading-relaxed">
              Unlock local AI forecasting. Paste your Google Gemini API key to receive personalized symptom recurrence predictions, safe behavioral home remedies, and safety flags indicating when you should see a doctor.
            </p>

            {!showKeyInput ? (
              <button
                onClick={() => {
                  setShowKeyInput(true);
                  setKeyInputVal('');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-750 font-semibold text-sm rounded-xl transition-all active:scale-[0.97]"
              >
                <KeyRound className="w-4 h-4" />
                Configure Gemini API Key
              </button>
            ) : (
              <div className="space-y-3 bg-rose-50/50 border border-rose-200/30 rounded-2xl p-4">
                <div className="relative flex items-center">
                  <input
                    type={keyVisible ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    value={keyInputVal}
                    onChange={e => setKeyInputVal(e.target.value)}
                    className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-rose-200 bg-white/80 text-rose-800 font-medium text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setKeyVisible(!keyVisible)}
                    className="absolute right-3.5 text-rose-400 hover:text-rose-600 transition-colors"
                  >
                    {keyVisible ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveKey}
                    disabled={!keyInputVal.trim()}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-all"
                  >
                    Save API Key
                  </button>
                  <button
                    onClick={() => setShowKeyInput(false)}
                    className="px-4 py-2 bg-white hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold text-xs rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="pt-1.5">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors inline-flex items-center gap-0.5"
              >
                Get a free Gemini API key in Google AI Studio &rarr;
              </a>
            </div>
          </div>
        )}

        {/* Configured & Idle State */}
        {apiKey && !generating && !aiReport && (
          <div className="space-y-4">
            <p className="text-sm text-rose-700/90 leading-relaxed">
              API key connected. The system is ready to compile and submit your anonymous symptom logs directly to Gemini 1.5 Flash.
            </p>
            <button
              onClick={handleGenerateAI}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-[0.97]"
            >
              <BrainCircuit className="w-4 h-4" />
              Generate AI Report
            </button>
          </div>
        )}

        {/* Loading State */}
        {generating && (
          <div className="py-8 text-center space-y-4">
            <RefreshCw className="w-7 h-7 text-rose-500 animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-rose-800">{LOADING_STEPS[loadStepIdx]}</p>
              <p className="text-xs text-rose-400">This takes a few seconds via your key</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {genError && (
          <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">AI Analysis Failed</p>
              <p className="mt-0.5 opacity-90">{genError}</p>
              <button
                onClick={handleGenerateAI}
                className="mt-2 font-semibold text-rose-600 hover:text-rose-850 underline transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Report Active State */}
        {apiKey && !generating && aiReport && (
          <div className="space-y-4">
            <div className="border-t border-rose-200/40 pt-4 mt-2">
              {renderedAIReport}
            </div>

            <button
              onClick={handleGenerateAI}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 font-semibold text-xs rounded-lg transition-all active:scale-[0.97]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate Analysis
            </button>
          </div>
        )}
      </div>

      {/* confidence footer */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/40 border border-rose-200/40 rounded-xl text-xs text-rose-400">
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span>
          Local insights are computed in-browser. AI features utilize direct Gemini API connection using your local key, keeping your data confidential.
        </span>
      </div>
    </div>
  );
}

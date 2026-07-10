import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Lightbulb, AlertTriangle, RefreshCw, KeyRound } from 'lucide-react';
import type { Entry } from '../lib/types';
import { generateAIPredictions, getGroqApiKey } from '../lib/groq';

interface AIAssistantProps {
  entries: Entry[];
}

export function AIAssistant({ entries }: AIAssistantProps) {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keyConfigured = !!getGroqApiKey();

  const handleGenerate = async () => {
    if (loading || entries.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const text = await generateAIPredictions(entries);
      setResult(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  if (!keyConfigured) {
    return (
      <div className="bg-white/40 border border-rose-200/50 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100/80 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-rose-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base font-semibold text-rose-800 mb-1">AI Assistant</h3>
            <p className="text-sm text-rose-500 leading-relaxed">
              Set a Groq API key in your <code>.env.local</code> file to unlock symptom predictions, self-care suggestions, and guidance on when to see a doctor.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="gradient-border-animated">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-glow-soft shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-rose-800">AI Insights</h3>
              <p className="text-xs text-rose-500">Patterns, suggestions, and guidance</p>
            </div>
          </div>
          {!result && !loading && (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-semibold rounded-xl hover:from-rose-400 hover:to-rose-500 transition-all active:scale-95 shadow-soft"
            >
              <Sparkles className="w-4 h-4" />
              Analyze
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 flex flex-col items-center gap-3"
            >
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-rose-400 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <p className="text-sm text-rose-500">Analyzing {entries.length} entries...</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-red-700 font-medium">Analysis failed</p>
                <p className="text-red-500 text-xs mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}

          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="prose-sm max-w-none"
            >
              <div className="bg-white/60 border border-rose-200/30 rounded-xl p-4 text-sm text-rose-800 leading-relaxed space-y-3 [&_h1]:font-display [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-rose-800 [&_h1]:mt-4 [&_h1:first-child]:mt-0 [&_h2]:font-display [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-rose-700 [&_h2]:mt-3 [&_h2]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1 [&_li]:text-rose-700 [&_strong]:text-rose-900 [&_p]:text-rose-700 [&_hr]:border-rose-200 [&_hr]:my-3">
                {renderMarkdown(result)}
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-[10px] text-rose-400 italic">
                  Not a diagnosis. Always consult a healthcare provider.
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    line = line.trim();

    if (!line) {
      if (inList) {
        elements.push(<ul key={`ul-${i}`} className="my-1">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      elements.push(<div key={`br-${i}`} className="h-1" />);
      return;
    }

    const headerMatch = line.match(/^###?\s+(.+)/);
    if (headerMatch) {
      if (inList) {
        elements.push(<ul key={`ul-${i}`} className="my-1">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      const isH1 = line.startsWith('## ');
      const content = formatInline(headerMatch[1]);
      if (isH1) {
        elements.push(<h2 key={`h2-${i}`}>{content}</h2>);
      } else {
        elements.push(<h1 key={`h1-${i}`}>{content}</h1>);
      }
      return;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      inList = true;
      listItems.push(
        <li key={`li-${i}`}>{formatInline(line.slice(2))}</li>
      );
      return;
    }

    if (inList) {
      elements.push(<ul key={`ul-${i}`} className="my-1">{listItems}</ul>);
      listItems = [];
      inList = false;
    }

    elements.push(<p key={`p-${i}`}>{formatInline(line)}</p>);
  });

  if (inList) {
    elements.push(<ul key="ul-final" className="my-1">{listItems}</ul>);
  }

  return elements;
}

function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = /\*\*(.+?)\*\*/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

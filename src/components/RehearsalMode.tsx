import { motion } from 'framer-motion';
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { MessageCircle, ChevronRight, RefreshCw, Lightbulb, CheckCircle2, Heart, Mic, MicOff, X } from 'lucide-react';
import type { ComputedStats } from '../lib/types';
import { getTagLabel } from '../lib/tagLabels';
import { EmptyStateIllustration } from './EmptyStateIllustration';

function cardTilt(i: number) {
  const seeds = [-1.6, 1.2, -0.8, 1.8, -1.3];
  return seeds[i % seeds.length];
}

interface RehearsalModeProps {
  stats: ComputedStats | null;
}

export function RehearsalMode({ stats }: RehearsalModeProps) {
  const [isListening, setIsListening] = useState(false);
  const [listeningIndex, setListeningIndex] = useState<number | null>(null);
  const [spokenAnswers, setSpokenAnswers] = useState<Record<number, string>>({});
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const speechSupported = useMemo(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    return !!Ctor;
  }, []);

  const handleVoiceToggle = useCallback((index: number) => {
    if (isListening && listeningIndex === index) {
      recognitionRef.current?.abort();
      setIsListening(false);
      setListeningIndex(null);
      return;
    }

    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    setIsListening(true);
    setListeningIndex(index);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setSpokenAnswers(prev => ({ ...prev, [index]: transcript }));
      setIsListening(false);
      setListeningIndex(null);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setListeningIndex(null);
    };

    recognition.onend = () => {
      setIsListening(false);
      setListeningIndex(null);
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setListeningIndex(null);
    }
  }, [isListening, listeningIndex]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  if (!stats || stats.entry_count < 3) {
    return (
      <div className="text-center py-12 px-6">
        <EmptyStateIllustration variant="dormant-bud" />
        <h3 className="text-xl font-display font-semibold text-rose-950 mb-2">Build Your Data First</h3>
        <p className="text-rose-500 mb-6 max-w-sm mx-auto text-base">
          Log at least 3 symptom entries to unlock Practice Mode and get personalized interview questions
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 rounded-full text-sm text-rose-500 border border-rose-200/50">
          <Heart className="w-4 h-4 text-rose-400" />
          <span className="text-rose-600 font-bold">{stats?.entry_count || 0}/3</span>
          <span>entries needed</span>
        </div>
      </div>
    );
  }

  const questions = generateQuestions(stats);

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-br from-blush-400 to-blush-600 mb-4 shadow-glow-coral bloom">
          <MessageCircle className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-display font-semibold text-rose-950 mb-1">Practice Your Appointment</h3>
        <p className="font-script text-2xl text-rose-400 leading-none mb-2">a few notes before you go in</p>
        <p className="text-sm text-rose-500 max-w-sm mx-auto">
          These questions are based on your logged patterns. Practice answering to feel confident during your visit.
        </p>
      </div>

      {/* Questions — loose index-card layout, each with its own tilt that straightens on hover */}
      <div className="space-y-5 px-1">
        {questions.map((q, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24, rotate: cardTilt(i) * 2.4 }}
            animate={{ opacity: 1, y: 0, rotate: cardTilt(i) }}
            transition={{ delay: i * 0.12, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            whileHover={{ rotate: 0, y: -3, transition: { duration: 0.25 } }}
            className="group origin-bottom"
          >
            <div className="bg-white/80 border border-rose-200/50 hover:border-rose-300/60 rounded-2xl p-5 transition-colors duration-300 hover:bg-white hover:shadow-card shadow-soft">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 border border-rose-200 flex items-center justify-center shadow-soft group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    <span className="text-rose-600 font-bold text-sm">{i + 1}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-rose-950 font-medium mb-2">{q.question}</p>
                  <div className="flex items-center gap-2 text-sm text-rose-400">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500/70 twinkle" />
                    <span className="italic">{q.context}</span>
                  </div>
                  {spokenAnswers[i] && (
                    <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 relative">
                      <div className="flex items-start gap-2">
                        <span className="flex-1">{spokenAnswers[i]}</span>
                        <button
                          onClick={() => setSpokenAnswers(prev => { const n = { ...prev }; delete n[i]; return n; })}
                          className="text-rose-400 hover:text-rose-600 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  {speechSupported && (
                    <button
                      onClick={() => handleVoiceToggle(i)}
                      className={`mt-2 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
                        isListening && listeningIndex === i
                          ? 'bg-coral-500/20 text-coral-600 border border-coral-500/30 voice-pulse'
                          : spokenAnswers[i]
                            ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                            : 'bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600'
                      }`}
                    >
                      {isListening && listeningIndex === i ? (
                        <><MicOff className="w-3.5 h-3.5" /> Stop</>
                      ) : (
                        <><Mic className="w-3.5 h-3.5" /> {spokenAnswers[i] ? 'Re-record' : 'Practice aloud'}</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tips Section */}
      <div className="mt-8 p-5 bg-gradient-to-br from-rose-50/60 to-blush-50/40 border border-rose-200/50 rounded-2xl rise-fade" style={{ animationDelay: '500ms', opacity: 0 }}>
        <h4 className="flex items-center gap-2 text-sm font-bold text-rose-700 mb-3">
          <CheckCircle2 className="w-4 h-4 text-rose-500" />
          Tips for Your Appointment
        </h4>
        <ul className="space-y-2.5 text-sm text-rose-600">
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <span>Be specific about timing — "every morning for 3 weeks" is more useful than "sometimes"</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <span>Describe severity in impact terms — "keeps me from working" vs "just annoying"</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <span>Mention what makes it better or worse, even if you discovered it by accident</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <span>Your Case File has exact numbers your doctor will want to know</span>
          </li>
        </ul>
      </div>

      {/* Regenerate */}
      <div className="text-center pt-4">
        <button
          onClick={() => window.location.reload()}
          className="group inline-flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white text-rose-500 hover:text-rose-800 rounded-full text-sm transition-all border border-rose-200/50 hover:scale-105"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          New Questions
        </button>
      </div>
    </div>
  );
}

function generateQuestions(stats: ComputedStats): { question: string; context: string }[] {
  const questions: { question: string; context: string }[] = [];

  const topTags = stats.tag_frequency.filter(t => t.tag !== 'other');
  if (topTags.length > 0) {
    const top = topTags[0];
    const label = getTagLabel(top.tag);
    questions.push({
      question: `You mentioned ${label.toLowerCase()} ${top.count} time${top.count > 1 ? 's' : ''}. Can you describe what a typical episode feels like?`,
      context: `${top.count} occurrences logged`
    });
  }

  if (topTags.length > 1) {
    const second = topTags[1];
    const label = getTagLabel(second.tag);
    questions.push({
      question: `How does ${label.toLowerCase()} compare in severity to other symptoms you've tracked?`,
      context: `${second.count} occurrences, second most frequent`
    });
  }

  const strongCo = stats.co_occurrence.find(c => !c.low_confidence && c.n >= 3);
  if (strongCo) {
    const tagA = getTagLabel(strongCo.tag_a);
    const tagB = getTagLabel(strongCo.tag_b);
    questions.push({
      question: `${tagA} and ${tagB} tended to show up within about ${strongCo.lag_days_avg.toFixed(0)} days of each other. Do you notice these happening together?`,
      context: `${strongCo.n} co-occurrences detected`
    });
  }

  const sev = stats.severity_by_tag.find(s => !s.low_confidence && s.avg_severity >= 3);
  if (sev) {
    const label = getTagLabel(sev.tag);
    questions.push({
      question: `Your ${label.toLowerCase()} averaged ${sev.avg_severity.toFixed(1)} out of 5 in severity. What does that look like in your daily life?`,
      context: `Average severity across ${sev.n} entries`
    });
  }

  if (stats.cycle_day_correlation && stats.cycle_day_correlation.length > 0) {
    const corr = stats.cycle_day_correlation[0];
    const label = getTagLabel(corr.tag);
    questions.push({
      question: `There's a pattern of ${label.toLowerCase()} around cycle day ${Math.round(corr.avg_cycle_day)}. Has this always tracked with your cycle?`,
      context: `Cycle day correlation detected`
    });
  }

  if (questions.length < 3) {
    questions.push({
      question: "Is there anything you've noticed that hasn't come up in your logged entries yet?",
      context: 'General exploration'
    });
  }

  return questions.slice(0, 4);
}

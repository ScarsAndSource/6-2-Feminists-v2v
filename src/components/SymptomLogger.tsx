import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Check, X, ChevronDown, ChevronUp, ChevronRight, Sparkles, Undo2, AlertCircle, History } from 'lucide-react';
import { TAG_VOCABULARY, TAG_LABELS, SEVERITY_LABELS, type TagEntry, type CustomTag } from '../lib/types';
import type { Entry } from '../lib/types';
import { getTagLabel, slugifyCustomTag } from '../lib/tagLabels';

interface SymptomLoggerProps {
  onSubmit: (tags: TagEntry[], cycleDay?: number) => Promise<Entry | void>;
  onDelete: (id: string) => Promise<void>;
  customTags: CustomTag[];
  disabled?: boolean;
  onFocusChange?: (focused: boolean) => void;
  lastEntry?: Entry | null;
  tagFrequency?: Record<string, number>;
  previousOtherNotes?: string[];
}

const SYMPTOM_CATEGORIES = {
  pain: ['pelvic_pain', 'joint_pain', 'headache', 'back_pain'],
  energy: ['fatigue', 'brain_fog', 'sleep_disturbance', 'dizziness'],
  digestive: ['bloating', 'nausea', 'digestive_issue'],
  physical: ['skin_change', 'hair_loss', 'fever'],
  emotional: ['mood_change'],
  other: ['other']
};

const CATEGORY_LABELS: Record<string, string> = {
  pain: 'Pain & Discomfort',
  energy: 'Energy & Focus',
  digestive: 'Digestive',
  physical: 'Physical Changes',
  emotional: 'Emotional',
  other: 'Other'
};

const UNDO_WINDOW_MS = 8000;
const VOICE_ERROR_DISPLAY_MS = 5000;

function describeVoiceError(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'permission-denied':
      return "Microphone access was denied — you can still tap symptoms manually below.";
    case 'no-speech':
      return "Didn't catch anything — try again, or tap symptoms manually.";
    case 'audio-capture':
      return 'No microphone found — tap symptoms manually instead.';
    case 'network':
      return 'Voice input needs a live connection — tap symptoms manually instead.';
    case 'aborted':
      return '';
    default:
      return "Voice input didn't work that time — tap symptoms manually instead.";
  }
}

export function SymptomLogger({ onSubmit, onDelete, customTags, disabled, onFocusChange, lastEntry, tagFrequency, previousOtherNotes }: SymptomLoggerProps) {
  const [selectedTags, setSelectedTags] = useState<Map<string, TagEntry>>(new Map());
  const [cycleDay, setCycleDay] = useState<number | ''>('');
  const [otherText, setOtherText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showCycleInput, setShowCycleInput] = useState(false);

  const [undoEntryId, setUndoEntryId] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);

  const voiceErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (voiceErrorTimerRef.current) clearTimeout(voiceErrorTimerRef.current);
    };
  }, []);

  const prevSelectedRef = useRef(0);
  useEffect(() => {
    const hasSelected = selectedTags.size > 0;
    if (hasSelected !== (prevSelectedRef.current > 0)) {
      onFocusChange?.(hasSelected);
    }
    prevSelectedRef.current = selectedTags.size;
  }, [selectedTags.size, onFocusChange]);

  useEffect(() => {
    if (lastEntry?.cycle_day && cycleDay === '') {
      const suggested = Math.min(lastEntry.cycle_day + 1, 28);
      setCycleDay(suggested);
      setShowCycleInput(true);
    }
  }, [lastEntry?.cycle_day]);

  const speechSupported = useMemo(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    return !!SpeechRecognitionCtor;
  }, []);

  const handleTagClick = useCallback((tag: string) => {
    setSelectedTags(prev => {
      const newMap = new Map(prev);
      if (newMap.has(tag)) {
        newMap.delete(tag);
      } else {
        newMap.set(tag, { tag, severity: 3 });
      }
      return newMap;
    });
  }, []);

  const handleSeverityChange = useCallback((tag: string, severity: number) => {
    setSelectedTags(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(tag);
      if (existing) newMap.set(tag, { ...existing, severity });
      return newMap;
    });
  }, []);

  const handleOtherTextChange = useCallback((text: string) => {
    setOtherText(text);
    if (text.trim()) {
      setSelectedTags(prev => {
        const newMap = new Map(prev);
        newMap.set('other', { tag: 'other', severity: 3, note: text.trim() });
        return newMap;
      });
    } else {
      setSelectedTags(prev => {
        const newMap = new Map(prev);
        newMap.delete('other');
        return newMap;
      });
    }
  }, []);

  const handleSubmit = async () => {
    if (selectedTags.size === 0) return;

    setSubmitting(true);
    try {
      const tags = Array.from(selectedTags.values());
      const inserted = await onSubmit(tags, cycleDay === '' ? undefined : Number(cycleDay));

      if (inserted && 'id' in inserted) {
        setUndoEntryId(inserted.id);
        setTimeout(() => {
          setUndoEntryId(current => (current === inserted.id ? null : current));
        }, UNDO_WINDOW_MS);
      }

      setSelectedTags(new Map());
      setCycleDay('');
      setOtherText('');
      setShowCycleInput(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (!undoEntryId || undoing) return;
    setUndoing(true);
    try {
      await onDelete(undoEntryId);
    } finally {
      setUndoEntryId(null);
      setUndoing(false);
    }
  };

  const showVoiceError = useCallback((message: string) => {
    if (!message) return;
    setVoiceError(message);
    if (voiceErrorTimerRef.current) clearTimeout(voiceErrorTimerRef.current);
    voiceErrorTimerRef.current = setTimeout(() => setVoiceError(null), VOICE_ERROR_DISPLAY_MS);
  }, []);

  const handleVoiceInput = useCallback(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    setVoiceError(null);
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setIsListening(false);

      let matched = false;

      for (const tag of TAG_VOCABULARY) {
        if (tag === 'other') continue;
        const label = TAG_LABELS[tag].toLowerCase();
        if (transcript.includes(label) || transcript.includes(tag.replace('_', ' '))) {
          if (!selectedTags.has(tag)) handleTagClick(tag);
          matched = true;
        }
      }

      for (const custom of customTags) {
        const key = slugifyCustomTag(custom.label);
        if (transcript.includes(custom.label.toLowerCase())) {
          if (!selectedTags.has(key)) handleTagClick(key);
          matched = true;
        }
      }

      if (!matched && transcript) {
        setOtherText(transcript);
        handleOtherTextChange(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      showVoiceError(describeVoiceError(event.error));
    };

    recognition.onend = () => setIsListening(false);

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      showVoiceError(describeVoiceError('unknown'));
    }
  }, [selectedTags, customTags, handleTagClick, handleOtherTextChange, showVoiceError]);

  const selectedArray = Array.from(selectedTags.values());

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        {lastEntry && lastEntry.tags.length > 0 && selectedTags.size === 0 && (
          <button
            onClick={() => {
              const map = new Map<string, TagEntry>();
              for (const t of lastEntry.tags) {
                map.set(t.tag, t);
              }
              setSelectedTags(map);
            }}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-200/50 text-sm text-rose-600 hover:bg-rose-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Same as last time ({lastEntry.tags.length} symptom{lastEntry.tags.length > 1 ? 's' : ''})</span>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </button>
        )}
        {Object.entries(SYMPTOM_CATEGORIES).map(([category, tags]) => (
          <div key={category}>
            <h4 className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-3">
              {CATEGORY_LABELS[category]}
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {[...tags]
                .sort((a, b) => (tagFrequency?.[b] ?? 0) - (tagFrequency?.[a] ?? 0))
                .map(tag => (
                <SymptomTag
                  key={tag}
                  tag={tag}
                  isSelected={selectedTags.has(tag)}
                  severity={selectedTags.get(tag)?.severity}
                  onClick={() => handleTagClick(tag)}
                  onSeverityChange={(sev) => handleSeverityChange(tag, sev)}
                  disabled={disabled}
                  otherText={tag === 'other' ? otherText : undefined}
                  onOtherTextChange={tag === 'other' ? handleOtherTextChange : undefined}
                  previousOtherNotes={tag === 'other' ? previousOtherNotes : undefined}
                />
              ))}
            </div>
          </div>
        ))}

        {customTags.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-rose-400 uppercase tracking-wider mb-3">
              Your Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {customTags.map(custom => {
                const key = slugifyCustomTag(custom.label);
                return (
                  <SymptomTag
                    key={custom.id}
                    tag={key}
                    isSelected={selectedTags.has(key)}
                    severity={selectedTags.get(key)?.severity}
                    onClick={() => handleTagClick(key)}
                    onSeverityChange={(sev) => handleSeverityChange(key, sev)}
                    disabled={disabled}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowCycleInput(!showCycleInput)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              showCycleInput || cycleDay
                ? 'bg-rose-100 text-rose-500 border border-rose-300/50'
                : 'bg-rose-100/50 text-rose-400 hover:text-rose-700 hover:bg-rose-200'
            }`}
          >
            {showCycleInput ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>Cycle Day</span>
            {cycleDay && <span className="text-rose-500 font-medium ml-1">· {cycleDay}</span>}
          </button>

          {speechSupported && (
            <button
              onClick={handleVoiceInput}
              disabled={disabled || isListening}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                isListening
                  ? 'bg-coral-500/20 text-coral-400 border border-coral-500/30 voice-pulse'
                  : 'bg-rose-100/50 text-rose-400 hover:text-rose-700 hover:bg-rose-200'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isListening ? 'Listening...' : 'Voice'}</span>
            </button>
          )}
        </div>

        {voiceError && (
          <div className="flex items-start gap-2 px-3 py-2 bg-coral-500/10 border border-coral-500/20 rounded-lg text-xs text-coral-300 animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{voiceError}</span>
          </div>
        )}
      </div>

      {showCycleInput && (
        <div className="animate-slide-down bg-rose-100/50 rounded-xl p-4 border border-rose-200/50">
          <label className="text-sm text-rose-500 mb-2 block">
            Day of menstrual cycle (optional)
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-rose-100 rounded-lg p-1">
              {[1, 2, 3, 4].map(week => (
                <div key={week} className="flex flex-col">
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3, 4, 5, 6].map(day => {
                      const dayNum = (week - 1) * 7 + day + 1;
                      if (dayNum > 28) return null;
                      const isSelected = cycleDay === dayNum;
                      return (
                        <button
                          key={day}
                          onClick={() => setCycleDay(dayNum)}
                          className={`w-7 h-7 rounded text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-rose-400 text-white'
                              : 'hover:bg-rose-200 text-rose-400 hover:text-rose-700'
                          }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setCycleDay('')} className="text-xs text-rose-400 hover:text-rose-600">
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {selectedArray.length > 0 && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 p-3 bg-rose-100/50 rounded-xl border border-rose-200/50 overflow-hidden"
            >
              <AnimatePresence mode="popLayout">
                {selectedArray.map((entry) => (
                  <motion.div
                    key={entry.tag}
                    layout
                    initial={{ opacity: 0, scale: 0.6, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, filter: 'blur(2px)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                    className="flex items-center gap-1.5 bg-rose-200 rounded-lg px-2 py-1 text-sm"
                  >
                    <span className="text-rose-800">
                      {entry.tag === 'other' ? `"${entry.note?.slice(0, 12)}..."` : getTagLabel(entry.tag)}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 font-medium">
                      {entry.severity}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleSubmit}
          disabled={disabled || submitting || selectedTags.size === 0}
          className="group relative w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-glow disabled:shadow-none flex items-center justify-center gap-3 text-lg overflow-hidden"
        >
          {submitting ? (
            <>
              <motion.div
                className="absolute inset-0 bg-white/15"
                initial={{ scale: 0, borderRadius: '999px' }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Logging...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={selectedTags.size}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  Log {selectedTags.size > 0 ? `${selectedTags.size} Symptom${selectedTags.size > 1 ? 's' : ''}` : 'Symptoms'}
                </motion.span>
              </AnimatePresence>
            </>
          )}
        </button>
      </div>

      {selectedTags.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-rose-50/95 backdrop-blur-md border-t border-rose-200/50 px-4 py-3 sm:py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <span className="text-sm text-rose-500">
              <span className="font-semibold text-rose-800">{selectedTags.size}</span> selected
            </span>
            <button
              onClick={handleSubmit}
              disabled={disabled || submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center gap-2"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Logging...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Log {selectedTags.size} Symptom{selectedTags.size > 1 ? 's' : ''}</>
              )}
            </button>
          </div>
        </div>
      )}

      {undoEntryId && (
        <div className={`fixed ${selectedTags.size > 0 ? 'bottom-20' : 'bottom-6'} left-1/2 -translate-x-1/2 z-50 toast`}>
          <div className="flex items-center gap-3 bg-rose-100 border border-rose-200 rounded-2xl px-5 py-3 shadow-2xl">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-rose-500" />
            </div>
            <span className="text-sm text-rose-800 font-medium">Symptoms logged</span>
            <button
              onClick={handleUndo}
              disabled={undoing}
              className="flex items-center gap-1.5 text-sm font-semibold text-rose-500 hover:text-rose-600 disabled:opacity-50 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              {undoing ? 'Undoing...' : 'Undo'}
            </button>
            <button
              onClick={() => setUndoEntryId(null)}
              className="text-rose-400 hover:text-rose-600 transition-colors"
              title="Dismiss (keeps the entry)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SymptomTag({
  tag,
  isSelected,
  severity,
  onClick,
  onSeverityChange,
  disabled,
  otherText,
  onOtherTextChange,
  previousOtherNotes
}: {
  tag: string;
  isSelected: boolean;
  severity?: number;
  onClick: () => void;
  onSeverityChange: (severity: number) => void;
  disabled?: boolean;
  otherText?: string;
  onOtherTextChange?: (text: string) => void;
  previousOtherNotes?: string[];
}) {
  const label = getTagLabel(tag);
  const severityBarRef = useRef<HTMLDivElement>(null);
  const [isDraggingSeverity, setIsDraggingSeverity] = useState(false);

  const handleSeverityPointerDown = useCallback((e: React.PointerEvent) => {
    const bar = severityBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const sev = Math.max(1, Math.min(5, Math.ceil((x / rect.width) * 5)));
    onSeverityChange(sev);
    setIsDraggingSeverity(true);
    bar.setPointerCapture(e.pointerId);
  }, [onSeverityChange]);

  const handleSeverityPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingSeverity) return;
    const bar = severityBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const sev = Math.max(1, Math.min(5, Math.ceil((x / rect.width) * 5)));
    onSeverityChange(sev);
  }, [isDraggingSeverity, onSeverityChange]);

  const handleSeverityPointerUp = useCallback(() => {
    setIsDraggingSeverity(false);
  }, []);

  const matchingSuggestions = useMemo(() => {
    if (!previousOtherNotes || !otherText || otherText.trim().length < 1) return [];
    const lower = otherText.toLowerCase();
    const seen = new Set<string>();
    return previousOtherNotes
      .filter(n => n.toLowerCase().includes(lower) && !seen.has(n) && seen.add(n))
      .slice(0, 4);
  }, [previousOtherNotes, otherText]);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`tag-button min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 ${
          isSelected
            ? 'bg-rose-500/20 text-rose-600 border border-rose-500/40'
            : 'bg-rose-100/50 text-rose-500 hover:text-rose-700 hover:bg-rose-200 border border-transparent'
        }`}
      >
        {label}
      </button>

      {isSelected && severity && tag !== 'other' && (
        <div
          ref={severityBarRef}
          onPointerDown={handleSeverityPointerDown}
          onPointerMove={handleSeverityPointerMove}
          onPointerUp={handleSeverityPointerUp}
          onPointerLeave={handleSeverityPointerUp}
          className="relative w-28 h-8 bg-rose-200 rounded-xl overflow-hidden cursor-pointer select-none animate-scale-in touch-none"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-xl transition-[width] duration-75"
            style={{
              width: `${(severity / 5) * 100}%`,
              background: `linear-gradient(90deg, rgba(190,18,60,0.4) 0%, rgba(190,18,60,0.7) 100%)`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-rose-900 pointer-events-none">
            {severity} — {SEVERITY_LABELS[severity]}
          </div>
        </div>
      )}

      {isSelected && tag === 'other' && onOtherTextChange && (
        <div className="relative">
          <input
            type="text"
            value={otherText || ''}
            onChange={e => onOtherTextChange(e.target.value)}
            placeholder="Describe..."
            disabled={disabled}
            className="w-32 px-2 py-1 bg-rose-50 border border-rose-300 rounded-lg text-sm text-rose-800 placeholder-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-500 animate-scale-in"
            autoFocus
            maxLength={60}
          />
          {matchingSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-rose-50 border border-rose-200 rounded-lg overflow-hidden shadow-xl z-20">
              {matchingSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onOtherTextChange(s)}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-200 hover:text-rose-800 transition-colors flex items-center gap-1.5"
                >
                  <History className="w-3 h-3 shrink-0 text-rose-400" />
                  <span className="truncate">{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

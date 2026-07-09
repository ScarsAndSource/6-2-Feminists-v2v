import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Mic, MicOff, Check, X, ChevronDown, ChevronUp, Sparkles, Undo2, Heart, AlertCircle } from 'lucide-react';
import { TAG_VOCABULARY, TAG_LABELS, SEVERITY_LABELS, type TagEntry } from '../lib/types';
import type { Entry } from '../lib/types';

interface SymptomLoggerProps {
  onSubmit: (tags: TagEntry[], cycleDay?: number) => Promise<Entry | void>;
  onDelete: (id: string) => Promise<void>;
  disabled?: boolean;
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

export function SymptomLogger({ onSubmit, onDelete, disabled }: SymptomLoggerProps) {
  const [selectedTags, setSelectedTags] = useState<Map<string, TagEntry>>(new Map());
  const [cycleDay, setCycleDay] = useState<number | ''>('');
  const [otherText, setOtherText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showCycleInput, setShowCycleInput] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const voiceErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (voiceErrorTimerRef.current) clearTimeout(voiceErrorTimerRef.current);
    };
  }, []);

  const [undoEntryId, setUndoEntryId] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);

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
      if (existing) {
        newMap.set(tag, { ...existing, severity });
      }
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

  const showVoiceErrorMsg = useCallback((message: string) => {
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
          if (!selectedTags.has(tag)) {
            handleTagClick(tag);
          }
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
      showVoiceErrorMsg(describeVoiceError(event.error));
    };

    recognition.onend = () => setIsListening(false);

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      showVoiceErrorMsg(describeVoiceError('unknown'));
    }
  }, [selectedTags, handleTagClick, handleOtherTextChange, showVoiceErrorMsg]);

  const selectedArray = Array.from(selectedTags.values());

  return (
    <div className="space-y-8">
      {/* Symptom Grid */}
      <div className="space-y-6">
        {Object.entries(SYMPTOM_CATEGORIES).map(([category, tags], catIndex) => (
            <div
              key={category}
              className="rise-fade"
              style={{ animationDelay: `${catIndex * 80}ms`, opacity: 0 }}
            >
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3">
                {CATEGORY_LABELS[category]}
              </h4>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
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
                  />
                ))}
              </div>
            </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowCycleInput(!showCycleInput)}
          className={`group flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105 ${
            showCycleInput || cycleDay
              ? 'bg-rose-100 text-rose-700 border border-rose-300 shadow-soft'
              : 'bg-rose-50 text-rose-500 hover:text-rose-700 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          {showCycleInput ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>Cycle Day</span>
          {cycleDay && <span className="text-rose-600 font-bold ml-1">· {cycleDay}</span>}
        </button>

        {speechSupported && (
          <button
            onClick={handleVoiceInput}
            disabled={disabled || isListening}
            className={`group flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105 ${
              isListening
                ? 'bg-blush-500/20 text-blush-600 border border-blush-400 voice-pulse'
                : 'bg-rose-50 text-rose-500 hover:text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 group-hover:sway" />}
            <span>{isListening ? 'Listening...' : 'Voice'}</span>
          </button>
        )}
      </div>

      {/* Voice error — previously silent. Manual tap entry works regardless. */}
      {voiceError && (
        <div className="flex items-start gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{voiceError}</span>
        </div>
      )}

      {/* Cycle Day Input */}
      {showCycleInput && (
        <div className="animate-slide-down bg-gradient-to-br from-rose-50 to-blush-50 rounded-2xl p-4 border border-rose-200/60 shadow-soft">
          <label className="text-sm text-rose-600 mb-3 block font-medium flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-400" />
            Day of menstrual cycle (optional)
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white rounded-xl p-1.5 shadow-soft">
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
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all hover:scale-110 ${
                            isSelected
                              ? 'bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-glow-soft scale-110'
                              : 'hover:bg-rose-100 text-rose-500 hover:text-rose-700'
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
            <button
              onClick={() => setCycleDay('')}
              className="text-xs text-rose-400 hover:text-rose-600 font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Submit Section */}
      <div className="space-y-4">
        {/* Selected Summary */}
        {selectedArray.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-gradient-to-r from-rose-50 to-blush-50 rounded-2xl border border-rose-200/60 animate-scale-in">
            {selectedArray.map((entry, i) => (
              <div
                key={entry.tag}
                className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-1.5 text-sm shadow-soft rise-fade"
                style={{ animationDelay: `${i * 50}ms`, opacity: 0 }}
              >
                <span className="text-rose-900 font-medium">
                  {entry.tag === 'other' ? `"${entry.note?.slice(0, 12)}..."` : TAG_LABELS[entry.tag]}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-100 to-rose-200 text-rose-600 font-bold">
                  {entry.severity}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || submitting || selectedTags.size === 0}
          className="group w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 disabled:from-rose-200 disabled:to-rose-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all duration-300 shadow-glow disabled:shadow-none flex items-center justify-center gap-3 text-lg hover:scale-[1.02] hover:shadow-petal shimmer-overlay"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Logging...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 group-hover:twinkle" />
              <span>Log {selectedTags.size > 0 ? `${selectedTags.size} Symptom${selectedTags.size > 1 ? 's' : ''}` : 'Symptoms'}</span>
            </>
          )}
        </button>
      </div>

      {/* Success Toast — now with a real Undo action */}
      {undoEntryId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 toast">
          <div className="flex items-center gap-3 bg-white border border-rose-200 rounded-2xl px-5 py-3 shadow-card">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-glow-soft">
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-rose-900 font-semibold">Symptoms logged</span>
            <button
              onClick={handleUndo}
              disabled={undoing}
              className="flex items-center gap-1.5 text-sm font-bold text-rose-600 hover:text-rose-800 disabled:opacity-50 transition-colors"
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
  onOtherTextChange
}: {
  tag: string;
  isSelected: boolean;
  severity?: number;
  onClick: () => void;
  onSeverityChange: (severity: number) => void;
  disabled?: boolean;
  otherText?: string;
  onOtherTextChange?: (text: string) => void;
}) {
  const label = TAG_LABELS[tag] || tag;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`tag-button shimmer-overlay px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 ${
          isSelected
            ? 'bg-gradient-to-br from-rose-400/20 to-rose-500/20 text-rose-700 border border-rose-400/40 shadow-soft scale-105'
            : 'bg-white/60 text-rose-500 hover:text-rose-800 hover:bg-white border border-rose-200/50'
        }`}
      >
        {label}
      </button>

      {isSelected && severity && tag !== 'other' && (
        <div className="flex items-center bg-white rounded-xl p-0.5 shadow-soft animate-scale-in border border-rose-200/50">
          {[1, 2, 3, 4, 5].map(sev => (
            <button
              key={sev}
              onClick={() => onSeverityChange(sev)}
              className={`severity-pill w-6 h-6 rounded-lg text-xs font-bold transition-all ${
                severity === sev
                  ? 'active bg-gradient-to-br from-rose-400 to-rose-600 text-white'
                  : 'text-rose-400 hover:text-rose-600 hover:bg-rose-100'
              }`}
              title={SEVERITY_LABELS[sev]}
            >
              {sev}
            </button>
          ))}
        </div>
      )}

      {isSelected && tag === 'other' && onOtherTextChange && (
        <input
          type="text"
          value={otherText || ''}
          onChange={e => onOtherTextChange(e.target.value)}
          placeholder="Describe..."
          disabled={disabled}
          className="w-32 px-2.5 py-1.5 bg-white border border-rose-200 rounded-xl text-sm text-rose-900 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400/50 animate-scale-in"
          autoFocus
          maxLength={60}
        />
      )}
    </div>
  );
}

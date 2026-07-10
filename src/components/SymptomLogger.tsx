import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Mic, MicOff, Check, X, ChevronDown, ChevronUp, Sparkles, Undo2, AlertCircle } from 'lucide-react';
import { TAG_VOCABULARY, TAG_LABELS, SEVERITY_LABELS, type TagEntry, type CustomTag } from '../lib/types';
import type { Entry } from '../lib/types';
import { getTagLabel, slugifyCustomTag } from '../lib/tagLabels';

interface SymptomLoggerProps {
  onSubmit: (tags: TagEntry[], cycleDay?: number) => Promise<Entry | void>;
  onDelete: (id: string) => Promise<void>;
  customTags: CustomTag[];
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

export function SymptomLogger({ onSubmit, onDelete, customTags, disabled }: SymptomLoggerProps) {
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
        {Object.entries(SYMPTOM_CATEGORIES).map(([category, tags]) => (
          <div key={category}>
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
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

        {customTags.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
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
                ? 'bg-slate-800 text-teal-400 border border-teal-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {showCycleInput ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>Cycle Day</span>
            {cycleDay && <span className="text-teal-400 font-medium ml-1">· {cycleDay}</span>}
          </button>

          {speechSupported && (
            <button
              onClick={handleVoiceInput}
              disabled={disabled || isListening}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                isListening
                  ? 'bg-coral-500/20 text-coral-400 border border-coral-500/30 voice-pulse'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800'
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
        <div className="animate-slide-down bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <label className="text-sm text-slate-400 mb-2 block">
            Day of menstrual cycle (optional)
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1">
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
                              ? 'bg-teal-500 text-white'
                              : 'hover:bg-slate-800 text-slate-500 hover:text-white'
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
            <button onClick={() => setCycleDay('')} className="text-xs text-slate-500 hover:text-slate-300">
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {selectedArray.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-slate-800/30 rounded-xl border border-slate-700/30">
            {selectedArray.map(entry => (
              <div key={entry.tag} className="flex items-center gap-1.5 bg-slate-900 rounded-lg px-2 py-1 text-sm">
                <span className="text-white">
                  {entry.tag === 'other' ? `"${entry.note?.slice(0, 12)}..."` : getTagLabel(entry.tag)}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400 font-medium">
                  {entry.severity}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={disabled || submitting || selectedTags.size === 0}
          className="w-full py-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-glow disabled:shadow-none flex items-center justify-center gap-3 text-lg"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Logging...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Log {selectedTags.size > 0 ? `${selectedTags.size} Symptom${selectedTags.size > 1 ? 's' : ''}` : 'Symptoms'}</span>
            </>
          )}
        </button>
      </div>

      {undoEntryId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 toast">
          <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 shadow-2xl">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-teal-400" />
            </div>
            <span className="text-sm text-white font-medium">Symptoms logged</span>
            <button
              onClick={handleUndo}
              disabled={undoing}
              className="flex items-center gap-1.5 text-sm font-semibold text-teal-400 hover:text-teal-300 disabled:opacity-50 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              {undoing ? 'Undoing...' : 'Undo'}
            </button>
            <button
              onClick={() => setUndoEntryId(null)}
              className="text-slate-500 hover:text-white transition-colors"
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
  const label = getTagLabel(tag);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`tag-button px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          isSelected
            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
            : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
        }`}
      >
        {label}
      </button>

      {isSelected && severity && tag !== 'other' && (
        <div className="flex items-center bg-slate-800 rounded-lg p-0.5 animate-scale-in">
          {[1, 2, 3, 4, 5].map(sev => (
            <button
              key={sev}
              onClick={() => onSeverityChange(sev)}
              className={`severity-pill w-6 h-6 rounded-md text-xs font-medium transition-all ${
                severity === sev ? 'active bg-teal-500 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-700'
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
          className="w-32 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 animate-scale-in"
          autoFocus
          maxLength={60}
        />
      )}
    </div>
  );
}

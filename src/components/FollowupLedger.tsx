import { useState } from 'react';
import { Check, MessageSquareText } from 'lucide-react';
import { useFollowups } from '../hooks/useFollowups';
import type { FollowupOutcome } from '../lib/types';

const OUTCOME_OPTIONS: { value: FollowupOutcome; label: string }[] = [
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'tested', label: 'Tested' },
  { value: 'treated', label: 'Treated' },
  { value: 'no_follow_up', label: 'No follow-up' }
];

interface FollowupLedgerProps {
  patternReportId: string | null;
}

export function FollowupLedger({ patternReportId }: FollowupLedgerProps) {
  const { followups, addFollowup } = useFollowups();
  const [mentionedBefore, setMentionedBefore] = useState<boolean | null>(null);
  const [outcome, setOutcome] = useState<FollowupOutcome | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (mentionedBefore === null) return;
    setSaving(true);
    try {
      await addFollowup({
        patternReportId,
        mentionedBefore,
        outcome: mentionedBefore ? outcome : null,
        outcomeNote: note.trim() || undefined
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 border-t border-rose-200/50 pt-4 no-print">
      {!saved ? (
        <div className="bg-rose-100/50 border border-rose-200/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-rose-800">
            <MessageSquareText className="w-4 h-4 text-rose-400" />
            Have you mentioned this to a doctor before? (optional)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMentionedBefore(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mentionedBefore === true
                  ? 'bg-rose-500/20 text-rose-600 border border-rose-500/40'
                  : 'bg-rose-100/50 text-rose-400 border border-transparent hover:text-rose-700'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => setMentionedBefore(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mentionedBefore === false
                  ? 'bg-rose-500/20 text-rose-600 border border-rose-500/40'
                  : 'bg-rose-100/50 text-rose-400 border border-transparent hover:text-rose-700'
              }`}
            >
              No, first time
            </button>
          </div>

          {mentionedBefore === true && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex flex-wrap gap-2">
                {OUTCOME_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setOutcome(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      outcome === opt.value
                        ? 'bg-rose-400 text-white'
                        : 'bg-rose-100 text-rose-400 hover:text-rose-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="What did they say? (optional)"
                maxLength={200}
                className="w-full px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800 placeholder-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          )}

          {mentionedBefore !== null && (
            <button
              onClick={handleSave}
              disabled={saving || (mentionedBefore === true && !outcome)}
              className="w-full py-2 bg-rose-500 hover:bg-rose-400 disabled:bg-rose-200 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-rose-500 px-1">
          <Check className="w-4 h-4" />
          Logged to your follow-up history
        </div>
      )}

      {followups.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-rose-400 uppercase tracking-wider mb-2">
            Follow-up history
          </h4>
          <div className="space-y-1.5">
            {followups.slice(0, 5).map(f => (
              <div key={f.id} className="flex items-center gap-2 text-xs text-rose-500 bg-rose-100/40 rounded-lg px-3 py-2">
                <span className="text-rose-400">
                  {new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span>
                  {f.mentioned_before
                    ? `Mentioned before — ${OUTCOME_OPTIONS.find(o => o.value === f.outcome)?.label ?? f.outcome}`
                    : 'First time mentioning this'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

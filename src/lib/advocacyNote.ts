import { supabase } from './supabase';
import type { AdvocacyStatsContext, AdvocacyFollowupContext } from './advocacyContext';

export interface AdvocacyNoteResult {
  text: string;
  provider: 'groq' | 'gemini' | 'template';
}

const CLIENT_TIMEOUT_MS = 20000;

class TimeoutError extends Error {
  constructor() {
    super('client-side timeout waiting for advocacy-note');
    this.name = 'TimeoutError';
  }
}

function withClientTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);
    promise.then(r => { clearTimeout(timer); resolve(r); }).catch(e => { clearTimeout(timer); reject(e); });
  });
}

const OUTCOME_ASKS: Record<string, string> = {
  'dismissed / told it was likely nothing': "I'd like this looked into further, whether that's testing or a referral.",
  'tested, with normal/inconclusive results': "given how often this keeps recurring despite normal results, I'd like to talk through what the next step looks like.",
  'treated, but the issue continued': "the treatment we tried hasn't resolved this, so I'd like to revisit it.",
  'raised, with no clear next step given': "I'd like a clear next step this time, even if it's just a plan for what we watch for."
};

function deterministicAdvocacyNote(stats: AdvocacyStatsContext, followup: AdvocacyFollowupContext): string {
  const subject = followup.tag_label || stats.top_tags[0]?.label || 'this';
  const lines: string[] = [];

  lines.push(
    `I'm following up on something I've raised before. Regarding ${subject.toLowerCase()}, it was ${followup.outcome || 'raised without a clear resolution'}.`
  );

  const matchingFreq = stats.top_tags.find(t => t.label.toLowerCase() === subject.toLowerCase());
  if (matchingFreq) {
    lines.push(`Since then, I've logged it ${matchingFreq.count} times across ${stats.entry_count} entries.`);
  } else {
    lines.push(`Since then, I've continued tracking my symptoms — ${stats.entry_count} entries logged in total.`);
  }

  if (stats.coverage_gap) {
    lines.push('There have been some gaps in my tracking, so this may understate how often it has actually happened.');
  }

  const ask = (followup.outcome && OUTCOME_ASKS[followup.outcome]) || "I'd like to discuss a clear next step.";
  lines.push(ask.charAt(0).toUpperCase() + ask.slice(1));

  return lines.join(' ');
}

export async function generateAdvocacyNote(
  stats: AdvocacyStatsContext,
  followup: AdvocacyFollowupContext
): Promise<AdvocacyNoteResult> {
  try {
    const { data, error } = await withClientTimeout(
      supabase.functions.invoke<{ note: string | null; provider: 'groq' | 'gemini' | 'template' }>(
        'advocacy-note',
        { body: { context: { stats, followup } } }
      ),
      CLIENT_TIMEOUT_MS
    );

    if (error) throw error;

    if (data && data.note && data.provider !== 'template') {
      return { text: data.note, provider: data.provider };
    }
  } catch (err) {
    console.warn(
      '[advocacy-note] generation failed, using local template:',
      err instanceof TimeoutError ? 'client-side timeout' : err instanceof Error ? err.message : err
    );
  }

  return { text: deterministicAdvocacyNote(stats, followup), provider: 'template' };
}

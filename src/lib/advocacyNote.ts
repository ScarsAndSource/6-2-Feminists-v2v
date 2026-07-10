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

function buildAdvocacyNotePrompt(stats: AdvocacyStatsContext, followup: AdvocacyFollowupContext): string {
  return `You are a clinical advocacy writing assistant. Given a patient's symptom tracking data and their follow-up history with a doctor, write a short, persuasive note the patient can read aloud or hand to their doctor at the next appointment.

Context:
- The patient has logged ${stats.entry_count} entries from ${stats.date_range.start?.slice(0, 10) || 'unknown'} to ${stats.date_range.end?.slice(0, 10) || 'unknown'}.
- Top symptoms: ${stats.top_tags.map(t => `${t.label} (${t.count}x)`).join(', ') || 'none tracked'}.
- They previously raised "${followup.tag_label || 'a symptom'}" with their doctor. The outcome was: ${followup.outcome || 'not clear'}.

Rules:
1. Write 3-5 plain sentences, no markdown, second person.
2. Reference specific numbers from their tracking data.
3. State what they want at the next appointment.
4. Never diagnose. Never prescribe.
5. End with a clear ask.`;
}

async function callGroqDirectly(
  stats: AdvocacyStatsContext,
  followup: AdvocacyFollowupContext,
  apiKey: string
): Promise<string> {
  const prompt = buildAdvocacyNotePrompt(stats, followup);

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from Groq API');
  return text;
}

export async function generateAdvocacyNote(
  stats: AdvocacyStatsContext,
  followup: AdvocacyFollowupContext
): Promise<AdvocacyNoteResult> {
  const localApiKey = localStorage.getItem('undismissed:groq_api_key');
  if (localApiKey) {
    try {
      const text = await callGroqDirectly(stats, followup, localApiKey);
      return { text, provider: 'groq' };
    } catch (err) {
      console.warn('[advocacyNote] Direct Groq call failed, using template:', err);
    }
  }

  return { text: deterministicAdvocacyNote(stats, followup), provider: 'template' };
}

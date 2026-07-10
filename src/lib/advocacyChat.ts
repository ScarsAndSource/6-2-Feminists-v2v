import { supabase } from './supabase';

export interface AdvocacyChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const CLIENT_TIMEOUT_MS = 15000;

class TimeoutError extends Error {
  constructor() {
    super('client-side timeout waiting for advocacy-chat');
    this.name = 'TimeoutError';
  }
}

function withClientTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);
    promise.then(r => { clearTimeout(timer); resolve(r); }).catch(e => { clearTimeout(timer); reject(e); });
  });
}

// Throws on failure — unlike narration/advocacy-note there's no
// deterministic fallback for a live conversation; the caller shows an
// error state instead.
export async function sendAdvocacyChatTurn(
  tagLabel: string | null,
  outcomeLabel: string | null,
  messages: AdvocacyChatMessage[]
): Promise<{ reply: string; provider: string }> {
  const { data, error } = await withClientTimeout(
    supabase.functions.invoke<{ reply?: string; provider?: string; error?: string }>('advocacy-chat', {
      body: { tag_label: tagLabel, outcome_label: outcomeLabel, messages }
    }),
    CLIENT_TIMEOUT_MS
  );

  if (error) throw error;
  if (!data?.reply) throw new Error(data?.error || 'No response from coach');

  return { reply: data.reply, provider: data.provider || 'unknown' };
}

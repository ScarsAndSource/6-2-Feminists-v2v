import type { AdvocacyChatMessage } from './advocacyContext';

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

function buildSystemPrompt(history: AdvocacyChatMessage[]): string {
  return `You are a compassionate but honest clinical communication coach. Your job is to help the user practice explaining their symptoms to a doctor.

Rules:
1. Role-play as a doctor. Use the user's past symptom history (provided in the conversation) to ask clarifying questions.
2. Keep responses under 3 sentences.
3. Never diagnose. Never prescribe.
4. After 6 exchanges, gently suggest they now have enough practice to bring this to a real appointment.
5. Use plain, warm language.`;
}

async function callGroqDirectly(
  history: AdvocacyChatMessage[],
  apiKey: string
): Promise<string> {
  const messages = history.map(m => ({
    role: m.role,
    content: m.content,
  }));

  messages.unshift({
    role: 'system',
    content: buildSystemPrompt(history),
  });

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages,
      temperature: 0.5,
      max_tokens: 300,
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

export async function sendAdvocacyChatTurn(
  history: AdvocacyChatMessage[]
): Promise<{ reply: string; provider: string }> {
  const localApiKey = localStorage.getItem('undismissed:groq_api_key');
  if (localApiKey) {
    try {
      const reply = await callGroqDirectly(history, localApiKey);
      return { reply, provider: 'groq' };
    } catch (err) {
      console.warn('[advocacyChat] Direct Groq call failed, no fallback available:', err);
      throw err;
    }
  }

  throw new Error('No Groq API key configured. Add one in Settings to use the advocacy coach.');
}

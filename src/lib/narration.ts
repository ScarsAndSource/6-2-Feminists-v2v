import type { ComputedStats } from './types';
import { deterministicNarrative } from './aggregation';
import { supabase } from './supabase';

interface NarrationResult {
  text: string;
  provider: 'groq' | 'gemini' | 'template';
}

interface EdgeNarrationResponse {
  text: string | null;
  provider: 'groq' | 'gemini' | 'template';
}

const CLIENT_TIMEOUT_MS = 20000;

class TimeoutError extends Error {
  constructor() {
    super('client-side timeout waiting for generate-narrative');
    this.name = 'TimeoutError';
  }
}

function withClientTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);
    promise
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function generateNarrative(stats: ComputedStats): Promise<NarrationResult> {
  if (stats.entry_count === 0) {
    return { text: deterministicNarrative(stats), provider: 'template' };
  }

  if (import.meta.env.VITE_FORCE_TEMPLATE === 'true') {
    return { text: deterministicNarrative(stats), provider: 'template' };
  }

  try {
    const { data, error } = await withClientTimeout(
      supabase.functions.invoke<EdgeNarrationResponse>('generate-narrative', {
        body: { computed_stats: stats }
      }),
      CLIENT_TIMEOUT_MS
    );

    if (error) throw error;

    if (data && data.text && data.provider !== 'template') {
      console.log(`[narration] ${data.provider} succeeded`);
      return { text: data.text, provider: data.provider };
    }

    console.log('[narration] edge function exhausted Groq + Gemini, using local template');
  } catch (err) {
    if (err instanceof TimeoutError) {
      console.warn(`[narration] client-side timeout after ${CLIENT_TIMEOUT_MS}ms, using local template`);
    } else {
      console.warn(
        '[narration] generate-narrative call failed, using local template:',
        err instanceof Error ? err.message : err
      );
    }
  }

  return { text: deterministicNarrative(stats), provider: 'template' };
}

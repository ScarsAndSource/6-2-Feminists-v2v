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

export async function generateNarrative(stats: ComputedStats): Promise<NarrationResult> {
  if (stats.entry_count === 0) {
    return { text: deterministicNarrative(stats), provider: 'template' };
  }

  if (import.meta.env.VITE_FORCE_TEMPLATE === 'true') {
    return { text: deterministicNarrative(stats), provider: 'template' };
  }

  try {
    const { data, error } = await supabase.functions.invoke<EdgeNarrationResponse>(
      'generate-narrative',
      { body: { computed_stats: stats } }
    );

    if (error) throw error;

    if (data && data.text && data.provider !== 'template') {
      console.log('[narration]', data.provider, 'succeeded');
      return { text: data.text, provider: data.provider };
    }

    console.log('[narration] edge function exhausted Groq and Gemini, using local template');
  } catch (err) {
    console.warn(
      '[narration] generate-narrative call failed, using local template:',
      err instanceof Error ? err.message : err
    );
  }

  return { text: deterministicNarrative(stats), provider: 'template' };
}

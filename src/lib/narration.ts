import type { ComputedStats } from './types';
import { deterministicNarrative } from './aggregation';

interface NarrationResult {
  text: string;
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
    const res = await fetch('/api/generate-narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stats })
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    console.log('[narration] Server returned', data.provider);
    return { text: data.text, provider: data.provider };
  } catch (err) {
    console.warn('[narration] Server API failed, using template:', err);
    return { text: deterministicNarrative(stats), provider: 'template' };
  }
}

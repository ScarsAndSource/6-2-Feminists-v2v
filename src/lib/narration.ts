import type { ComputedStats } from './types';
import { deterministicNarrative } from './aggregation';
interface NarrationResult { text: string; provider: 'groq' | 'gemini' | 'template'; }
export async function generateNarrative(stats: ComputedStats): Promise<NarrationResult> {
  if (stats.entry_count === 0 || import.meta.env.VITE_FORCE_TEMPLATE === 'true') return { text: deterministicNarrative(stats), provider: 'template' };
  try { const response = await fetch('/api/generate-narrative', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ computed_stats: stats }) }); const data = await response.json(); if (data.text && (data.provider === 'groq' || data.provider === 'gemini')) return { text: data.text, provider: data.provider }; } catch (error) { console.warn('[narration] using deterministic template', error); }
  return { text: deterministicNarrative(stats), provider: 'template' };
}

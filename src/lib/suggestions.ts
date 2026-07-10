import type { ComputedStats } from './types';
import { fallbackSuggestions } from './insights';
export async function generateSuggestions(stats: ComputedStats): Promise<string[]> {
  try { const response = await fetch('/api/generate-suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ computed_stats: stats }) }); const data = await response.json(); if (Array.isArray(data?.suggestions) && data.suggestions.every((item: unknown) => typeof item === 'string')) return data.suggestions; } catch (error) { console.warn('[suggestions] using local observations', error); }
  return fallbackSuggestions(stats);
}

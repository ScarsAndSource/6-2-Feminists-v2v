import type { ComputedStats } from './types';
import { fallbackSuggestions } from './insights';
import { isAIAvailable, markAIOffline, markAIOnline } from './aiStatus';
export async function generateSuggestions(stats: ComputedStats): Promise<string[]> {
  if (!isAIAvailable()) return fallbackSuggestions(stats);
  try { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 8000); const response = await fetch('/api/generate-suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ computed_stats: stats }), signal: controller.signal }); clearTimeout(timer); const data = await response.json(); if (Array.isArray(data?.suggestions) && data.suggestions.every((item: unknown) => typeof item === 'string')) { markAIOnline(); return data.suggestions; } markAIOffline(); } catch (error) { markAIOffline(); console.warn('[suggestions] using local observations', error); }
  return fallbackSuggestions(stats);
}

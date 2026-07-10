import type { ComputedStats, Entry } from './types';
/** Client-side keys are deliberately unsupported. AI requests use /api routes. */
export async function callGeminiDirectly(_stats: ComputedStats, _apiKey: string): Promise<string> { throw new Error('Direct browser AI calls are disabled.'); }
export async function generateAIPredictions(_entries: Entry[], _apiKey: string): Promise<string> { throw new Error('This legacy view is unavailable. Use the AI Suggestions journey stage.'); }

import type { Entry } from './types';

/** Client-side keys are deliberately unsupported. AI requests use /api routes. */
export function getGroqApiKey(): null { return null; }
export async function callGroqDirectly(): Promise<string> { throw new Error('Direct browser AI calls are disabled.'); }
export async function generateAIPredictions(_entries: Entry[]): Promise<string> { throw new Error('This legacy view is unavailable. Use the AI Suggestions journey stage.'); }

export const FORBIDDEN_KEYWORDS = ['you have', 'diagnosed with', 'suffering from', 'sign of', 'symptom of', 'indicates', 'suggests you have', 'consistent with', 'likely caused by', 'condition called', 'you should take', 'i recommend', 'you need to see', 'start taking', 'stop taking', 'prescri'];
export const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Content-Type': 'application/json' };
export const containsForbiddenKeyword = (text: string) => FORBIDDEN_KEYWORDS.some(keyword => text.toLowerCase().includes(keyword));
export async function callWithTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms = 8000): Promise<T> { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), ms); try { return await fn(controller.signal); } finally { clearTimeout(timer); } }
const hits = new Map<string, number[]>();
export function isRateLimited(ip: string, limit = 20, windowMs = 60_000): boolean { const now = Date.now(); const recent = (hits.get(ip) ?? []).filter(time => now - time < windowMs); recent.push(now); hits.set(ip, recent); return recent.length > limit; }

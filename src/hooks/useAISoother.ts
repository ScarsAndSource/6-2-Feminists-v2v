import { useCallback, useState } from 'react';
import { detectsCrisis, CRISIS_RESPONSE } from '../lib/crisisDetection';
import { matchFallbackReply } from '../lib/sootherFallback';
import { isAIAvailable, markAIOnline, markAIOffline } from '../lib/aiStatus';
export interface SootherMessage { role: 'user' | 'assistant'; content: string; isCrisis?: boolean; isFallback?: boolean; }
const KEY = 'undismissed:v1:soother_session';
const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as SootherMessage[]; } catch { return []; } };
const save = (messages: SootherMessage[]) => { try { sessionStorage.setItem(KEY, JSON.stringify(messages)); } catch { /* a chat must never fail because session storage is unavailable */ } };
export function useAISoother() {
  const [messages, setMessages] = useState<SootherMessage[]>(load); const [sending, setSending] = useState(false);
  const send = useCallback(async (content: string) => { const user = { role: 'user' as const, content }; const withUser = [...messages, user]; setMessages(withUser); save(withUser); setSending(true);
    if (detectsCrisis(content)) { const next = [...withUser, { role: 'assistant' as const, content: CRISIS_RESPONSE, isCrisis: true }]; setMessages(next); save(next); setSending(false); return; }
    let text: string | null = null; let isFallback = true;
    if (isAIAvailable()) { try { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 8000); const response = await fetch('/api/ai-soother', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: withUser.slice(-12).map(message => ({ role: message.role, content: message.content })) }), signal: controller.signal }); clearTimeout(timer); const data = await response.json(); if (response.ok && typeof data?.text === 'string' && data.text) { text = data.text; isFallback = false; markAIOnline(); } else markAIOffline(); } catch { markAIOffline(); } }
    const next = [...withUser, { role: 'assistant' as const, content: text ?? matchFallbackReply(content), isFallback }]; setMessages(next); save(next); setSending(false);
  }, [messages]);
  return { messages, send, sending };
}

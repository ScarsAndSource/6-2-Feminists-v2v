export interface AdvocacyChatMessage { role: 'user' | 'assistant'; content: string; }
export async function sendAdvocacyChatTurn(_tagLabel: string | null, _outcomeLabel: string | null, history: AdvocacyChatMessage[]): Promise<{ reply: string; provider: string }> {
  const response = await fetch('/api/ask-helper', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ computed_stats: { entry_count: 0, date_range: { start: '', end: '' }, tag_frequency: [], severity_by_tag: [], co_occurrence: [] }, messages: history }) });
  if (!response.ok) throw new Error('The practice helper is unavailable');
  const data = await response.json();
  return { reply: data.reply || 'Please tell me more about what you logged.', provider: 'api' };
}

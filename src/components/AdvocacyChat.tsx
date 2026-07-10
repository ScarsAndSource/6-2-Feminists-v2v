import { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, RotateCcw } from 'lucide-react';
import { sendAdvocacyChatTurn, type AdvocacyChatMessage } from '../lib/advocacyChat';

interface AdvocacyChatProps {
  tagLabel: string | null;
  outcomeLabel: string | null;
}

const MAX_USER_TURNS = 8;

export function AdvocacyChat({ tagLabel, outcomeLabel }: AdvocacyChatProps) {
  const [messages, setMessages] = useState<AdvocacyChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const userTurnCount = messages.filter(m => m.role === 'user').length;

  const openWithClinicianLine = async () => {
    setStarted(true);
    setSending(true);
    setError(null);
    try {
      const opener: AdvocacyChatMessage[] = [
        { role: 'user', content: '(The patient has just sat down for the appointment. Begin the conversation in character.)' }
      ];
      const { reply } = await sendAdvocacyChatTurn(tagLabel, outcomeLabel, opener);
      setMessages([{ role: 'assistant', content: reply }]);
    } catch {
      setError("Couldn't start the practice session — try again in a moment.");
      setStarted(false);
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending || userTurnCount >= MAX_USER_TURNS) return;
    const nextMessages: AdvocacyChatMessage[] = [...messages, { role: 'user', content: input.trim() }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    setError(null);
    try {
      const { reply } = await sendAdvocacyChatTurn(tagLabel, outcomeLabel, nextMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setError("The coach didn't respond — try sending that again.");
    } finally {
      setSending(false);
    }
  };

  const handleRestart = () => {
    setMessages([]);
    setStarted(false);
    setError(null);
  };

  if (!started) {
    return (
      <div className="bg-rose-100/30 border border-rose-200/50 rounded-2xl p-6 text-center">
        <p className="text-sm text-rose-600 mb-4">
          This plays out the pushback you actually got last time — not a generic practice chat.
          Nothing here is saved or sent anywhere.
        </p>
        <button
          onClick={openWithClinicianLine}
          disabled={sending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 active:scale-95"
        >
          {sending ? 'Starting...' : 'Begin practice'}
        </button>
        {error && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-coral-500">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/60 border border-rose-200/50 rounded-2xl overflow-hidden shadow-soft">
      <div ref={scrollRef} className="max-h-80 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                m.role === 'user'
                  ? 'bg-rose-500 text-white font-medium shadow-sm'
                  : 'bg-rose-100/60 text-rose-900 border border-rose-200/40'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && <div className="text-xs text-rose-400 px-1 animate-pulse">Coach is responding...</div>}
      </div>

      {error && (
        <div className="px-4 py-2 flex items-center gap-2 text-xs text-coral-500 border-t border-rose-200/30">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="border-t border-rose-200/30 p-3 flex items-center gap-2 bg-rose-50/20">
        <button onClick={handleRestart} className="text-rose-400 hover:text-rose-600 transition-colors shrink-0 p-1.5 rounded-lg hover:bg-rose-100/50" title="Restart">
          <RotateCcw className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={sending || userTurnCount >= MAX_USER_TURNS}
          placeholder={userTurnCount >= MAX_USER_TURNS ? 'Practice round complete' : 'Type your response...'}
          className="flex-1 px-3 py-2 bg-white/80 border border-rose-200 rounded-lg text-sm text-rose-900 placeholder-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim() || userTurnCount >= MAX_USER_TURNS}
          className="p-2 bg-rose-500 hover:bg-rose-400 disabled:bg-rose-200 disabled:cursor-not-allowed text-white rounded-lg transition-all shrink-0 active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

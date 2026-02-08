import React, { useEffect, useRef, useState } from 'react';
import { Bot, Check, Copy, Loader2, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { Task } from '../types';
import { aiService } from '../services/aiService';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface AICommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

const AICommandCenter: React.FC<AICommandCenterProps> = ({ isOpen, onClose, tasks }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => inputRef.current?.focus(), 10);
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const ask = async (preset?: string) => {
    const text = (preset ?? query).trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    const next = [...messages, userMessage];
    setMessages(next);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await aiService.chatWithBoard(next, tasks);
      setMessages([...next, { role: 'model', content: response }]);
    } catch {
      setMessages([...next, { role: 'model', content: 'Request failed. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1200);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl h-[80vh] max-h-[680px] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center"><Bot className="w-4 h-4" /></div>
            <h2 className="text-sm font-semibold">AI Assistant</h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMessages([])} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500" title="Clear">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500" title="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-3.5 md:p-4 space-y-4 bg-slate-50">
          {messages.length === 0 && (
            <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 mb-3"><Sparkles className="w-5 h-5" /></div>
              <h3 className="text-base font-semibold text-slate-900">Ask about your board</h3>
              <p className="text-sm text-slate-600 mt-1">Try one of these:</p>
              <div className="mt-3 grid gap-2 w-full max-w-sm">
                {['Summarize the board', 'What is overdue?', 'Show high-priority tasks'].map((preset) => (
                  <button key={preset} onClick={() => ask(preset)} className="h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-sm text-slate-700">
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[86%] rounded-xl border px-3 py-2.5 ${msg.role === 'user' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-800 border-slate-200'}`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.role === 'model' && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                    <button onClick={() => copyText(msg.content, i)} className="text-[11px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1">
                      {copiedIndex === i ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedIndex === i ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-200 bg-white">
          <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="flex gap-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !query.trim()} className="w-10 h-10 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AICommandCenter;

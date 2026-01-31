
import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, X, Bot, Loader2, Sparkles, Copy, Check, RotateCcw } from 'lucide-react';
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

const FormattedAIResponse: React.FC<{ text: string; isUser?: boolean }> = ({ text, isUser = false }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const formattedLine = parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={index} className={`font-black rounded-sm px-1 ${isUser ? 'text-white bg-white/10' : 'text-slate-900 bg-indigo-50/50'}`}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });
        const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
        if (isBullet) {
          const content = line.trim().substring(2);
          return (
            <div key={i} className="flex gap-2.5 pl-1">
              <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${isUser ? 'bg-white' : 'bg-indigo-500'}`} />
              <p className={`text-sm font-medium leading-relaxed flex-1 ${isUser ? 'text-white/90' : 'text-slate-700'}`}>{content}</p>
            </div>
          );
        }
        return <p key={i} className={`text-sm font-medium leading-relaxed ${isUser ? 'text-white/90' : 'text-slate-700'}`}>{formattedLine}</p>;
      })}
    </div>
  );
};

const AICommandCenter: React.FC<AICommandCenterProps> = ({ isOpen, onClose, tasks }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuery = async (queryText?: string) => {
    const finalQuery = queryText || query;
    if (!finalQuery.trim() || isLoading) return;
    const userMessage: Message = { role: 'user', content: finalQuery };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setQuery('');
    setIsLoading(true);
    try {
      const response = await aiService.chatWithBoard(updatedMessages, tasks);
      setMessages([...updatedMessages, { role: 'model', content: response }]);
    } catch (error) {
      setMessages([...updatedMessages, { role: 'model', content: "Connection failed. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[60] flex items-end md:items-start justify-center md:pt-12 px-0 md:px-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-3xl rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 md:slide-in-from-top-4 duration-300 flex flex-col h-[92vh] md:max-h-[85vh]">
        <div className="bg-slate-900 p-4 md:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-xl"><Terminal className="w-5 h-5" /></div>
            <div>
              <h2 className="text-base font-bold leading-tight">Velo AI Commander</h2>
              <p className="text-[10px] text-slate-400 font-medium">Liaison Core Active</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setMessages([])} className="p-2 text-slate-400 hover:text-white"><RotateCcw className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar scroll-smooth">
          {messages.length === 0 ? (
            <div className="py-12 md:py-20 flex flex-col items-center text-center space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-500"><Bot className="w-8 h-8 md:w-10 md:h-10" /></div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-slate-900">Commander Node Ready</h3>
                <p className="text-xs md:text-sm text-slate-500 max-w-xs mx-auto mt-2">Ask for summaries or progress reports.</p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                {["Summarize the board.", "What's overdue?", "Show high priority tasks."].map((s, i) => (
                  <button key={i} onClick={() => handleQuery(s)} className="px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white text-[11px] font-bold text-slate-600 transition-all flex items-center gap-3">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`flex gap-3 max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`mt-1 shrink-0 p-1.5 md:p-2 rounded-xl border ${msg.role === 'user' ? 'bg-indigo-700 text-white' : 'bg-white text-indigo-600'}`}>
                      {msg.role === 'user' ? <div className="w-3.5 h-3.5 font-black flex items-center justify-center text-[9px]">U</div> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`relative p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border ${msg.role === 'user' ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' : 'bg-slate-50 border-slate-100 rounded-tl-none text-slate-800'}`}>
                      <FormattedAIResponse text={msg.content} isUser={msg.role === 'user'} />
                      {msg.role === 'model' && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                          <button onClick={() => copyToClipboard(msg.content, i)} className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-indigo-600">
                            {copiedIndex === i ? <><Check className="w-3 h-3 text-emerald-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="p-4 md:p-5 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Velo AI is analyzing...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 shrink-0">
          <form onSubmit={(e) => { e.preventDefault(); handleQuery(); }} className="relative">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query board state..."
              className="w-full pl-5 pr-14 py-3.5 md:py-4 bg-white border border-slate-200 rounded-[1.5rem] md:rounded-3xl outline-none focus:ring-2 focus:ring-indigo-50 font-medium text-sm md:text-base text-slate-800 shadow-sm"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 md:p-3 bg-indigo-600 text-white rounded-[1.25rem] shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
        
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-center">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Generated by Velo AI Core Orchestration</p>
        </div>
      </div>
    </div>
  );
};

export default AICommandCenter;

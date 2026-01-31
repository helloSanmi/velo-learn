
import React, { useState } from 'react';
import { Terminal, Send, X, Bot, Loader2, Sparkles } from 'lucide-react';
import { Task } from '../types';
import { aiService } from '../services/aiService';

interface AICommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

/**
 * A simple formatter to handle basic markdown-like syntax from AI responses.
 * Specifically handles bold text (**text**) and bulleted lists (- text).
 */
const FormattedAIResponse: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  
  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;

        // Process bolding using regex
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const formattedLine = parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={index} className="font-black text-slate-900 bg-indigo-50/50 px-1 rounded-sm">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        // Detect bullet points
        const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
        
        if (isBullet) {
          const content = line.trim().substring(2);
          // Recalculate bolding for the bullet content specifically
          const bulletParts = content.split(/(\*\*.*?\*\*)/g).map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={index} className="font-black text-slate-900">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          return (
            <div key={i} className="flex gap-3 pl-2 group">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0 group-hover:scale-125 transition-transform" />
              <p className="text-sm text-slate-700 font-medium leading-relaxed flex-1">
                {bulletParts}
              </p>
            </div>
          );
        }

        return (
          <p key={i} className="text-sm text-slate-700 font-medium leading-relaxed">
            {formattedLine}
          </p>
        );
      })}
    </div>
  );
};

const AICommandCenter: React.FC<AICommandCenterProps> = ({ isOpen, onClose, tasks }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse(null);
    const result = await aiService.queryBoard(query, tasks);
    setResponse(result);
    setIsLoading(false);
  };

  const suggestions = [
    "Summarize current high-priority tasks.",
    "Which items are overdue?",
    "Show me a breakdown of project progress."
  ];

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-xl">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">AI Command Center</h2>
              <p className="text-xs text-slate-400 font-medium">Querying {tasks.length} active workspace items</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[65vh] custom-scrollbar">
          <form onSubmit={handleQuery} className="relative mb-6 sticky top-0 bg-white pt-1 pb-2 z-10">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about this project..."
              className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-800"
            />
            <button 
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>

          {!response && !isLoading && (
            <div className="space-y-3 pb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Try asking</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(s)}
                    className="text-left px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/30 text-xs font-semibold text-slate-600 transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-pulse">
              <Bot className="w-12 h-12 text-slate-200" />
              <p className="text-sm font-bold text-slate-400">Gemini is analyzing the board context...</p>
            </div>
          )}

          {response && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-4">
              <div className="flex items-start gap-4 p-6 rounded-[2rem] bg-indigo-50/30 border border-indigo-100/50 shadow-inner">
                <div className="p-2.5 bg-white border border-indigo-100 shadow-sm text-indigo-600 rounded-xl shrink-0 mt-0.5">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                   <FormattedAIResponse text={response} />
                </div>
              </div>
              <div className="flex justify-between items-center mt-6 px-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Generated by Gemini 3 Flash</p>
                <button 
                  onClick={() => {setResponse(null); setQuery('');}}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5"
                >
                  Clear Results
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AICommandCenter;

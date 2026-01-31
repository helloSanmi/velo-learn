
import React from 'react';
import { Sparkles, X, Check, Plus } from 'lucide-react';
import Button from './ui/Button';

interface AIModalProps {
  suggestions: string[] | null;
  onClose: () => void;
  onApply: () => void;
  isLoading: boolean;
  taskTitle: string;
}

const AIModal: React.FC<AIModalProps> = ({ suggestions, onClose, onApply, isLoading, taskTitle }) => {
  if (!suggestions && !isLoading) return null;

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-900/30 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">AI Breakdown</h2>
              <p className="text-xs text-indigo-100 opacity-90 truncate max-w-[250px] font-medium">{taskTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
                <div className="absolute top-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                <p className="text-slate-800 font-bold text-lg mb-1">Strategizing with Gemini...</p>
                <p className="text-slate-400 text-sm font-medium">Deconstructing task into actionable steps</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Recommended Actions</p>
                 <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{suggestions?.length} Steps</span>
              </div>
              
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {suggestions?.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 hover:bg-white transition-all duration-200">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-white text-indigo-600 shadow-sm border border-slate-100">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-slate-700 leading-relaxed font-semibold text-sm">{step}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <Button
                  variant="secondary"
                  className="w-full py-4 rounded-2xl"
                  onClick={onApply}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Apply all as Subtasks
                </Button>
                <button
                  onClick={onClose}
                  className="w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Discard Suggestions
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIModal;

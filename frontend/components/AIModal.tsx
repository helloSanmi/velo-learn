import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, Trash2, ListPlus, GripVertical } from 'lucide-react';
import Button from './ui/Button';

interface AIModalProps {
  suggestions: string[] | null;
  onClose: () => void;
  onApply: (finalSteps: string[]) => void;
  isLoading: boolean;
  taskTitle: string;
}

const AIModal: React.FC<AIModalProps> = ({ suggestions, onClose, onApply, isLoading, taskTitle }) => {
  const [editedSteps, setEditedSteps] = useState<string[]>([]);

  // Sync internal state when suggestions arrive from AI
  useEffect(() => {
    if (suggestions) {
      setEditedSteps([...suggestions]);
    }
  }, [suggestions]);

  if (!suggestions && !isLoading) return null;

  const handleUpdateStep = (index: number, value: string) => {
    const next = [...editedSteps];
    next[index] = value;
    setEditedSteps(next);
  };

  const handleRemoveStep = (index: number) => {
    setEditedSteps(editedSteps.filter((_, i) => i !== index));
  };

  const handleAddStep = () => {
    setEditedSteps([...editedSteps, '']);
  };

  const handleApply = () => {
    const validSteps = editedSteps.filter(s => s.trim() !== '');
    if (validSteps.length === 0) return;
    onApply(validSteps);
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-indigo-900/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-[0_30px_100px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
        <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight leading-none">Strategy Refinement</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 truncate max-w-[280px]">
                Target: {taskTitle}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 md:p-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-8">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-50 rounded-full"></div>
                <div className="absolute top-0 w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-200 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-slate-900 font-black text-xl mb-1">Consulting Runa AI...</p>
                <p className="text-slate-400 text-sm font-medium">Deconstructing task into strategic nodes</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Steps</p>
                 <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">{editedSteps.length} Items</span>
              </div>
              
              <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar -mx-2 px-2">
                {editedSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3 group animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="shrink-0 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="flex-1 relative">
                      <input 
                        value={step}
                        onChange={(e) => handleUpdateStep(idx, e.target.value)}
                        placeholder="Define action step..."
                        className="w-full pl-5 pr-10 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                      />
                      <button 
                        onClick={() => handleRemoveStep(idx)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <button 
                  onClick={handleAddStep}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all font-bold text-xs uppercase tracking-widest group"
                >
                  <ListPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Add Manual Node
                </button>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                >
                  Discard All
                </button>
                <Button
                  variant="secondary"
                  className="flex-[2] py-5 rounded-2xl shadow-xl shadow-indigo-100"
                  onClick={handleApply}
                  disabled={editedSteps.filter(s => s.trim() !== '').length === 0}
                >
                  <Check className="w-5 h-5 mr-3" />
                  Apply Strategy to Board
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-center gap-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Refine the AI suggestions to match your actual velocity</p>
        </div>
      </div>
    </div>
  );
};

export default AIModal;
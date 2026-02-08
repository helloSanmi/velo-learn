import React, { useState } from 'react';
import { ArrowLeft, Check, Loader2, Sparkles, Users, X } from 'lucide-react';
import { aiService } from '../services/aiService';
import { userService } from '../services/userService';
import { workflowService } from '../services/workflowService';
import { ProjectTemplate } from '../types';
import Button from './ui/Button';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, color: string, members: string[], templateId?: string, aiGeneratedTasks?: any[]) => void;
  currentUserId: string;
}

const COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-violet-500', 'bg-slate-700', 'bg-pink-500'];

type Mode = 'manual' | 'template' | 'ai';

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSubmit, currentUserId }) => {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<Mode>('manual');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [memberIds, setMemberIds] = useState<string[]>([currentUserId]);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [aiDocText, setAiDocText] = useState('');
  const [aiGeneratedTasks, setAiGeneratedTasks] = useState<any[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const allUsers = userService.getUsers();

  if (!isOpen) return null;

  const reset = () => {
    setStep(1);
    setMode('manual');
    setName('');
    setDescription('');
    setSelectedColor(COLORS[0]);
    setMemberIds([currentUserId]);
    setIsPublic(false);
    setSelectedTemplate(null);
    setAiDocText('');
    setAiGeneratedTasks([]);
    setIsAiProcessing(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const processAi = async () => {
    if (!aiDocText.trim()) return;
    setIsAiProcessing(true);
    const tasks = await aiService.parseProjectFromDocument(aiDocText);
    setAiGeneratedTasks(tasks);
    setIsAiProcessing(false);
    setStep(3);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name, description, selectedColor, memberIds, selectedTemplate?.id, aiGeneratedTasks);
    close();
  };

  const toggleMember = (id: string) => {
    if (id === currentUserId) return;
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  return (
    <div className="fixed inset-0 z-[140] bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-sm font-semibold">Create Project</h2>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 md:p-4 max-h-[74vh] overflow-y-auto custom-scrollbar">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Choose how to start:</p>
              <div className="grid sm:grid-cols-3 gap-2">
                <button onClick={() => { setMode('manual'); setSelectedTemplate(null); setStep(3); }} className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm text-slate-700">Start from scratch</button>
                <button onClick={() => { setMode('template'); setStep(2); }} className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm text-slate-700">Use template</button>
                <button onClick={() => { setMode('ai'); setStep(2); }} className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm text-slate-700">Import with AI</button>
              </div>
            </div>
          )}

          {step === 2 && mode === 'template' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Select a template:</p>
              <div className="space-y-2">
                {workflowService.getTemplates().map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setName(template.name);
                      setDescription(template.description);
                      setStep(3);
                    }}
                    className="w-full text-left border border-slate-200 rounded-lg p-3 hover:bg-slate-50"
                  >
                    <p className="text-sm font-medium text-slate-900">{template.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && mode === 'ai' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Paste notes or documentation. AI will extract tasks.</p>
              <textarea
                value={aiDocText}
                onChange={(e) => setAiDocText(e.target.value)}
                className="w-full min-h-[220px] rounded-lg border border-slate-300 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Paste notes, docs, or task ideas..."
              />
              <Button onClick={processAi} disabled={isAiProcessing || !aiDocText.trim()} className="w-full">
                {isAiProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {isAiProcessing ? 'Generating tasks...' : 'Use Imported Tasks'}
              </Button>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Project name</label>
                <input
                  autoFocus
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Project name"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[100px] rounded-lg border border-slate-300 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Short description"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-lg ${color} ${selectedColor === color ? 'ring-2 ring-offset-2 ring-slate-800' : ''}`}
                    >
                      {selectedColor === color && <Check className="w-4 h-4 text-white mx-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-900">Public project</p>
                  <p className="text-xs text-slate-600">Allow read-only public sharing.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors ${isPublic ? 'bg-slate-900' : 'bg-slate-300'}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(4)}>
                  <Users className="w-4 h-4 mr-2" /> Members
                </Button>
                <Button type="submit" className="flex-1">Create Project</Button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Select project members:</p>
              <div className="grid sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                {allUsers.map((u) => {
                  const selected = memberIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleMember(u.id)}
                      className={`p-3 rounded-lg border text-left transition-colors ${selected ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'} ${u.id === currentUserId ? 'opacity-80' : ''}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={u.avatar} alt={u.displayName} className="w-8 h-8 rounded-lg border border-slate-200" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">{u.displayName}{u.id === currentUserId ? ' (You)' : ''}</p>
                          <p className="text-xs text-slate-500 truncate">{u.role || 'member'}</p>
                        </div>
                        {selected && <Check className="w-4 h-4 text-slate-900" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <Button className="w-full" onClick={() => setStep(3)}>Done</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;

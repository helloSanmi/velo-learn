import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Loader2, Sparkles, Users, X } from 'lucide-react';
import { aiService } from '../services/aiService';
import { userService } from '../services/userService';
import { workflowService } from '../services/workflowService';
import { ProjectTemplate, TaskPriority } from '../types';
import Button from './ui/Button';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    description: string,
    color: string,
    members: string[],
    templateId?: string,
    aiGeneratedTasks?: any[],
    meta?: { startDate?: number; endDate?: number; budgetCost?: number; scopeSummary?: string; scopeSize?: number }
  ) => void;
  currentUserId: string;
  initialTemplateId?: string | null;
}

const COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-violet-500', 'bg-slate-700', 'bg-pink-500'];

type Mode = 'manual' | 'template' | 'ai';
type AiInputMode = 'brief' | 'document';
type AiTaskDraft = { title: string; description: string; priority: TaskPriority; tags: string[] };

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSubmit, currentUserId, initialTemplateId }) => {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<Mode>('manual');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [memberIds, setMemberIds] = useState<string[]>([currentUserId]);
  const [isPublic, setIsPublic] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetCost, setBudgetCost] = useState('');
  const [scopeSummary, setScopeSummary] = useState('');
  const [scopeSize, setScopeSize] = useState('');
  const [metaError, setMetaError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);

  const [aiInputMode, setAiInputMode] = useState<AiInputMode>('brief');
  const [aiBrief, setAiBrief] = useState('');
  const [aiDocText, setAiDocText] = useState('');
  const [aiTaskCount, setAiTaskCount] = useState(8);
  const [aiGeneratedTasks, setAiGeneratedTasks] = useState<AiTaskDraft[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiError, setAiError] = useState('');

  const allUsers = userService.getUsers();

  useEffect(() => {
    if (!isOpen) return;
    if (!initialTemplateId) return;
    const template = workflowService.getTemplates().find((item) => item.id === initialTemplateId);
    if (!template) return;
    setMode('template');
    setSelectedTemplate(template);
    setName(template.name);
    setDescription(template.description);
    setStep(3);
  }, [isOpen, initialTemplateId]);

  if (!isOpen) return null;

  const reset = () => {
    setStep(1);
    setMode('manual');
    setName('');
    setDescription('');
    setSelectedColor(COLORS[0]);
    setMemberIds([currentUserId]);
    setIsPublic(false);
    setStartDate('');
    setEndDate('');
    setBudgetCost('');
    setScopeSummary('');
    setScopeSize('');
    setMetaError('');
    setSelectedTemplate(null);

    setAiInputMode('brief');
    setAiBrief('');
    setAiDocText('');
    setAiTaskCount(8);
    setAiGeneratedTasks([]);
    setIsAiProcessing(false);
    setAiError('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const normalizePriority = (priority: string): TaskPriority => {
    const normalized = priority?.toLowerCase();
    if (normalized === 'high') return TaskPriority.HIGH;
    if (normalized === 'low') return TaskPriority.LOW;
    return TaskPriority.MEDIUM;
  };

  const processAi = async () => {
    if (aiInputMode === 'brief' && !aiBrief.trim()) return;
    if (aiInputMode === 'document' && !aiDocText.trim()) return;

    setIsAiProcessing(true);
    setAiError('');

    const tasks =
      aiInputMode === 'brief'
        ? await aiService.generateProjectTasksFromBrief(name, aiBrief, aiTaskCount)
        : await aiService.parseProjectFromDocument(aiDocText);

    const normalizedTasks = (tasks || [])
      .filter((task) => task?.title?.trim())
      .map((task) => ({
        title: task.title.trim(),
        description: (task.description || '').trim(),
        priority: normalizePriority(task.priority as string),
        tags: Array.isArray(task.tags) && task.tags.length > 0 ? task.tags.slice(0, 4) : ['Planning']
      }));

    setAiGeneratedTasks(normalizedTasks);
    setIsAiProcessing(false);

    if (normalizedTasks.length > 0) {
      setStep(3);
      return;
    }

    setAiError('No tasks were generated. Try a more specific brief.');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedStartDate = startDate ? new Date(startDate).getTime() : undefined;
    const parsedEndDate = endDate ? new Date(endDate).getTime() : undefined;
    const parsedBudgetCost = budgetCost.trim() ? Number(budgetCost) : undefined;
    const parsedScopeSize = scopeSize.trim() ? Number(scopeSize) : undefined;

    if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
      setMetaError('End date must be on or after the start date.');
      return;
    }
    if (parsedBudgetCost !== undefined && (!Number.isFinite(parsedBudgetCost) || parsedBudgetCost < 0)) {
      setMetaError('Cost must be a positive number.');
      return;
    }
    if (parsedScopeSize !== undefined && (!Number.isFinite(parsedScopeSize) || parsedScopeSize < 0)) {
      setMetaError('Scope size must be a positive number.');
      return;
    }

    onSubmit(name, description, selectedColor, memberIds, selectedTemplate?.id, aiGeneratedTasks, {
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      budgetCost: parsedBudgetCost,
      scopeSummary: scopeSummary.trim() || undefined,
      scopeSize: parsedScopeSize !== undefined ? Math.round(parsedScopeSize) : undefined
    });
    close();
  };

  const toggleMember = (id: string) => {
    if (id === currentUserId) return;
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const updateGeneratedTask = (index: number, updates: Partial<AiTaskDraft>) => {
    setAiGeneratedTasks((prev) => prev.map((task, taskIndex) => (taskIndex === index ? { ...task, ...updates } : task)));
  };

  const removeGeneratedTask = (index: number) => {
    setAiGeneratedTasks((prev) => prev.filter((_, taskIndex) => taskIndex !== index));
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
                <button onClick={() => { setMode('ai'); setStep(2); }} className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm text-slate-700">Generate with AI</button>
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
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setAiInputMode('brief')}
                  className={`h-8 px-3 rounded-md text-xs font-medium transition-colors ${aiInputMode === 'brief' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                >
                  Brief
                </button>
                <button
                  type="button"
                  onClick={() => setAiInputMode('document')}
                  className={`h-8 px-3 rounded-md text-xs font-medium transition-colors ${aiInputMode === 'document' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                >
                  Import docs
                </button>
              </div>

              {aiInputMode === 'brief' ? (
                <>
                  <p className="text-sm text-slate-600">Describe what this project should deliver. AI will generate a starter task plan.</p>
                  <textarea
                    value={aiBrief}
                    onChange={(e) => setAiBrief(e.target.value)}
                    className="w-full min-h-[190px] rounded-lg border border-slate-300 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Example: Build customer onboarding with email verification, profile setup, analytics tracking, and QA sign-off."
                  />
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Tasks to generate</label>
                    <input
                      type="number"
                      min={4}
                      max={20}
                      value={aiTaskCount}
                      onChange={(e) => setAiTaskCount(Math.min(20, Math.max(4, Number(e.target.value) || 8)))}
                      className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-600">Paste notes or documentation. AI will extract tasks.</p>
                  <textarea
                    value={aiDocText}
                    onChange={(e) => setAiDocText(e.target.value)}
                    className="w-full min-h-[220px] rounded-lg border border-slate-300 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Paste notes, docs, or task ideas..."
                  />
                </>
              )}

              <Button
                onClick={processAi}
                disabled={isAiProcessing || (aiInputMode === 'brief' ? !aiBrief.trim() : !aiDocText.trim())}
                className="w-full"
              >
                {isAiProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {isAiProcessing ? 'Generating tasks...' : 'Generate Tasks with AI'}
              </Button>
              {aiError ? <p className="text-xs text-rose-600">{aiError}</p> : null}
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
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (metaError) setMetaError('');
                  }}
                  className="w-full min-h-[100px] rounded-lg border border-slate-300 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Short description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Start date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      setStartDate(value);
                      if (value && !endDate) {
                        const base = new Date(value);
                        base.setDate(base.getDate() + 30);
                        setEndDate(base.toISOString().split('T')[0]);
                      }
                      if (metaError) setMetaError('');
                    }}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">End date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (metaError) setMetaError('');
                    }}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Planned cost ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={budgetCost}
                    onChange={(e) => {
                      setBudgetCost(e.target.value);
                      if (metaError) setMetaError('');
                    }}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Scope size (tasks)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={scopeSize}
                    onChange={(e) => {
                      setScopeSize(e.target.value);
                      if (metaError) setMetaError('');
                    }}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="e.g. 40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Scope summary</label>
                <textarea
                  value={scopeSummary}
                  onChange={(e) => {
                    setScopeSummary(e.target.value);
                    if (metaError) setMetaError('');
                  }}
                  className="w-full min-h-[72px] rounded-lg border border-slate-300 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="What is in scope and what is out of scope?"
                />
              </div>
              {metaError ? <p className="text-xs text-rose-600">{metaError}</p> : null}

              {mode === 'ai' && aiGeneratedTasks.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs text-slate-500">AI generated tasks ({aiGeneratedTasks.length})</label>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      Regenerate
                    </button>
                  </div>
                  <div className="max-h-[240px] overflow-y-auto custom-scrollbar space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    {aiGeneratedTasks.map((task, index) => (
                      <div key={`${task.title}-${index}`} className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-2">
                        <div className="flex items-start gap-2">
                          <input
                            value={task.title}
                            onChange={(e) => updateGeneratedTask(index, { title: e.target.value })}
                            className="flex-1 h-9 rounded-md border border-slate-300 px-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                            placeholder="Task title"
                          />
                          <button
                            type="button"
                            onClick={() => removeGeneratedTask(index)}
                            className="h-9 px-2 rounded-md text-xs text-slate-600 hover:bg-slate-100"
                          >
                            Remove
                          </button>
                        </div>
                        <textarea
                          value={task.description}
                          onChange={(e) => updateGeneratedTask(index, { description: e.target.value })}
                          className="w-full min-h-[60px] rounded-md border border-slate-300 p-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                          placeholder="Task description"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

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

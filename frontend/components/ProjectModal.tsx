import React, { useState } from 'react';
import { X, Briefcase, Check, Users, LayoutGrid, Terminal, Zap, ArrowRight, ArrowLeft, Plus, FileText, Sparkles, Loader2, Database, CheckCircle2, Globe, Shield } from 'lucide-react';
import { userService } from '../services/userService';
import { workflowService } from '../services/workflowService';
import { aiService } from '../services/aiService';
import { ProjectTemplate, User } from '../types';
import Button from './ui/Button';
import Badge from './ui/Badge';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, color: string, members: string[], templateId?: string, aiGeneratedTasks?: any[]) => void;
  currentUserId: string;
}

const COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 
  'bg-rose-500', 'bg-sky-500', 'bg-violet-500', 
  'bg-slate-700', 'bg-pink-500'
];

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSubmit, currentUserId }) => {
  const [step, setStep] = useState(1); // 1: Select, 2: Template, 3: AI, 4: Details, 5: Guest Portal
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [memberIds, setMemberIds] = useState<string[]>([currentUserId]);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  
  const [aiDocText, setAiDocText] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiGeneratedTasks, setAiGeneratedTasks] = useState<any[]>([]);

  const allUsers = userService.getUsers();

  if (!isOpen) return null;

  const handleAiProcess = async () => {
    if (!aiDocText.trim()) return;
    setIsAiProcessing(true);
    const tasks = await aiService.parseProjectFromDocument(aiDocText);
    setAiGeneratedTasks(tasks);
    setIsAiProcessing(false);
    setStep(4);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name, description, selectedColor, memberIds, selectedTemplate?.id, aiGeneratedTasks);
    reset();
    onClose();
  };

  const reset = () => {
    setStep(1);
    setName('');
    setDescription('');
    setAiDocText('');
    setAiGeneratedTasks([]);
    setMemberIds([currentUserId]);
    setSelectedTemplate(null);
    setIsPublic(false);
  };

  const toggleMember = (id: string) => {
    if (id === currentUserId) return;
    setMemberIds(prev => prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]);
  };

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-black tracking-tight leading-none">Provision Workspace</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest-plus mt-2 opacity-80">Deployment Config v2.5</p>
            </div>
          </div>
          <button onClick={() => { reset(); onClose(); }} className="p-2.5 text-slate-400 hover:text-white rounded-xl transition-all"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-10">
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
               <button onClick={() => setStep(3)} className="group p-8 rounded-[2.5rem] border-2 border-slate-100 bg-slate-50 hover:border-indigo-500 hover:bg-white transition-all flex flex-col items-center text-center gap-5">
                 <div className="p-5 bg-white rounded-2xl shadow-sm text-indigo-600 group-hover:scale-110 transition-transform"><Sparkles className="w-8 h-8" /></div>
                 <div><p className="text-sm font-heading font-black text-slate-900 uppercase tracking-tight">Runa AI Ingestor</p><p className="text-[10px] text-slate-500 mt-2 font-bold leading-relaxed">Deconstruct PRDs & transcripts</p></div>
               </button>
               <button onClick={() => setStep(2)} className="group p-8 rounded-[2.5rem] border-2 border-slate-100 bg-slate-50 hover:border-indigo-500 hover:bg-white transition-all flex flex-col items-center text-center gap-5">
                 <div className="p-5 bg-white rounded-2xl shadow-sm text-slate-900 group-hover:scale-110 transition-transform"><LayoutGrid className="w-8 h-8" /></div>
                 <div><p className="text-sm font-heading font-black text-slate-900 uppercase tracking-tight">Template</p><p className="text-[10px] text-slate-500 mt-2 font-bold leading-relaxed">Standard Agile framework</p></div>
               </button>
               <button onClick={() => setStep(4)} className="group p-8 rounded-[2.5rem] border-2 border-slate-100 bg-slate-50 hover:border-indigo-500 hover:bg-white transition-all flex flex-col items-center text-center gap-5">
                 <div className="p-5 bg-white rounded-2xl shadow-sm text-slate-900 group-hover:scale-110 transition-transform"><Plus className="w-8 h-8" /></div>
                 <div><p className="text-sm font-heading font-black text-slate-900 uppercase tracking-tight">Manual</p><p className="text-[10px] text-slate-500 mt-2 font-bold leading-relaxed">Clean deployment node</p></div>
               </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-2">
                <button type="button" onClick={() => setStep(1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                <h3 className="text-xl font-heading font-black text-slate-900">Project Parameters</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 px-1 tracking-widest-plus">Namespace</label>
                    <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-800 text-sm" placeholder="e.g. Q4 Growth Node" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 px-1 tracking-widest-plus">Theme Logic</label>
                    <div className="flex flex-wrap gap-3 p-1">
                      {COLORS.map(color => (
                        <button key={color} type="button" onClick={() => setSelectedColor(color)} className={`w-9 h-9 rounded-xl transition-all transform hover:scale-110 flex items-center justify-center ${color} ${selectedColor === color ? 'ring-4 ring-offset-4 ring-indigo-600' : 'opacity-60 hover:opacity-100'}`}>
                          {selectedColor === color && <Check className="w-5 h-5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 px-1 tracking-widest-plus">Access Protocol</label>
                    <div className="space-y-3">
                       <button 
                        type="button" 
                        onClick={() => setIsPublic(!isPublic)}
                        className={`w-full p-5 rounded-[1.75rem] border-2 transition-all flex items-center gap-4 ${isPublic ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-slate-50'}`}
                       >
                         <div className={`p-2.5 rounded-xl ${isPublic ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}><Globe className="w-5 h-5" /></div>
                         <div className="text-left"><p className="text-xs font-black text-slate-900 tracking-tight">Guest Visibility</p><p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Read-only portal</p></div>
                         {isPublic && <CheckCircle2 className="w-5 h-5 text-indigo-600 ml-auto" />}
                       </button>
                       <div className="p-5 rounded-[1.75rem] bg-slate-50 border border-slate-100 flex items-center gap-4 opacity-40 cursor-not-allowed">
                         <div className="p-2.5 bg-white rounded-xl text-slate-400"><Shield className="w-5 h-5" /></div>
                         <div className="text-left"><p className="text-xs font-black text-slate-900 tracking-tight">IP Restricted</p><p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Enterprise Shield</p></div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 flex gap-4">
                <button type="button" className="flex-1 py-5 rounded-[1.75rem] font-black text-[10px] uppercase tracking-widest-plus border border-slate-100 text-slate-400 hover:text-slate-900" onClick={() => setStep(5)}>Personnel Allocation</button>
                <Button onClick={handleSubmit} className="flex-[2] py-5 rounded-[1.75rem] font-black text-[10px] uppercase tracking-widest-plus shadow-xl shadow-indigo-100">Initialize Cluster</Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
               <div className="flex items-center gap-4 mb-2">
                 <button onClick={() => setStep(4)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                 <h3 className="text-xl font-heading font-black text-slate-900">Personnel Allocation</h3>
               </div>
               
               <div className="space-y-5">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest-plus px-1">Global Directory</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                     {allUsers.map(user => (
                       <button key={user.id} type="button" onClick={() => toggleMember(user.id)} className={`flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all ${memberIds.includes(user.id) ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                         <img src={user.avatar} className="w-9 h-9 rounded-xl bg-white p-0.5" alt="" />
                         <div className="text-left min-w-0 flex-1">
                           <p className="text-xs font-black truncate tracking-tight">{user.displayName}</p>
                           <p className={`text-[8px] uppercase font-bold tracking-widest-plus mt-0.5 ${memberIds.includes(user.id) ? 'text-slate-400' : 'text-slate-400'}`}>{user.role}</p>
                         </div>
                         {memberIds.includes(user.id) && <Check className="w-5 h-5 text-white" />}
                       </button>
                     ))}
                  </div>
               </div>

               <Button className="w-full py-5 rounded-2xl shadow-xl shadow-slate-200" onClick={() => setStep(4)}>Confirm Membership Cluster</Button>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
               <div className="flex items-center gap-4 mb-4">
                 <button onClick={() => setStep(1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                 <h3 className="text-xl font-heading font-black text-slate-900">Standard Frameworks</h3>
               </div>
               <div className="grid gap-4">
                 {workflowService.getTemplates().map(t => (
                   <button key={t.id} onClick={() => { setSelectedTemplate(t); setName(t.name); setDescription(t.description); setStep(4); }} className="flex items-center justify-between p-8 bg-slate-50 border-2 border-transparent hover:border-indigo-500 hover:bg-white rounded-[2.5rem] transition-all group">
                     <div className="flex items-center gap-6">
                        <div className="p-5 bg-white rounded-2xl shadow-sm text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Terminal className="w-7 h-7" /></div>
                        <div className="text-left"><p className="text-lg font-heading font-black text-slate-900 tracking-tight">{t.name}</p><p className="text-xs text-slate-500 font-bold leading-relaxed mt-1">{t.description}</p></div>
                     </div>
                     <div className="p-3 bg-white rounded-xl text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                       <ArrowRight className="w-5 h-5" />
                     </div>
                   </button>
                 ))}
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
               <div className="flex items-center gap-4 mb-2">
                 <button onClick={() => setStep(1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                 <h3 className="text-xl font-heading font-black text-slate-900">Runa AI Ingestion</h3>
               </div>
               <div className="relative">
                 <textarea value={aiDocText} onChange={(e) => setAiDocText(e.target.value)} placeholder="Paste PRD, transcript, or rough project nodes..." className="w-full h-64 p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] outline-none focus:border-indigo-600 focus:bg-white transition-all text-sm font-medium leading-relaxed custom-scrollbar resize-none" />
                 {isAiProcessing && (
                   <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-[2.5rem] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                      <p className="text-[10px] font-black uppercase tracking-widest-plus text-indigo-600">Analyzing Strategic Context...</p>
                   </div>
                 )}
               </div>
               <Button onClick={handleAiProcess} disabled={isAiProcessing || !aiDocText.trim()} className="w-full py-6 rounded-[2rem] shadow-xl shadow-indigo-100">
                 {isAiProcessing ? "Synthesizing Node Tree..." : "Initialize Scanned Strategy"}
               </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
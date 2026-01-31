
import React, { useState } from 'react';
import { X, Briefcase, Check, Users } from 'lucide-react';
import { userService } from '../services/userService';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, color: string, members: string[]) => void;
  currentUserId: string;
}

const COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 
  'bg-rose-500', 'bg-sky-500', 'bg-violet-500', 
  'bg-slate-700', 'bg-pink-500'
];

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSubmit, currentUserId }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [memberIds, setMemberIds] = useState<string[]>([currentUserId]);

  const allUsers = userService.getUsers();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name, description, selectedColor, memberIds);
    setName('');
    setDescription('');
    setMemberIds([currentUserId]);
    onClose();
  };

  const toggleMember = (id: string) => {
    if (id === currentUserId) return; // Creator must be a member
    setMemberIds(prev => 
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-900">
              <Briefcase className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">New Project</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Project Name</label>
            <input
              autoFocus
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all font-semibold"
              placeholder="e.g. Marketing Q4"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Team Members</label>
            <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
               {allUsers.map(user => (
                 <button
                   key={user.id}
                   type="button"
                   onClick={() => toggleMember(user.id)}
                   className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all ${
                     memberIds.includes(user.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-500'
                   }`}
                 >
                   <img src={user.avatar} className="w-5 h-5 rounded-full" alt="" />
                   <span className="truncate">{user.username} {user.id === currentUserId ? '(You)' : ''}</span>
                 </button>
               ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Identify Color</label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full transition-all transform hover:scale-110 flex items-center justify-center ${color} ${
                    selectedColor === color ? 'ring-4 ring-offset-2 ring-slate-900 scale-110' : ''
                  }`}
                >
                  {selectedColor === color && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 font-bold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] px-4 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all"
            >
              Initialize Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;

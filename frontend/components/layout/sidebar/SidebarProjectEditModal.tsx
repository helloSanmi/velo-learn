import React from 'react';
import { Project, User } from '../../../types';
import { X } from 'lucide-react';

interface SidebarProjectEditModalProps {
  isOpen: boolean;
  project: Project | null;
  allUsers: User[];
  currentUser: User;
  name: string;
  setName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  color: string;
  setColor: (value: string) => void;
  ownerId: string;
  setOwnerId: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  budgetCost: string;
  setBudgetCost: (value: string) => void;
  scopeSize: string;
  setScopeSize: (value: string) => void;
  scopeSummary: string;
  setScopeSummary: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

const PROJECT_COLORS = [
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-violet-500',
  'bg-slate-700'
];

const SidebarProjectEditModal: React.FC<SidebarProjectEditModalProps> = ({
  isOpen,
  project,
  allUsers,
  currentUser,
  name,
  setName,
  description,
  setDescription,
  color,
  setColor,
  ownerId,
  setOwnerId,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  budgetCost,
  setBudgetCost,
  scopeSize,
  setScopeSize,
  scopeSummary,
  setScopeSummary,
  onClose,
  onSave
}) => {
  if (!isOpen || !project) return null;

  const canChangeOwner = currentUser.role === 'admin';
  const ownerDisplay = allUsers.find((user) => user.id === ownerId)?.displayName || 'Unknown owner';

  return (
    <div className="fixed inset-0 z-[210] bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Edit Project</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-4">
          <label className="block">
            <p className="text-[11px] text-slate-500 mb-1">Project name</p>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
          </label>

          <label className="block">
            <p className="text-[11px] text-slate-500 mb-1">Description</p>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
          </label>

          <div>
            <p className="text-[11px] text-slate-500 mb-1.5">Color</p>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((projectColor) => (
                <button
                  key={projectColor}
                  onClick={() => setColor(projectColor)}
                  className={`w-7 h-7 rounded-full border-2 ${projectColor} ${color === projectColor ? 'border-slate-900' : 'border-transparent'}`}
                  title={projectColor}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <p className="text-[11px] text-slate-500 mb-1">Start date</p>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
            </label>
            <label className="block">
              <p className="text-[11px] text-slate-500 mb-1">End date</p>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
            </label>
            <label className="block">
              <p className="text-[11px] text-slate-500 mb-1">Budget cost</p>
              <input
                type="number"
                min={0}
                value={budgetCost}
                onChange={(event) => setBudgetCost(event.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
            </label>
            <label className="block">
              <p className="text-[11px] text-slate-500 mb-1">Scope size</p>
              <input
                type="number"
                min={0}
                value={scopeSize}
                onChange={(event) => setScopeSize(event.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
            </label>
          </div>

          <label className="block">
            <p className="text-[11px] text-slate-500 mb-1">Scope summary</p>
            <textarea
              value={scopeSummary}
              onChange={(event) => setScopeSummary(event.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
          </label>

          <div>
            <p className="text-[11px] text-slate-500 mb-1">Project owner</p>
            {canChangeOwner ? (
              <select
                value={ownerId}
                onChange={(event) => setOwnerId(event.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              >
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName}
                  </option>
                ))}
              </select>
            ) : (
              <div className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 flex items-center">
                {ownerDisplay}
              </div>
            )}
          </div>
        </div>

        <div className="h-14 px-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700">
            Cancel
          </button>
          <button onClick={onSave} className="h-9 px-3 rounded-lg bg-slate-900 text-white text-sm">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidebarProjectEditModal;

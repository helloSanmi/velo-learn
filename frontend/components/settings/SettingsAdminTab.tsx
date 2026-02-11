import React from 'react';
import { Check, Edit2, Loader2, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import Button from '../ui/Button';
import { Organization, User as UserType } from '../../types';

interface SettingsAdminTabProps {
  user: UserType;
  org: Organization | null;
  allUsers: UserType[];
  isProvisioning: boolean;
  setIsProvisioning: (value: boolean) => void;
  newUserName: string;
  setNewUserName: (value: string) => void;
  provisionError: string;
  handleProvision: (e: React.FormEvent) => void;
  isUpgrading: boolean;
  handleUpgradeTier: (tier: 'starter' | 'pro' | 'enterprise') => void;
  editingUserId: string | null;
  editNameValue: string;
  setEditNameValue: (value: string) => void;
  handleCommitEdit: () => void;
  handleStartEdit: (targetUser: UserType) => void;
  handleUpdateUserRole: (userId: string, role: 'admin' | 'member') => void;
  handlePurgeUser: (userId: string) => void;
}

const SettingsAdminTab: React.FC<SettingsAdminTabProps> = ({
  user,
  org,
  allUsers,
  isProvisioning,
  setIsProvisioning,
  newUserName,
  setNewUserName,
  provisionError,
  handleProvision,
  isUpgrading,
  handleUpgradeTier,
  editingUserId,
  editNameValue,
  setEditNameValue,
  handleCommitEdit,
  handleStartEdit,
  handleUpdateUserRole,
  handlePurgeUser
}) => {
  const seatUsage = (allUsers.length / (org?.totalSeats || 1)) * 100;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Team</h3>
          <p className="text-xs text-slate-500 mt-1">
            {org?.name || 'Workspace'} • ID {org?.id?.slice(0, 8) || 'N/A'} • Created {new Date(org?.createdAt || 0).toLocaleDateString()}
          </p>
        </div>
        <span className="h-7 px-2 rounded-md border border-slate-200 bg-white text-[11px] font-medium text-slate-600 inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> Admin
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <p className="text-[11px] text-slate-500">Members</p>
          <p className="text-lg font-semibold text-slate-900 mt-1">{allUsers.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <p className="text-[11px] text-slate-500">Seat limit</p>
          <p className="text-lg font-semibold text-slate-900 mt-1">{org?.totalSeats || 0}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <p className="text-[11px] text-slate-500">Usage</p>
          <p className="text-lg font-semibold text-slate-900 mt-1">{Math.round(seatUsage)}%</p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Seat usage</p>
          <p className="text-xs text-slate-500">
            {allUsers.length} / {org?.totalSeats || 0}
          </p>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div style={{ width: `${Math.min(seatUsage, 100)}%` }} className="h-full bg-slate-900 transition-all duration-500" />
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: 'starter', name: 'Starter', seats: 3 },
            { id: 'pro', name: 'Pro', seats: 15 },
            { id: 'enterprise', name: 'Enterprise', seats: 100 }
          ].map((tier) => (
            <button
              key={tier.id}
              onClick={() => handleUpgradeTier(tier.id as 'starter' | 'pro' | 'enterprise')}
              disabled={isUpgrading}
              className={`h-9 px-3 rounded-lg border text-xs font-medium transition-colors ${
                org?.totalSeats === tier.seats ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tier.name} ({tier.seats})
            </button>
          ))}
        </div>
        {isUpgrading && (
          <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating plan...
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Members</p>
          <Button size="sm" variant="outline" onClick={() => setIsProvisioning(!isProvisioning)} className="h-8 rounded-lg border-slate-200">
            <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Add member
          </Button>
        </div>

        {isProvisioning && (
          <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
            <form onSubmit={handleProvision} className="flex flex-col sm:flex-row gap-2">
              <input
                autoFocus
                placeholder="Username"
                value={newUserName}
                onChange={(event) => setNewUserName(event.target.value)}
                className="flex-1 h-9 rounded-lg border border-slate-300 px-3 text-sm outline-none"
              />
              <Button type="submit" size="sm" className="h-9">
                Add
              </Button>
            </form>
            {provisionError && <p className="text-xs text-rose-600 mt-2">{provisionError}</p>}
          </div>
        )}

        <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
          {allUsers.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-3 p-3 border border-slate-200 rounded-lg bg-white">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  <img src={member.avatar} className="w-full h-full object-cover" alt={member.displayName} />
                </div>
                <div className="min-w-0 flex-1">
                  {editingUserId === member.id ? (
                    <div className="flex items-center gap-2 max-w-xs">
                      <input
                        autoFocus
                        value={editNameValue}
                        onChange={(event) => setEditNameValue(event.target.value)}
                        onKeyDown={(event) => event.key === 'Enter' && handleCommitEdit()}
                        className="h-8 w-full px-3 bg-white border border-slate-300 rounded-lg text-sm outline-none"
                      />
                      <button onClick={handleCommitEdit} className="w-8 h-8 bg-slate-900 text-white rounded-lg inline-flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1.5">
                      {member.displayName} {member.id === user.id ? '(You)' : ''}
                      <button onClick={() => handleStartEdit(member)} className="p-1 text-slate-300 hover:text-slate-700 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 truncate">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={member.role || 'member'}
                  onChange={(event) => handleUpdateUserRole(member.id, event.target.value as 'admin' | 'member')}
                  disabled={member.id === user.id}
                  className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs outline-none cursor-pointer disabled:opacity-40"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={() => handlePurgeUser(member.id)}
                  disabled={member.id === user.id}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-20"
                  title="Remove user"
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsAdminTab;

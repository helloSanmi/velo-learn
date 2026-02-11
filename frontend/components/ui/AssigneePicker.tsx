import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { User } from '../../types';

interface AssigneePickerProps {
  users: User[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  compact?: boolean;
}

const AssigneePicker: React.FC<AssigneePickerProps> = ({
  users,
  selectedIds,
  onChange,
  placeholder = 'Search members',
  compact = false
}) => {
  const [query, setQuery] = useState('');

  const selectedUsers = useMemo(
    () => users.filter((user) => selectedIds.includes(user.id)),
    [users, selectedIds]
  );

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((user) => {
      const role = user.role || 'member';
      return `${user.displayName} ${user.username} ${role}`.toLowerCase().includes(normalized);
    });
  }, [users, query]);

  const toggle = (userId: string) => {
    onChange(selectedIds.includes(userId) ? selectedIds.filter((id) => id !== userId) : [...selectedIds, userId]);
  };

  const clearAll = () => onChange([]);

  const selectFiltered = () => {
    const filteredIds = filteredUsers.map((user) => user.id);
    onChange(Array.from(new Set([...selectedIds, ...filteredIds])));
  };

  return (
    <div className="space-y-2">
      <div className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
        />
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-500">{selectedIds.length} selected</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={selectFiltered} className="text-slate-600 hover:text-slate-900">
            Add visible
          </button>
          <button type="button" onClick={clearAll} className="text-slate-600 hover:text-slate-900">
            Clear
          </button>
        </div>
      </div>

      <div
        className={
          compact
            ? 'h-8 rounded-md border border-slate-200 bg-white px-1.5 overflow-x-auto overflow-y-hidden custom-scrollbar'
            : 'min-h-8 flex flex-wrap gap-1.5'
        }
      >
        {selectedUsers.length === 0 ? (
          compact ? (
            <div className="h-full inline-flex items-center text-[11px] text-slate-400 px-1">No assignees selected</div>
          ) : null
        ) : (
          <div className={compact ? 'h-full inline-flex items-center gap-1.5 min-w-full w-max' : 'contents'}>
            {selectedUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => toggle(user.id)}
                className="h-6 px-2 rounded-md border border-slate-200 bg-slate-100 text-[11px] text-slate-700 inline-flex items-center gap-1 shrink-0"
              >
                <span className="truncate max-w-[120px]">{user.displayName}</span>
                <X className="w-3 h-3 text-slate-500" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`rounded-lg border border-slate-200 bg-white p-1.5 overflow-y-auto custom-scrollbar ${compact ? 'max-h-[120px]' : 'max-h-[164px]'}`}>
        {filteredUsers.length === 0 ? (
          <div className="h-12 flex items-center justify-center text-xs text-slate-500">No members found</div>
        ) : (
          <div className="space-y-1">
            {filteredUsers.map((user) => {
              const isSelected = selectedIds.includes(user.id);
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggle(user.id)}
                  className={`w-full h-8 px-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{user.displayName}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-white/85' : 'text-slate-500'}`}>
                    {isSelected ? 'Selected' : user.role || 'member'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssigneePicker;

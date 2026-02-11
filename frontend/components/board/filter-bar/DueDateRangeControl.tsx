import React from 'react';

interface DueDateRangeControlProps {
  dueFrom?: number;
  dueTo?: number;
  onDueFromChange: (value?: number) => void;
  onDueToChange: (value?: number) => void;
}

const DueDateRangeControl: React.FC<DueDateRangeControlProps> = ({ dueFrom, dueTo, onDueFromChange, onDueToChange }) => {
  return (
    <div className="w-full h-7 rounded-md border border-slate-200 bg-white px-2 flex items-center gap-1.5">
      <span className="text-[10px] text-slate-500 shrink-0">Due</span>
      <input
        type="date"
        value={dueFrom ? new Date(dueFrom).toISOString().slice(0, 10) : ''}
        onChange={(event) => onDueFromChange(event.target.value ? new Date(`${event.target.value}T00:00:00`).getTime() : undefined)}
        className="h-6 w-full min-w-0 bg-transparent text-[11px] text-slate-700 outline-none"
        title="Due from"
        aria-label="Due from"
      />
      <span className="text-[10px] text-slate-400 shrink-0">-</span>
      <input
        type="date"
        value={dueTo ? new Date(dueTo).toISOString().slice(0, 10) : ''}
        onChange={(event) => onDueToChange(event.target.value ? new Date(`${event.target.value}T23:59:59`).getTime() : undefined)}
        className="h-6 w-full min-w-0 bg-transparent text-[11px] text-slate-700 outline-none"
        title="Due to"
        aria-label="Due to"
      />
    </div>
  );
};

export default DueDateRangeControl;

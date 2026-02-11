import React from 'react';

interface SidebarNavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
}

const SidebarNavButton: React.FC<SidebarNavButtonProps> = ({ active, onClick, icon: Icon, label, badge }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm transition-colors border ${
        active
          ? 'bg-white text-[#76003f] border-[#e6d2dc] shadow-sm'
          : 'text-slate-600 border-transparent hover:bg-white hover:border-[#ead4df] hover:text-[#76003f]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#76003f]' : 'text-slate-400'}`} />
        <span className="truncate">{label}</span>
      </div>
      {badge && (
        <span
          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 ${
            active ? 'bg-[#f5eaf0] text-[#76003f]' : 'bg-slate-200 text-slate-700'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
};

export default SidebarNavButton;

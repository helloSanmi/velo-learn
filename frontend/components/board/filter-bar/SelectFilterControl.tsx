import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectFilterControlProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className: string;
}

const SelectFilterControl: React.FC<SelectFilterControlProps> = ({ value, options, onChange, className }) => {
  return (
    <div className="w-full">
      <select value={value} onChange={(event) => onChange(event.target.value)} className={className}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectFilterControl;

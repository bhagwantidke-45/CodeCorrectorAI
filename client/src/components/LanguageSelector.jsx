import { LANGUAGES } from '../utils/helpers.js';
import { ChevronDown } from 'lucide-react';

export default function LanguageSelector({ value, onChange, disabled = false }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="input-field pr-10 appearance-none cursor-pointer font-medium">
        <option value="">Select Language...</option>
        {LANGUAGES.map(({ value: v, label, icon }) => (
          <option key={v} value={v}>{icon}  {label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
    </div>
  );
}

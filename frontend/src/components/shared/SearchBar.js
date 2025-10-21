// src/components/shared/SearchBar.js
import { Search } from 'lucide-react';

export default function SearchBar({
  id = 'search-input',
  label = 'Search',
  value,
  onChange,
  onKeyDown,
  placeholder = 'Search...',
  onFocus,
  onBlur,
  autoComplete = 'off',
  inputMode = 'search',
  ...rest
}) {
  return (
    <div className="relative">
      {label && (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      )}
      <input
        type="text"
        id={id}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="w-full border border-gray-300 rounded-lg px-10 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...rest}
      />
      <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
    </div>
  );
}

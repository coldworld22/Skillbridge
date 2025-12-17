// src/components/shared/SearchBar.js
import { Search } from 'lucide-react';
import styles from './SearchBar.module.scss';
import clsx from 'clsx';

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
  className = '',
  ...rest
}) {
  return (
    <div className={styles.wrapper}>
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
        className={clsx(styles.input, className)}
        {...rest}
      />
      <Search className={styles.icon} />
    </div>
  );
}

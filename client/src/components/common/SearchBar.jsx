import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search by name, student ID, roll number...',
  style = {},
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && value) {
      e.preventDefault();
      onChange('');
    }
  };

  return (
    <div className="search-input-wrapper" style={style}>
      <Search size={16} className="search-input-icon" aria-hidden="true" />
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '10px',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Clear search"
          aria-label="Clear search query"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

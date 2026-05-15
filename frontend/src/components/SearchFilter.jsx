import React, { useRef } from 'react';
import { pulse } from '../utils/animations';

const POPULAR_LANGUAGES = [
  { value: '', label: 'All Languages' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'c++', label: 'C++' },
  { value: 'c#', label: 'C#' },
  { value: 'vue', label: 'Vue' },
  { value: 'react', label: 'React' }
];

const TIME_RANGES = [
  { value: 'all', label: 'all' },
  { value: 'daily', label: 'daily' },
  { value: 'weekly', label: 'weekly' },
  { value: 'monthly', label: 'monthly' }
];

function SearchFilter({
  searchQuery,
  onSearchChange,
  language,
  onLanguageChange,
  since,
  onSinceChange,
  resultCount
}) {
  const searchWrapperRef = useRef(null);

  const handleSearchFocus = () => {
    if (searchWrapperRef.current) {
      pulse(searchWrapperRef.current, { duration: 200 });
    }
  };

  return (
    <div className="search-filter">
      <div className="filter-bar">
        <div
          ref={searchWrapperRef}
          className="search-input-wrapper"
        >
          <svg className="search-icon" aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
            <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={handleSearchFocus}
          />
        </div>

        <div className="filter-selects">
          <select
            className="filter-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            {POPULAR_LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={since}
            onChange={(e) => onSinceChange(e.target.value)}
          >
            {TIME_RANGES.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
        </div>
      </div>

      {resultCount !== undefined && (
        <div className="filter-results-info">
          Showing {resultCount} project{resultCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export default SearchFilter;

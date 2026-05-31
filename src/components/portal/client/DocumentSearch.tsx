'use client';

import './portal.css';

interface DocumentSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  categoryCounts: Record<string, number>;
  resultCount: number;
  totalCount: number;
}

export default function DocumentSearch({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  categories,
  categoryCounts,
  resultCount,
  totalCount,
}: DocumentSearchProps) {
  return (
    <>
      <div className="portal-toolbar">
        <div className="portal-search">
          <span className="portal-search__icon">⌕</span>
          <input
            type="text"
            className="portal-search__input"
            placeholder="Search documents…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              className="portal-search__clear"
              onClick={() => onSearchChange('')}
            >
              ✕
            </button>
          )}
        </div>
        <div className="portal-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`portal-filter ${activeCategory === cat ? 'portal-filter--active' : ''}`}
              onClick={() => onCategoryChange(cat)}
            >
              {cat}
              {cat !== 'All' && (
                <span className="portal-filter__count">
                  {categoryCounts[cat] || 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      {(searchQuery || activeCategory !== 'All') && (
        <div className="portal-results-count">
          {resultCount} of {totalCount} documents
        </div>
      )}
    </>
  );
}

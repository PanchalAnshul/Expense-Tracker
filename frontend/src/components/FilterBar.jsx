import React from 'react';
import { CalendarRange, FolderOpen, Search, SlidersHorizontal, Tag, X } from 'lucide-react';

const FilterBar = ({ filters, setFilters, folders = [], lockedFolderId = '' }) => {
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const clearAll = () =>
    setFilters({
      category: '',
      start_date: '',
      end_date: '',
      folder_id: lockedFolderId ? String(lockedFolderId) : '',
    });

  const activeFilters = [
    filters.category ? { key: 'category', label: filters.category } : null,
    filters.start_date ? { key: 'start_date', label: `From ${filters.start_date}` } : null,
    filters.end_date ? { key: 'end_date', label: `To ${filters.end_date}` } : null,
    !lockedFolderId && filters.folder_id ? { key: 'folder_id', label: 'Folder selected' } : null,
  ].filter(Boolean);

  return (
    <section className="filter-strip">
      <div className="filter-strip-main">
        <label className="filter-pill filter-pill-search">
          <Search size={15} />
          <input
            value={filters.category || ''}
            onChange={(event) => update('category', event.target.value)}
            placeholder="Search notes or categories"
            aria-label="Search notes or categories"
          />
        </label>

        <label className="filter-pill">
          <Tag size={15} />
          <input
            value={filters.category || ''}
            onChange={(event) => update('category', event.target.value)}
            placeholder="Category"
            aria-label="Category filter"
          />
        </label>

        <label className="filter-pill">
          <CalendarRange size={15} />
          <input
            type="date"
            value={filters.start_date || ''}
            onChange={(event) => update('start_date', event.target.value)}
            aria-label="Start date"
          />
        </label>

        <label className="filter-pill">
          <CalendarRange size={15} />
          <input
            type="date"
            value={filters.end_date || ''}
            onChange={(event) => update('end_date', event.target.value)}
            aria-label="End date"
          />
        </label>

        {!lockedFolderId ? (
          <label className="filter-pill">
            <FolderOpen size={15} />
            <select
              value={filters.folder_id || ''}
              onChange={(event) => update('folder_id', event.target.value)}
              aria-label="Folder filter"
            >
              <option value="">All folders</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="filter-counter">
          <SlidersHorizontal size={15} />
          <span>{activeFilters.length}</span>
        </div>
      </div>

      {activeFilters.length ? (
        <div className="filter-active-row">
          {activeFilters.map((item) => (
            <button key={item.key} type="button" className="active-filter-chip" onClick={() => update(item.key, '')}>
              <span>{item.label}</span>
              <X size={12} />
            </button>
          ))}
          <button type="button" className="filter-clear-all" onClick={clearAll}>
            Clear all
          </button>
        </div>
      ) : null}
    </section>
  );
};

export default FilterBar;

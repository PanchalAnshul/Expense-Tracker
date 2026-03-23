import React from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import { useHeaderSearch } from '../context/SearchContext';

const FilterBar = ({ filters, setFilters, folders, lockedFolderId }) => {
    const { searchQuery, setSearchQuery } = useHeaderSearch();

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'start_date') {
            setFilters((prev) => {
                const next = { ...prev, start_date: value };
                if (value && prev.end_date && prev.end_date < value) {
                    next.end_date = value;
                }
                return next;
            });
            return;
        }
        if (name === 'end_date') {
            setFilters((prev) => {
                if (prev.start_date && value && value < prev.start_date) {
                    return { ...prev, end_date: prev.start_date };
                }
                return { ...prev, end_date: value };
            });
            return;
        }
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleClear = () => {
        setSearchQuery('');
        setFilters((prev) => {
            const next = {
                ...prev,
                category: '',
                start_date: '',
                end_date: '',
            };
            if (lockedFolderId == null && Object.prototype.hasOwnProperty.call(prev, 'folder_id')) {
                next.folder_id = '';
            }
            return next;
        });
    };

    const activeFilterCount =
        Object.entries(filters).filter(([k, v]) => k !== 'folder_id' && v !== '').length +
        (searchQuery ? 1 : 0);

    return (
        <div className="filter-bar">
            <div className="filter-bar-top">
                <div className="filter-bar-title">
                    <Filter size={16} color="var(--text-secondary)" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="badge badge-neutral filter-count">{activeFilterCount}</span>
                    )}
                </div>
                {activeFilterCount > 0 && (
                    <button type="button" className="btn-text-clear" onClick={handleClear}>
                        Clear all
                    </button>
                )}
            </div>

            <div className="filter-bar-row">
                <div className="filter-field filter-search">
                    <Search size={14} className="filter-field-icon" aria-hidden />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Matches category & description…"
                        className="input-field filter-input"
                    />
                </div>

                <div className="filter-field filter-narrow">
                    <input
                        type="text"
                        name="category"
                        value={filters.category}
                        onChange={handleChange}
                        placeholder="Category"
                        className="input-field filter-input"
                    />
                </div>

                <div className="filter-dates">
                    <Calendar size={14} color="var(--text-tertiary)" aria-hidden />
                    <input
                        type="date"
                        name="start_date"
                        value={filters.start_date}
                        onChange={handleChange}
                        className="input-field filter-input filter-date"
                    />
                    <span className="filter-to">to</span>
                    <input
                        type="date"
                        name="end_date"
                        value={filters.end_date}
                        onChange={handleChange}
                        min={filters.start_date || undefined}
                        className="input-field filter-input filter-date"
                    />
                </div>

                {folders && folders.length > 0 && lockedFolderId == null && (
                    <div className="filter-field filter-folder">
                        <select
                            name="folder_id"
                            value={filters.folder_id}
                            onChange={handleChange}
                            className="input-field filter-input"
                        >
                            <option value="">All folders</option>
                            {folders.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilterBar;

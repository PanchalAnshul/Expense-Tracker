import React from 'react';
import { Search, Filter, Calendar } from 'lucide-react';

const FilterBar = ({ filters, setFilters, folders }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClear = () => {
        setFilters({
            search: '',
            category: '',
            start_date: '',
            end_date: '',
            folder_id: ''
        });
    };

    const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={16} color="var(--text-secondary)" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{activeFilterCount}</span>
                    )}
                </div>
                {activeFilterCount > 0 && (
                    <button className="btn-icon" onClick={handleClear} style={{ fontSize: '0.8125rem' }}>
                        Clear All
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {/* Search */}
                <div style={{ position: 'relative', width: '220px' }}>
                    <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                        <Search size={14} />
                    </div>
                    <input
                        type="text"
                        name="search"
                        value={filters.search}
                        onChange={handleChange}
                        placeholder="Search..."
                        className="input-field"
                        style={{ paddingLeft: '32px', fontSize: '0.875rem', padding: '8px 12px 8px 32px' }}
                    />
                </div>

                {/* Category */}
                <div style={{ width: '160px' }}>
                    <input
                        type="text"
                        name="category"
                        value={filters.category}
                        onChange={handleChange}
                        placeholder="Category"
                        className="input-field"
                        style={{ fontSize: '0.875rem', padding: '8px 12px' }}
                    />
                </div>

                {/* Date Constraints */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                        type="date"
                        name="start_date"
                        value={filters.start_date}
                        onChange={handleChange}
                        className="input-field"
                        style={{ fontSize: '0.875rem', padding: '8px 12px', width: '130px' }}
                    />
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>to</span>
                    <input
                        type="date"
                        name="end_date"
                        value={filters.end_date}
                        onChange={handleChange}
                        className="input-field"
                        style={{ fontSize: '0.875rem', padding: '8px 12px', width: '130px' }}
                    />
                </div>

                {/* Folder Select */}
                {folders && folders.length > 0 && (
                    <div style={{ width: '180px' }}>
                        <select
                            name="folder_id"
                            value={filters.folder_id}
                            onChange={handleChange}
                            className="input-field"
                            style={{ fontSize: '0.875rem', padding: '8px 12px', appearance: 'none' }}
                        >
                            <option value="">All Folders</option>
                            {folders.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilterBar;

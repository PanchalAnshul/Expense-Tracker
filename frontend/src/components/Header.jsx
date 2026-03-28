import React, { useMemo, useState } from 'react';
import { Bell, CalendarDays, Menu, PanelLeftClose, Search } from 'lucide-react';
import { useHeaderSearch } from '../context/SearchContext';

const Header = ({ onToggleSidebar, sidebarCollapsed }) => {
  const {
    searchQuery,
    setSearchQuery,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  } = useHeaderSearch();
  const [showSearchMenu, setShowSearchMenu] = useState(false);

  const currentMonthLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }, []);

  const handleSubmit = (event) => {
    if (event.key === 'Enter') {
      addRecentSearch(searchQuery);
      setShowSearchMenu(false);
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="header-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          aria-expanded={!sidebarCollapsed}
        >
          {sidebarCollapsed ? <Menu size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <div className="header-mobile-brand">
          <span className="header-mobile-mark">₹</span>
          <strong>ExpenseFlow</strong>
        </div>
      </div>

      <div className={`header-search ${showSearchMenu ? 'is-open' : ''}`}>
        <Search size={16} className="header-search-icon" aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onFocus={() => setShowSearchMenu(true)}
          onBlur={() => setTimeout(() => setShowSearchMenu(false), 120)}
          onKeyDown={handleSubmit}
          placeholder="Search transactions, categories..."
          className="header-search-input"
          aria-label="Search transactions, categories, folders"
        />
        <kbd className="header-search-kbd">⌘ K</kbd>

        {showSearchMenu ? (
          <div className="header-search-dropdown">
            <div className="header-search-dropdown-head">
              <span>Recent searches</span>
              {recentSearches.length ? (
                <button type="button" onClick={clearRecentSearches}>
                  Clear
                </button>
              ) : null}
            </div>
            {recentSearches.length ? (
              recentSearches.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="header-search-item"
                  onMouseDown={() => {
                    setSearchQuery(item);
                    addRecentSearch(item);
                    setShowSearchMenu(false);
                  }}
                >
                  <Search size={14} />
                  <span>{item}</span>
                </button>
              ))
            ) : (
              <div className="header-search-empty">
                Search categories, notes, folders, or exact amounts like `₹1,250`.
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="header-actions">
        <button type="button" className="header-date-pill">
          <CalendarDays size={16} />
          <span>{currentMonthLabel}</span>
        </button>
        <button type="button" className="header-icon-btn" aria-label="Notifications">
          <Bell size={17} />
          <span className="header-notification-badge">3</span>
        </button>
        <button type="button" className="header-avatar" aria-label="User profile">
          <span>AS</span>
        </button>
      </div>
    </header>
  );
};

export default Header;

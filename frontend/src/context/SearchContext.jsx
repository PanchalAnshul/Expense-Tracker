import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'expenseflow-recent-searches';
const SearchContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useHeaderSearch = () => {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    return {
      searchQuery: '',
      setSearchQuery: () => {},
      recentSearches: [],
      addRecentSearch: () => {},
      clearRecentSearches: () => {},
    };
  }
  return ctx;
};

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(saved) ? saved.slice(0, 6) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSearches.slice(0, 6)));
    } catch {
      // ignore storage failures
    }
  }, [recentSearches]);

  const addRecentSearch = (value) => {
    const query = value.trim();
    if (!query) return;
    setRecentSearches((prev) => [query, ...prev.filter((item) => item !== query)].slice(0, 6));
  };

  const clearRecentSearches = () => setRecentSearches([]);

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        recentSearches,
        addRecentSearch,
        clearRecentSearches,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

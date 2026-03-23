import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Bell, User, Sun, Moon, PanelLeftClose, PanelLeft, Settings } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useHeaderSearch } from '../context/SearchContext';

const Header = ({ onToggleSidebar, sidebarCollapsed }) => {
    const { theme, toggleTheme } = useTheme();
    const { searchQuery, setSearchQuery } = useHeaderSearch();

    return (
        <header className="app-header">
            <div className="header-left">
                <button
                    type="button"
                    className="btn-icon header-menu-btn"
                    onClick={onToggleSidebar}
                    title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-expanded={!sidebarCollapsed}
                >
                    {sidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
                </button>
                <div className="header-search" title="Searches category and description across transactions">
                    <Search size={16} className="text-secondary header-search-icon" aria-hidden />
                    <input
                        type="search"
                        placeholder="Search categories & notes…"
                        className="header-search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search transactions by category or description"
                    />
                </div>
            </div>

            <div className="header-actions">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `btn-icon header-settings-link${isActive ? ' is-active' : ''}`
                    }
                    title="Settings"
                >
                    <Settings size={18} />
                </NavLink>
                <button
                    type="button"
                    className="btn-icon"
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button type="button" className="btn-icon" title="Notifications">
                    <Bell size={18} />
                </button>
                <div className="user-profile">
                    <div className="avatar" title="Profile">
                        <User size={18} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

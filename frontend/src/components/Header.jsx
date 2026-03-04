import React from 'react';
import { Search, Bell, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="app-header">
            <div className="header-search">
                <Search size={16} className="text-secondary" />
                <input
                    type="text"
                    placeholder="Search anything..."
                    className="header-search-input"
                />
            </div>

            <div className="header-actions">
                <button
                    className="btn-icon"
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button className="btn-icon">
                    <Bell size={18} />
                </button>
                <div className="user-profile">
                    <div className="avatar">
                        <User size={18} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

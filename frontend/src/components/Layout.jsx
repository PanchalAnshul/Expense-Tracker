import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const STORAGE_KEY = 'expense-sidebar-collapsed';

const Layout = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) === '1';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, sidebarCollapsed ? '1' : '0');
        } catch { /* ignore */ }
    }, [sidebarCollapsed]);

    return (
        <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar collapsed={sidebarCollapsed} />
            <div className="main-wrapper">
                <Header
                    onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
                    sidebarCollapsed={sidebarCollapsed}
                />
                <main className="main-content">
                    <div className="page-container">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;

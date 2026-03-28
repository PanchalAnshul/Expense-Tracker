import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FolderOpen, LayoutDashboard, PieChart, Plus, UserRound } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import RecordDialog from './RecordDialog';
import { ToastProvider } from '../context/ToastContext';

const STORAGE_KEY = 'expense-sidebar-collapsed';

const Layout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, sidebarCollapsed ? '1' : '0');
    } catch {
      // ignore storage failures
    }
  }, [sidebarCollapsed]);

  return (
    <ToastProvider>
      <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Sidebar collapsed={sidebarCollapsed} />
        <div className="main-wrapper">
          <Header
            onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
            sidebarCollapsed={sidebarCollapsed}
          />
          <main className="main-content">
            <div className="page-container">{children}</div>
          </main>
        </div>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <NavLink to="/" end className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/folders" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <FolderOpen size={18} />
          <span>Folders</span>
        </NavLink>
        <button type="button" className="mobile-nav-add-button" onClick={() => setIsQuickAddOpen(true)}>
          <span className="mobile-nav-add">
            <Plus size={20} />
          </span>
          <span>Add</span>
        </button>
        <NavLink to="/reports" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <PieChart size={18} />
          <span>Reports</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
          <UserRound size={18} />
          <span>Profile</span>
        </NavLink>
      </nav>

      <RecordDialog
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={() => {
          setIsQuickAddOpen(false);
        }}
      />
    </ToastProvider>
  );
};

export default Layout;

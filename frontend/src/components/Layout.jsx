import React, { useEffect, useState } from 'react';
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

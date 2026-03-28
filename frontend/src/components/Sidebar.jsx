import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChevronLeft,
  FolderOpen,
  LayoutDashboard,
  PieChart,
  Settings,
  UserCircle2,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, end: true },
  { label: 'Folders', path: '/folders', icon: FolderOpen },
  { label: 'Reports', path: '/reports', icon: PieChart },
];

const Sidebar = ({ collapsed }) => (
  <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
    <div className="sidebar-brand">
      <div className="sidebar-logo" aria-hidden="true">
        <span className="sidebar-logo-mark">₹</span>
      </div>
      <div className="sidebar-brand-copy">
        <span className="sidebar-brand-text">ExpenseFlow</span>
        <span className="sidebar-brand-sub">Personal finance tracker</span>
      </div>
    </div>

    <nav className="sidebar-nav" aria-label="Primary navigation">
      {navItems.map(({ label, path, icon, end }) => (
        <NavLink
          key={path}
          to={path}
          end={end}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          title={collapsed ? label : undefined}
        >
          <span className="sidebar-link-icon">
            {React.createElement(icon, { size: 18 })}
          </span>
          <span className="sidebar-link-text">{label}</span>
        </NavLink>
      ))}
    </nav>

    <div className="sidebar-footer">
      <div className="sidebar-user">
        <UserCircle2 size={20} />
        <div className="sidebar-user-copy">
          <strong>Anshu</strong>
          <span>All accounts</span>
        </div>
      </div>
      <NavLink
        to="/settings"
        className={({ isActive }) => `sidebar-link sidebar-settings${isActive ? ' active' : ''}`}
        title={collapsed ? 'Settings' : undefined}
      >
        <span className="sidebar-link-icon">
          <Settings size={18} />
        </span>
        <span className="sidebar-link-text">Settings</span>
        {!collapsed ? <ChevronLeft size={16} className="sidebar-settings-arrow" /> : null}
      </NavLink>
    </div>
  </aside>
);

export default Sidebar;

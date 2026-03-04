import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, PieChart, Settings } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Folders', path: '/folders', icon: <FolderOpen size={20} /> },
        { name: 'Reports', path: '/reports', icon: <PieChart size={20} /> },
    ];

    return (
        <aside className="sidebar">
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}></div>
                    <span style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                        ExpenseFlow
                    </span>
                </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '1.5rem 1rem', flex: 1 }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            background: isActive ? 'rgba(128, 128, 128, 0.08)' : 'transparent',
                            textDecoration: 'none',
                            fontWeight: isActive ? 600 : 500,
                            fontSize: '0.875rem',
                            transition: 'all 0.15s ease',
                        })}
                    >
                        {item.icon}
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', border: 'none', background: 'transparent', fontSize: '0.875rem', color: 'var(--text-secondary)' }}
                >
                    <Settings size={18} style={{ marginRight: '8px' }} /> Settings
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;

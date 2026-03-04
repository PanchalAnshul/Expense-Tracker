import React, { useState, useEffect } from 'react';

const Settings = () => {
    const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');

    useEffect(() => {
        const stored = localStorage.getItem('theme');
        if (stored) {
            setTheme(stored);
        }
    }, []);

    const toggleTheme = (newTheme) => {
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Settings</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage your application preferences.</p>
                </div>
            </header>

            <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Appearance</h3>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                        <div>
                            <p style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>Theme Preference</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Choose how the dashboard looks to you.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--glass-bg)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                            <button
                                onClick={() => toggleTheme('light')}
                                style={{
                                    padding: '6px 16px', fontSize: '0.875rem', fontWeight: 500,
                                    borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                                    background: theme === 'light' ? 'var(--panel-bg)' : 'transparent',
                                    color: theme === 'light' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    boxShadow: theme === 'light' ? 'var(--glass-shadow)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Light
                            </button>
                            <button
                                onClick={() => toggleTheme('dark')}
                                style={{
                                    padding: '6px 16px', fontSize: '0.875rem', fontWeight: 500,
                                    borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                                    background: theme === 'dark' ? 'var(--panel-bg)' : 'transparent',
                                    color: theme === 'dark' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    boxShadow: theme === 'dark' ? 'var(--glass-shadow)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Dark
                            </button>
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Account & Data</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Account management is centralized in the local environment database currently.</p>
                </div>
            </div>
        </div>
    );
};

export default Settings;

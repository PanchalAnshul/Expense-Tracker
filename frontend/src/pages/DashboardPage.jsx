import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardStat from '../features/dashboard/Dashboard';
import UploadExcel from '../features/import/UploadExcel';
import ExpenseList from '../components/ExpenseList';
import FilterBar from '../components/FilterBar';
import { folderService } from '../services/folderService';
import { expenseService } from '../services/expenseService';
import { settingsService } from '../services/settingsService';
import { useHeaderSearch } from '../context/SearchContext';

const DashboardPage = () => {
    const [expenses, setExpenses] = useState([]);
    const [folders, setFolders] = useState([]);
    const [appSettings, setAppSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { searchQuery } = useHeaderSearch();

    const [filters, setFilters] = useState({
        category: '',
        start_date: '',
        end_date: '',
        folder_id: ''
    });

    const fetchFolders = async () => {
        try {
            const data = await folderService.getAll();
            setFolders(data);
        } catch (e) { console.error("Could not load folders", e); }
    };

    const fetchSettings = async () => {
        try {
            const s = await settingsService.get();
            setAppSettings(s);
        } catch {
            setAppSettings(null);
        }
    };

    const fetchExpenses = useCallback(async () => {
        try {
            const data = await expenseService.getAll({
                ...filters,
                search: searchQuery || undefined,
            });
            setExpenses(data);
        } catch (error) {
            console.error("Failed to fetch expenses", error);
        } finally {
            setLoading(false);
        }
    }, [filters, searchQuery]);

    useEffect(() => {
        fetchFolders();
        fetchSettings();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchExpenses();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchExpenses]);

    return (
        <>
            <header style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Dashboard Overview</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Global summary of your financial health.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <UploadExcel
                        onUploadSuccess={() => {
                            fetchExpenses();
                            fetchFolders();
                            fetchSettings();
                        }}
                    />
                </div>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-tertiary)' }}>
                    <p>Loading your financial universe...</p>
                </div>
            ) : (
                <>
                    {folders.length === 0 ? (
                        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', marginTop: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Welcome to Expense Tracker V3</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                                To get started with organized expense management, you must first create a Folder to house your transactions.
                            </p>
                            <button className="btn btn-primary" onClick={() => navigate('/folders')}>
                                Create Your First Folder
                            </button>
                        </div>
                    ) : (
                        <>
                            <FilterBar filters={filters} setFilters={setFilters} folders={folders} />

                            <section className="animate-fade-in" style={{ animationDelay: '0.1s', marginTop: '2rem' }}>
                                <DashboardStat expenses={expenses} folders={folders} appSettings={appSettings} />
                            </section>

                            <section className="animate-fade-in" style={{ animationDelay: '0.2s', marginTop: '1rem' }}>
                                <div className="glass-panel" style={{ padding: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Recent Global Transactions</h3>
                                    </div>
                                    <ExpenseList
                                        expenses={expenses}
                                        onEdit={() => navigate('/folders')}
                                        onDelete={() => { }}
                                        readOnly={true}
                                    />
                                </div>
                            </section>
                        </>
                    )}
                </>
            )}
        </>
    );
};

export default DashboardPage;

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Presentation, Download } from 'lucide-react';
import { exportTransactionsToPDF } from '../utils/pdfExport';
import { expenseService } from '../services/expenseService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

const Reports = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('monthly'); // 'monthly' | 'yearly'

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await expenseService.getAll();
                setExpenses(data);
            } catch (err) {
                console.error("Error fetching data for reports", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-tertiary)' }}>Loading analytics...</div>;
    if (!expenses.length) return (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <Presentation size={48} style={{ opacity: 0.5, marginBottom: '1rem', margin: '0 auto', display: 'block' }} />
            <p>No data available to generate reports.</p>
        </div>
    );

    // Process data for charts
    const expenseRecords = expenses.filter(e => e.type === 'expense');

    // 1. Category Breakdown (Pie Chart)
    const categoryTotals = expenseRecords.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {});

    const pieData = Object.keys(categoryTotals).map(key => ({
        name: key,
        value: categoryTotals[key]
    })).sort((a, b) => b.value - a.value);

    // 2. Bar Chart Logic Based on Tab
    const getAggregatedBarData = () => {
        const totals = expenses.reduce((acc, curr) => {
            const key = activeTab === 'monthly' ? curr.date.substring(0, 7) : curr.date.substring(0, 4); // YYYY-MM or YYYY
            if (!acc[key]) acc[key] = { name: key, Income: 0, Expense: 0 };
            if (curr.type === 'income') acc[key].Income += curr.amount;
            else acc[key].Expense += curr.amount;
            return acc;
        }, {});

        return Object.values(totals).sort((a, b) => a.name.localeCompare(b.name));
    };

    const barData = getAggregatedBarData();

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Reports</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Deep analytics across all {expenses.length} transactions.</p>
                </div>
                <button className="btn btn-secondary" onClick={() => exportTransactionsToPDF(expenses)}>
                    <Download size={16} /> Export PDF
                </button>
            </header>

            {/* Tabs */}
            <div className="report-tabs">
                <button
                    type="button"
                    className={`report-tab ${activeTab === 'monthly' ? 'active' : ''}`}
                    onClick={() => setActiveTab('monthly')}
                >
                    Monthly
                </button>
                <button
                    type="button"
                    className={`report-tab ${activeTab === 'yearly' ? 'active' : ''}`}
                    onClick={() => setActiveTab('yearly')}
                >
                    Yearly
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                {/* Pie Chart: Expenses by Category */}
                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>Expenses by Category</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => `Rs.${value.toFixed(2)}`}
                                    contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bar Chart: Cash Flow */}
                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>{activeTab === 'monthly' ? 'Monthly' : 'Yearly'} Cash Flow</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                                <YAxis stroke="var(--text-secondary)" tickFormatter={(value) => `Rs.${value}`} />
                                <Tooltip
                                    formatter={(value) => `Rs.${value.toFixed(2)}`}
                                    cursor={{ fill: 'rgba(128,128,128,0.1)' }}
                                    contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                                />
                                <Legend />
                                <Bar dataKey="Income" fill="#34C759" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Bar dataKey="Expense" fill="#FF3B30" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Reports;

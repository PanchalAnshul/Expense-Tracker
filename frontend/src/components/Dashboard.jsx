import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard = ({ expenses, folders }) => {
    // 1. Cards Data
    const incomes = expenses.filter(e => e.type === 'income');
    const expenseRecords = expenses.filter(e => e.type === 'expense');

    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenseRecords.reduce((sum, item) => sum + item.amount, 0);
    const netBalance = totalIncome - totalExpenses;
    const totalFolders = folders ? folders.length : 0;

    // 2. Charts Data
    const categoryTotals = expenseRecords.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {});

    const pieData = Object.keys(categoryTotals).map(key => ({
        name: key,
        value: categoryTotals[key]
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    const monthlyTotals = expenses.reduce((acc, curr) => {
        const month = curr.date.substring(0, 7);
        if (!acc[month]) acc[month] = { name: month, Income: 0, Expense: 0 };
        if (curr.type === 'income') acc[month].Income += curr.amount;
        else acc[month].Expense += curr.amount;
        return acc;
    }, {});

    const barData = Object.values(monthlyTotals).sort((a, b) => a.name.localeCompare(b.name)).slice(-6);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Total Income</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Rs. {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Total Expenses</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Rs. {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Net Balance</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-color)' }}>Rs. {netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Total Folders</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalFolders}</p>
                </div>
            </div>

            {/* CHARTS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Monthly Overview</h3>
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '260px' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ background: 'var(--panel-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px' }} />
                                    <Bar dataKey="Income" fill="var(--success-color)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                                    <Bar dataKey="Expense" fill="var(--danger-color)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Top Expenses by Category</h3>
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '260px' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--panel-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOLDER SUMMARY LIST */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Folder Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {folders && folders.slice(0, 5).map(folder => (
                        <div key={folder.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(128,128,128,0.04)', borderRadius: 'var(--radius-md)' }}>
                            <span style={{ fontWeight: 500 }}>{folder.name}</span>
                            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Spent: <span style={{ color: 'var(--text-primary)' }}>Rs.{folder.totalExpense.toFixed(2)}</span></span>
                                <span style={{ color: 'var(--text-secondary)' }}>Balance: <span style={{ color: 'var(--success-color)' }}>Rs.{folder.balance.toFixed(2)}</span></span>
                            </div>
                        </div>
                    ))}
                    {folders.length === 0 && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '1rem 0' }}>No folders created yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

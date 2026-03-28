import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const fmt = (n) =>
    `Rs. ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Dashboard = ({ expenses, folders, appSettings }) => {
    const incomes = expenses.filter((e) => e.type === 'income');
    const expenseRecords = expenses.filter((e) => e.type === 'expense');

    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenseRecords.reduce((sum, item) => sum + item.amount, 0);
    const netFlow = totalIncome - totalExpenses;
    const totalFolders = folders ? folders.length : 0;

    const opening = appSettings?.opening_balance;
    const expected = appSettings?.expected_closing_balance;
    const hasOpening = opening !== null && opening !== undefined;
    const hasExpected = expected !== null && expected !== undefined;
    const adjustedBalance = hasOpening ? opening + netFlow : null;
    const basisForCompare = hasOpening ? adjustedBalance : netFlow;
    const variance =
        hasExpected && basisForCompare !== null && basisForCompare !== undefined
            ? basisForCompare - expected
            : null;

    const categoryTotals = expenseRecords.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {});

    const pieData = Object.keys(categoryTotals)
        .map((key) => ({
            name: key,
            value: categoryTotals[key],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    const monthlyTotals = expenses.reduce((acc, curr) => {
        const month = curr.date.substring(0, 7);
        if (!acc[month]) acc[month] = { name: month, Income: 0, Expense: 0 };
        if (curr.type === 'income') acc[month].Income += curr.amount;
        else acc[month].Expense += curr.amount;
        return acc;
    }, {});

    const barData = Object.values(monthlyTotals)
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(-6);

    const showReconciliation = hasOpening || hasExpected;

    return (
        <div className="dashboard-root">
            {showReconciliation && (
                <div className="glass-panel reconciliation-strip">
                    <h3 className="reconciliation-title">Reconciliation</h3>
                    <p className="reconciliation-hint">
                        Net flow is income minus expenses for imported data. Add an opening balance (from your
                        statement start) to align with your bank’s closing balance; set expected closing to see
                        variance.
                    </p>
                    <div className="reconciliation-grid">
                        <div className="reconciliation-item">
                            <span className="reconciliation-label">Net flow (in − out)</span>
                            <span className="reconciliation-value">{fmt(netFlow)}</span>
                        </div>
                        {hasOpening && (
                            <div className="reconciliation-item">
                                <span className="reconciliation-label">Opening balance</span>
                                <span className="reconciliation-value">{fmt(opening)}</span>
                            </div>
                        )}
                        {hasOpening && (
                            <div className="reconciliation-item highlight">
                                <span className="reconciliation-label">Adjusted (opening + net flow)</span>
                                <span className="reconciliation-value">{fmt(adjustedBalance)}</span>
                            </div>
                        )}
                        {hasExpected && (
                            <div className="reconciliation-item">
                                <span className="reconciliation-label">Expected closing (bank)</span>
                                <span className="reconciliation-value">{fmt(expected)}</span>
                            </div>
                        )}
                        {variance !== null && !Number.isNaN(variance) && (
                            <div className="reconciliation-item variance">
                                <span className="reconciliation-label">Variance (vs expected)</span>
                                <span
                                    className="reconciliation-value"
                                    style={{
                                        color:
                                            Math.abs(variance) < 0.01
                                                ? 'var(--success-color)'
                                                : 'var(--warning-color)',
                                    }}
                                >
                                    {fmt(variance)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="dashboard-grid-cards">
                <div className="glass-panel dashboard-stat-card">
                    <p className="dashboard-stat-label">Total income</p>
                    <p className="dashboard-stat-number">{fmt(totalIncome)}</p>
                </div>
                <div className="glass-panel dashboard-stat-card">
                    <p className="dashboard-stat-label">Total expenses</p>
                    <p className="dashboard-stat-number">{fmt(totalExpenses)}</p>
                </div>
                <div className="glass-panel dashboard-stat-card">
                    <p className="dashboard-stat-label">Net flow</p>
                    <p className="dashboard-stat-number accent">{fmt(netFlow)}</p>
                </div>
                <div className="glass-panel dashboard-stat-card">
                    <p className="dashboard-stat-label">Folders</p>
                    <p className="dashboard-stat-number plain">{totalFolders}</p>
                </div>
            </div>

            <div className="dashboard-charts-grid">
                <div className="glass-panel dashboard-chart-panel">
                    <h3 className="dashboard-chart-title">Monthly overview</h3>
                    <div className="dashboard-chart-inner">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--text-secondary)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--panel-bg)',
                                        borderColor: 'var(--glass-border)',
                                        color: 'var(--text-primary)',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Bar dataKey="Income" fill="var(--success-color)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                                <Bar dataKey="Expense" fill="var(--danger-color)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel dashboard-chart-panel">
                    <h3 className="dashboard-chart-title">Top expenses by category</h3>
                    <div className="dashboard-chart-inner">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--panel-bg)',
                                        borderColor: 'var(--glass-border)',
                                        color: 'var(--text-primary)',
                                        borderRadius: '8px',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="glass-panel dashboard-folder-panel">
                <h3 className="dashboard-folder-title">Folder summary</h3>
                <div className="dashboard-folder-list">
                    {folders &&
                        folders.slice(0, 5).map((folder) => (
                            <div key={folder.id} className="dashboard-folder-row">
                                <span className="dashboard-folder-name">{folder.name}</span>
                                <div className="dashboard-folder-meta">
                                    <span className="muted">
                                        Spent:{' '}
                                        <span className="strong">Rs.{folder.totalExpense.toFixed(2)}</span>
                                    </span>
                                    <span className="muted">
                                        Net:{' '}
                                        <span style={{ color: 'var(--success-color)' }}>
                                            Rs.{folder.balance.toFixed(2)}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    {folders.length === 0 && (
                        <p className="dashboard-folder-empty">No folders created yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

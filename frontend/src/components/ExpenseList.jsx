import React from 'react';
import { Pencil, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatDate } from '../utils/dateFormatter';

const ExpenseList = ({ expenses, onEdit, onDelete, readOnly = false }) => {
    if (!expenses || expenses.length === 0) {
        return (
            <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <svg width="64" height="64" fill="none" stroke="var(--text-tertiary)" viewBox="0 0 24 24" style={{ margin: '0 auto 1.5rem' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600 }}>No records found</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Add an entry or import to see your history.</p>
            </div>
        );
    }

    // Sort by date descending
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recent History</h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                            {!readOnly && <th style={{ textAlign: 'right' }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedExpenses.map((expense, idx) => (
                            <tr key={expense.id || idx}>
                                <td>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 500 }}>
                                        {expense.type === 'income' ? (
                                            <ArrowUpRight size={16} color="var(--success-color)" />
                                        ) : (
                                            <ArrowDownRight size={16} color="var(--danger-color)" />
                                        )}
                                        {expense.type.charAt(0).toUpperCase() + expense.type.slice(1)}
                                    </span>
                                </td>
                                <td style={{ color: 'var(--text-secondary)' }}>{formatDate(expense.date)}</td>
                                <td>
                                    <span className={expense.type === 'income' ? 'badge badge-success' : 'badge badge-neutral'}>
                                        {expense.category}
                                    </span>
                                </td>
                                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{expense.description}</td>
                                <td style={{
                                    textAlign: 'right',
                                    fontWeight: '600',
                                    color: expense.type === 'income' ? 'var(--success-color)' : 'var(--text-primary)'
                                }}>
                                    {expense.type === 'income' ? '+' : '-'}Rs.{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                {!readOnly && (
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn-icon" onClick={() => onEdit(expense)} title="Edit">
                                            <Pencil size={16} />
                                        </button>
                                        <button className="btn-icon" onClick={() => onDelete(expense.id)} style={{ color: 'var(--danger-color)' }} title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExpenseList;

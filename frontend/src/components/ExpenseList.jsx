import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/dateFormatter';
import {
  formatCurrency,
  getCategoryMeta,
  groupTransactionsByDate,
} from '../utils/finance';

const EmptyState = ({ title = 'No transactions yet', ctaLabel = 'Add your first transaction' }) => (
  <div className="empty-illustration-card">
    <svg viewBox="0 0 160 120" className="empty-illustration" aria-hidden="true">
      <rect x="18" y="22" width="124" height="76" rx="18" />
      <circle cx="48" cy="50" r="12" />
      <rect x="68" y="42" width="48" height="10" rx="5" />
      <rect x="68" y="60" width="32" height="8" rx="4" />
      <path d="M112 80l10-10 12 12" />
    </svg>
    <h3>{title}</h3>
    <p>Add your first expense to start tracking.</p>
    <button type="button" className="btn btn-gradient">
      {ctaLabel}
    </button>
  </div>
);

const TransactionRow = ({ item, onEdit, onDelete, readOnly }) => {
  const category = getCategoryMeta(item.category);
  const semanticClass = item.type === 'income' ? 'income' : 'expense';

  return (
    <article className="transaction-row">
      <div className="transaction-main">
        <span className="transaction-icon" style={{ '--category-color': category.colorVar }}>
          {category.emoji}
        </span>
        <div className="transaction-copy">
          <strong>{item.description ? item.description : category.label}</strong>
          <div className="transaction-tag-row">
            {item.description && item.description.toLowerCase() !== category.label.toLowerCase() && (
              <span className="transaction-tag" style={{ '--category-color': category.colorVar }}>
                {category.emoji} {category.label}
              </span>
            )}
            {item.payment_mode ? (
              <span className="transaction-tag transaction-tag-neutral">
                {item.payment_mode}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="transaction-meta">
        <strong className={`transaction-amount ${semanticClass}`}>
          {item.type === 'income' ? '+' : '-'}
          {formatCurrency(item.amount)}
        </strong>
        <span>{formatDate(item.date)}</span>
      </div>

      {!readOnly ? (
        <div className="transaction-actions">
          <button type="button" className="icon-button" onClick={() => onEdit?.(item)} aria-label="Edit transaction">
            <Pencil size={15} />
          </button>
          <button
            type="button"
            className="icon-button danger"
            onClick={() => onDelete?.(item)}
            aria-label="Delete transaction"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ) : null}
    </article>
  );
};

const ExpenseList = ({ expenses = [], onEdit, onDelete, readOnly = false }) => {
  if (!expenses.length) {
    return <EmptyState />;
  }

  const groups = groupTransactionsByDate(expenses);

  return (
    <div className="transaction-groups">
      {groups.map(([label, records]) => (
        <section key={label} className="transaction-group">
          <header className="transaction-group-header">{label}</header>
          <div className="transaction-group-list">
            {records.map((item) => (
              <TransactionRow
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                readOnly={readOnly}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ExpenseList;

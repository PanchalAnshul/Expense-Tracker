import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Command, FolderOpen, Plus, Repeat, Search } from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { folderService } from '../services/folderService';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  formatCurrency,
  getRelativeDateLabel,
} from '../utils/finance';
import { useToast } from '../context/ToastContext';

const todayString = () => new Date().toISOString().split('T')[0];

const QuickAddRecord = ({ onSuccess, defaultFolderId = null, sticky = false }) => {
  const toast = useToast();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayString());
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState(defaultFolderId ? String(defaultFolderId) : '');
  const [showExpanded, setShowExpanded] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [folders, setFolders] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    folderService.getAll().then(setFolders).catch(() => {});
  }, []);

  useEffect(() => {
    if (defaultFolderId) setFolderId(String(defaultFolderId));
  }, [defaultFolderId]);

  const categories = useMemo(
    () => (type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES),
    [type]
  );

  const filteredCategories = useMemo(() => {
    const query = category.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((item) => item.label.toLowerCase().includes(query));
  }, [categories, category]);

  const saveRecord = async () => {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0 || !category.trim()) {
      toast.error('Enter a valid amount and choose a category.');
      return;
    }

    setSaving(true);
    try {
      await expenseService.create({
        type,
        amount: parsedAmount,
        date,
        category: category.trim(),
        description: description.trim(),
        folder_id: folderId ? Number(folderId) : null,
      });

      toast.success(`${type === 'expense' ? 'Expense' : 'Income'} of ${formatCurrency(parsedAmount)} added`);
      setAmount('');
      setCategory('');
      setDescription('');
      setShowExpanded(false);
      setShowCategoryPicker(false);
      onSuccess?.();
    } catch {
      toast.error('We could not add that transaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={`command-bar ${sticky ? 'is-sticky' : ''}`}>
      <div className="command-bar-row">
        <div className="type-toggle" role="tablist" aria-label="Transaction type">
          <div className={`type-toggle-indicator ${type === 'income' ? 'is-income' : ''}`} />
          <button
            type="button"
            className={`type-toggle-option ${type === 'expense' ? 'active is-expense' : ''}`}
            onClick={() => setType('expense')}
          >
            <span className="type-dot expense" />
            Expense
          </button>
          <button
            type="button"
            className={`type-toggle-option ${type === 'income' ? 'active is-income' : ''}`}
            onClick={() => setType('income')}
          >
            <span className="type-dot income" />
            Income
          </button>
        </div>

        <label className="command-amount">
          <span className="command-amount-prefix">₹</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            onFocus={() => setShowExpanded(true)}
            placeholder="0.00"
            className="command-amount-input"
            aria-label="Amount"
            autoFocus
          />
        </label>

        <label className="command-chip command-chip-input">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Date" />
          <span>{getRelativeDateLabel(date)}</span>
        </label>

        <div className="command-category">
          <button
            type="button"
            className="command-chip command-chip-button"
            onClick={() => setShowCategoryPicker((current) => !current)}
          >
            <Search size={15} />
            <span>{category || 'Choose category'}</span>
            <ChevronDown size={15} />
          </button>

          {showCategoryPicker ? (
            <div className="command-category-menu">
              <label className="command-category-search">
                <Search size={14} />
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Search category"
                  aria-label="Search categories"
                />
              </label>
              <div className="command-category-list">
                {filteredCategories.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="command-category-item"
                    onClick={() => {
                      setCategory(item.label);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                    <small>Recent pick</small>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <input
          className="command-note"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          onFocus={() => setShowExpanded(true)}
          placeholder="Add a note"
          aria-label="Note"
          maxLength={140}
        />

        <div className="command-submit-group">
          <button type="button" className="btn btn-gradient command-submit" onClick={saveRecord} disabled={saving}>
            <span>{saving ? 'Saving...' : 'Add record'}</span>
            <span className="command-shortcut">
              <Command size={12} /> Enter
            </span>
          </button>

          <button
            type="button"
            className="command-expand-btn"
            onClick={() => setShowExpanded((current) => !current)}
            aria-expanded={showExpanded}
            aria-label="Show more fields"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {showExpanded ? (
        <div className="command-bar-expanded">
          <label className="command-select">
            <FolderOpen size={15} />
            <select value={folderId} onChange={(event) => setFolderId(event.target.value)} aria-label="Folder">
              <option value="">Select folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="command-recurring">
            <Repeat size={15} />
            Recurring
          </button>
        </div>
      ) : null}
    </section>
  );
};

export default QuickAddRecord;

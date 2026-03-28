import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, FolderOpen, Tag, X } from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { folderService } from '../services/folderService';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  formatCurrency,
  getCategoryMeta,
} from '../utils/finance';
import { useToast } from '../context/ToastContext';

const todayString = () => new Date().toISOString().split('T')[0];
const yesterdayString = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
};

const RecordDialog = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const toast = useToast();
  const isEditing = Boolean(initialData?.id);
  const [folders, setFolders] = useState([]);
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayString());
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    folderService.getAll().then(setFolders).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setType(initialData?.type || 'expense');
    setAmount(initialData?.amount ? String(initialData.amount) : '');
    setDate(initialData?.date ? initialData.date.split('T')[0] : todayString());
    setCategory(initialData?.category || '');
    setDescription(initialData?.description || '');
    setFolderId(initialData?.folder_id ? String(initialData.folder_id) : '');
    setIsSuccess(false);
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const listener = (event) => {
      if (event.key === 'Escape') onClose();
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('transaction-submit')?.click();
      }
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [isOpen, onClose]);

  const categories = useMemo(
    () => (type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES),
    [type]
  );

  if (!isOpen) return null;

  const accentClass = type === 'expense' ? 'expense' : 'income';

  const handleSave = async (event, keepOpen = false) => {
    if (event) event.preventDefault();

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0 || !category.trim()) {
      toast.error('Please enter an amount and select a category.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type,
        amount: parsedAmount,
        date,
        category: category.trim(),
        description: description.trim(),
        folder_id: folderId ? Number(folderId) : null,
      };

      if (isEditing) {
        await expenseService.update(initialData.id, payload);
      } else {
        await expenseService.create(payload);
      }

      setIsSuccess(true);
      toast.success(`${isEditing ? 'Transaction updated' : `${type === 'expense' ? 'Expense' : 'Income'} added`}`);
      onSuccess?.();
      
      setTimeout(() => {
        setIsSuccess(false);
        if (keepOpen && !isEditing) {
          setAmount('');
          setDescription('');
        } else {
          onClose();
        }
      }, 420);
    } catch {
      toast.error('Something went wrong while saving this transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="transaction-modal">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="transaction-modal-header">
          <span className="modal-eyebrow">New transaction</span>
          <h2>{type === 'expense' ? 'Add Expense' : 'Add Income'}</h2>
          <div className="modal-type-toggle">
            <div className={`modal-type-indicator ${accentClass}`} />
            <button type="button" className={type === 'expense' ? 'active expense' : ''} onClick={() => setType('expense')}>
              Expense
            </button>
            <button type="button" className={type === 'income' ? 'active income' : ''} onClick={() => setType('income')}>
              Income
            </button>
          </div>
        </div>

        <form className="transaction-modal-form" onSubmit={(e) => handleSave(e, false)}>
          <section className={`modal-amount-card ${accentClass}`}>
            <span className="modal-field-label">Amount</span>
            <label className="modal-amount-input">
              <span>₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </label>
            <small>{amount ? formatCurrency(amount) : '₹0.00'}</small>
          </section>

          <label className="modal-field">
            <span className="modal-field-label">
              <CalendarDays size={15} />
              Date
            </span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            <div className="modal-quick-chips">
              {[
                { label: 'Today', value: todayString() },
                { label: 'Yesterday', value: yesterdayString() },
                { label: 'This week', value: todayString() },
              ].map((chip) => (
                <button key={chip.label} type="button" onClick={() => setDate(chip.value)}>
                  {chip.label}
                </button>
              ))}
            </div>
          </label>

          <div className="modal-field">
            <span className="modal-field-label">
              <Tag size={15} />
              Category
            </span>
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Search or type a category"
            />
            <div className="modal-category-grid">
              {categories.map((item) => {
                const meta = getCategoryMeta(item.label);
                const selected = category === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`modal-category-chip ${selected ? 'selected' : ''}`}
                    style={{ '--category-color': meta.colorVar }}
                    onClick={() => setCategory(item.label)}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="modal-field">
            <span className="modal-field-label">
              <FolderOpen size={15} />
              Folder
            </span>
            <select value={folderId} onChange={(event) => setFolderId(event.target.value)}>
              <option value="">Select a folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>

          <label className="modal-field">
            <span className="modal-field-label">Note</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add a short note"
              maxLength={140}
              rows={3}
            />
            <small>{description.length}/140</small>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '1fr' : '1fr 1fr', gap: '12px' }}>
            <button
              id="transaction-submit"
              type="submit"
              className={`btn btn-gradient modal-submit ${isSuccess ? 'is-success' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isSuccess ? '✓ Saved' : `${isEditing ? 'Update' : 'Add'} ${type === 'expense' ? 'Expense' : 'Income'}`}
              <span>⌘ Enter</span>
            </button>
            {!isEditing && (
              <button
                type="button"
                className="btn btn-outline modal-submit"
                disabled={isSubmitting}
                onClick={(e) => handleSave(e, true)}
                style={{ width: '100%' }}
              >
                {isSubmitting ? 'Saving...' : 'Save & Continue'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordDialog;

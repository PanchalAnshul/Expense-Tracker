import React, { useState, useEffect } from 'react';

const RecordDialog = ({ isOpen, onClose, onSuccess, initialData = null }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [folders, setFolders] = useState([]);

    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [folderId, setFolderId] = useState('');

    const isEditing = !!(initialData && initialData.id);

    useEffect(() => {
        fetch('http://localhost:8000/api/folders/')
            .then((res) => res.json())
            .then((data) => setFolders(data))
            .catch(() => console.error('Could not load folders'));
    }, []);

    useEffect(() => {
        if (initialData && isOpen) {
            setType(initialData.type || 'expense');
            setAmount(initialData.amount !== undefined && initialData.amount !== null ? String(initialData.amount) : '');
            setDate(
                initialData.date
                    ? initialData.date.split('T')[0]
                    : new Date().toISOString().split('T')[0]
            );
            setCategory(initialData.category || '');
            setDescription(initialData.description || '');
            const fid = initialData.folder_id;
            setFolderId(fid !== undefined && fid !== null ? String(fid) : '');
        } else if (isOpen) {
            setType('expense');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setCategory('');
            setDescription('');
            setFolderId('');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const buildPayload = () => {
        const folder_id = folderId ? parseInt(folderId, 10) : null;
        return {
            type,
            amount: parseFloat(amount),
            date,
            category,
            description: description || '',
            folder_id: Number.isNaN(folder_id) ? null : folder_id,
        };
    };

    const save = async (continueAfterSave) => {
        if (!amount || !date || !category) {
            setError('Please fill out amount, date, and category.');
            return;
        }

        const parsed = parseFloat(amount);
        if (Number.isNaN(parsed)) {
            setError('Amount must be a valid number.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const payload = { ...buildPayload(), amount: parsed };

        const url = isEditing
            ? `http://localhost:8000/api/expenses/${initialData.id}`
            : 'http://localhost:8000/api/expenses/';

        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                await Promise.resolve(onSuccess());
                if (continueAfterSave && !isEditing) {
                    setAmount('');
                    setCategory('');
                    setDescription('');
                    setType('expense');
                } else {
                    onClose();
                }
            } else {
                const data = await response.json().catch(() => ({}));
                let errMsg = `Failed to ${isEditing ? 'update' : 'add'} record`;
                if (data.detail) {
                    if (Array.isArray(data.detail)) {
                        errMsg = data.detail.map((d) => d.msg).join(', ');
                    } else if (typeof data.detail === 'string') {
                        errMsg = data.detail;
                    } else {
                        errMsg = JSON.stringify(data.detail);
                    }
                }
                setError(errMsg);
            }
        } catch {
            setError('Network error: could not reach server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="record-dialog-overlay"
            role="presentation"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="glass-panel record-dialog" role="dialog" aria-labelledby="record-dialog-title">
                <div className="record-dialog-head">
                    <h2 id="record-dialog-title" className="record-dialog-title">
                        {isEditing ? 'Edit transaction' : 'New transaction'}
                    </h2>
                    <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="record-dialog-error">{error}</div>
                )}

                <form
                    className="record-dialog-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        save(false);
                    }}
                >
                    <div className="record-type-toggle">
                        <label className={type === 'expense' ? 'active expense' : ''}>
                            <input
                                type="radio"
                                value="expense"
                                checked={type === 'expense'}
                                onChange={(e) => setType(e.target.value)}
                            />
                            <span>Expense</span>
                        </label>
                        <label className={type === 'income' ? 'active income' : ''}>
                            <input
                                type="radio"
                                value="income"
                                checked={type === 'income'}
                                onChange={(e) => setType(e.target.value)}
                            />
                            <span>Income</span>
                        </label>
                    </div>

                    <div className="record-dialog-row">
                        <div className="record-field">
                            <label className="input-label">Amount</label>
                            <input
                                className="input-field"
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                        <div className="record-field">
                            <label className="input-label">Date</label>
                            <input
                                className="input-field"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="record-field">
                        <label className="input-label">Category</label>
                        <input
                            className="input-field"
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g. Salary, groceries, rent"
                        />
                    </div>

                    <div className="record-field">
                        <label className="input-label">Folder (optional)</label>
                        <select
                            className="input-field"
                            value={folderId}
                            onChange={(e) => setFolderId(e.target.value)}
                        >
                            <option value="">No folder (global)</option>
                            {folders.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="record-field">
                        <label className="input-label">Description (optional)</label>
                        <input
                            className="input-field"
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a note…"
                        />
                    </div>

                    <div className="record-dialog-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        {!isEditing && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => save(true)}
                                disabled={isSubmitting}
                                title="Save and keep this date to add more entries for the same day"
                            >
                                {isSubmitting ? 'Saving…' : 'Save & continue'}
                            </button>
                        )}
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving…' : isEditing ? 'Update' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordDialog;

import React, { useState, useEffect } from 'react';

const RecordDialog = ({ isOpen, onClose, onSuccess, initialData = null }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [folders, setFolders] = useState([]);

    // Form State
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [folderId, setFolderId] = useState('');

    const isEditing = !!(initialData && initialData.id);
    useEffect(() => {
        // Fetch Folders for the dropdown
        fetch('http://localhost:8000/api/folders/')
            .then(res => res.json())
            .then(data => setFolders(data))
            .catch(() => console.error("Could not load folders"));
    }, []);

    useEffect(() => {
        if (initialData && isOpen) {
            setType(initialData.type || 'expense');
            setAmount(initialData.amount || '');
            setDate(initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0]);
            setCategory(initialData.category || '');
            setDescription(initialData.description || '');
            setFolderId(initialData.folder_id || '');
        } else if (isOpen) {
            // Reset for new creation
            setType('expense');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setCategory('');
            setDescription('');
            setFolderId('');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !date || !category) {
            setError("Please fill out Amount, Date, and Category.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const payload = {
            type,
            amount: parseFloat(amount),
            date,
            category,
            description,
            folder_id: folderId ? parseInt(folderId) : null
        };

        const url = isEditing
            ? `http://localhost:8000/api/expenses/${initialData.id}`
            : 'http://localhost:8000/api/expenses/';

        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await response.json();
                let errMsg = `Failed to ${isEditing ? 'update' : 'add'} record`;
                if (data.detail) {
                    if (Array.isArray(data.detail)) {
                        errMsg = data.detail.map(d => d.msg).join(', ');
                    } else if (typeof data.detail === 'string') {
                        errMsg = data.detail;
                    } else {
                        errMsg = JSON.stringify(data.detail);
                    }
                }
                setError(errMsg);
            }
        } catch (err) {
            setError('Network error: Could not reach server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeInUp 0.2s ease-out'
        }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2rem', background: 'rgba(30, 30, 32, 0.85)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                        {isEditing ? 'Edit Transaction' : 'New Transaction'}
                    </h2>
                    <button
                        className="btn-icon"
                        onClick={onClose}
                    >
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {error && (
                    <div style={{ background: 'rgba(255, 69, 58, 0.15)', color: 'var(--danger-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                        <label style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: type === 'expense' ? 'rgba(255,69,58,0.2)' : 'transparent', color: type === 'expense' ? 'var(--danger-color)' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
                            <input type="radio" value="expense" checked={type === 'expense'} onChange={(e) => setType(e.target.value)} style={{ display: 'none' }} />
                            <span style={{ fontWeight: type === 'expense' ? '600' : '500' }}>Expense</span>
                        </label>
                        <label style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: type === 'income' ? 'rgba(52,199,89,0.2)' : 'transparent', color: type === 'income' ? 'var(--success-color)' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
                            <input type="radio" value="income" checked={type === 'income'} onChange={(e) => setType(e.target.value)} style={{ display: 'none' }} />
                            <span style={{ fontWeight: type === 'income' ? '600' : '500' }}>Income</span>
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label className="input-label">Amount</label>
                            <input
                                className="input-field"
                                type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00" autoFocus
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="input-label">Date</label>
                            <input
                                className="input-field"
                                type="date" value={date} onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="input-label">Category</label>
                        <input
                            className="input-field"
                            type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g. Salary, Groceries, Rent"
                        />
                    </div>

                    <div>
                        <label className="input-label">Folder (Optional)</label>
                        <select
                            className="input-field"
                            value={folderId}
                            onChange={(e) => setFolderId(e.target.value)}
                            style={{ appearance: 'none' }}
                        >
                            <option value="">No Folder (Global)</option>
                            {folders.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="input-label">Description (Optional)</label>
                        <input
                            className="input-field"
                            type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a note..."
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Record' : 'Save Record')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordDialog;

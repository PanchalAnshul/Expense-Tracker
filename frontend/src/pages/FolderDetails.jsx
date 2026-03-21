import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Download } from 'lucide-react';
import ExpenseList from '../components/ExpenseList';
import RecordDialog from '../components/RecordDialog';
import FilterBar from '../components/FilterBar';
import { exportTransactionsToPDF } from '../utils/pdfExport';
import { formatDate } from '../utils/dateFormatter';
import { folderService } from '../services/folderService';
import { expenseService } from '../services/expenseService';

const FolderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [folder, setFolder] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);

    // Filter State
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        start_date: '',
        end_date: '',
        folder_id: id // lock to this folder natively
    });

    const fetchData = async () => {
        try {
            // 1. Fetch Folder Meta
            const allFolders = await folderService.getAll();
            const me = allFolders.find(f => f.id === parseInt(id));
            setFolder(me);

            // 2. Fetch scoped expenses
            const data = await expenseService.getAll(filters);
            setExpenses(data);
        } catch (e) {
            console.error("Error loading folder details", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters]);

    const handleDelete = async (expId) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            await expenseService.delete(expId);
            fetchData();
        } catch (err) { console.error("Error deleting", err); }
    };

    const handleCreate = () => {
        setEditingRecord(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (rec) => {
        setEditingRecord(rec);
        setIsDialogOpen(true);
    };

    if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading folder hub...</div>;
    if (!folder) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--danger)' }}>Folder not found.</div>;

    return (
        <div className="animate-fade-in">
            <button
                className="btn btn-secondary"
                onClick={() => navigate('/folders')}
                style={{ marginBottom: '2rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
                <ChevronLeft size={18} /> Back to Folders
            </button>

            {/* Folder Header & Summary */}
            <header style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>{folder.name}</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Created: {formatDate(folder.created_at)}</p>
                </div>

                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '4px' }}>Total Income</p>
                        <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.125rem' }}>Rs.{folder.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '4px' }}>Total Expense</p>
                        <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.125rem' }}>Rs.{folder.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div style={{ paddingLeft: '2rem', borderLeft: '1px solid var(--glass-border)' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '4px' }}>Net Balance</p>
                        <p style={{ color: folder.balance >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 700, fontSize: '1.25rem' }}>Rs.{Math.abs(folder.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </header>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Transactions</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => exportTransactionsToPDF(expenses, folder)}>
                        <Download size={16} /> Export PDF
                    </button>
                    <button className="btn btn-primary" onClick={handleCreate}>
                        <Plus size={16} /> Add Record
                    </button>
                </div>
            </div>

            <FilterBar filters={filters} setFilters={setFilters} folders={[]} />

            <div style={{ marginTop: '1rem' }}>
                <ExpenseList
                    expenses={expenses}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>

            {/* Scoped Record Dialog */}
            <RecordDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={fetchData}
                initialData={editingRecord || { folder_id: id }}
            />
        </div>
    );
};

export default FolderDetails;

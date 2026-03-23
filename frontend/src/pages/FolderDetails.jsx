import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Download } from 'lucide-react';
import ExpenseList from '../components/ExpenseList';
import RecordDialog from '../components/RecordDialog';
import FilterBar from '../components/FilterBar';
import { exportTransactionsToPDF } from '../utils/pdfExport';
import { formatDate } from '../utils/dateFormatter';
import { folderService } from '../services/folderService';
import { expenseService } from '../services/expenseService';
import { useHeaderSearch } from '../context/SearchContext';

const FolderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { searchQuery } = useHeaderSearch();

    const [folder, setFolder] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const mainScrollPos = useRef(0);

    const captureMainScroll = useCallback(() => {
        const el = document.querySelector('.main-content');
        mainScrollPos.current = el ? el.scrollTop : 0;
    }, []);

    const restoreMainScroll = useCallback(() => {
        const y = mainScrollPos.current;
        requestAnimationFrame(() => {
            const el = document.querySelector('.main-content');
            if (el) el.scrollTop = y;
            requestAnimationFrame(() => {
                const el2 = document.querySelector('.main-content');
                if (el2) el2.scrollTop = y;
            });
        });
    }, []);

    const [filters, setFilters] = useState({
        category: '',
        start_date: '',
        end_date: '',
    });

    const fetchData = useCallback(async () => {
        try {
            const allFolders = await folderService.getAll();
            const me = allFolders.find((f) => f.id === parseInt(id, 10));
            setFolder(me || null);

            const data = await expenseService.getAll({
                ...filters,
                folder_id: id,
                search: searchQuery || undefined,
            });
            setExpenses(data);
        } catch (e) {
            console.error('Error loading folder details', e);
        } finally {
            setLoading(false);
        }
    }, [id, filters, searchQuery]);

    const handleRecordSuccess = useCallback(async () => {
        await fetchData();
        restoreMainScroll();
    }, [fetchData, restoreMainScroll]);

    useEffect(() => {
        setLoading(true);
        setFolder(null);
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (expId) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            await expenseService.delete(expId);
            fetchData();
        } catch (err) {
            console.error('Error deleting', err);
        }
    };

    const handleCreate = () => {
        captureMainScroll();
        setEditingRecord(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (rec) => {
        captureMainScroll();
        setEditingRecord(rec);
        setIsDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="loading-spinner" />
                <p>Loading folder…</p>
            </div>
        );
    }
    if (!folder) {
        return (
            <div className="page-error">
                Folder not found.
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <button
                type="button"
                className="btn btn-secondary back-link"
                onClick={() => navigate('/folders')}
            >
                <ChevronLeft size={18} /> Back to folders
            </button>

            <header className="page-header folder-header">
                <div>
                    <h1 className="page-title">{folder.name}</h1>
                    <p className="page-subtitle">Created {formatDate(folder.created_at)}</p>
                </div>

                <div className="folder-stats">
                    <div className="folder-stat">
                        <span className="folder-stat-label">Total income</span>
                        <span className="folder-stat-value">
                            Rs.{folder.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="folder-stat">
                        <span className="folder-stat-label">Total expense</span>
                        <span className="folder-stat-value">
                            Rs.{folder.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="folder-stat folder-stat-balance">
                        <span className="folder-stat-label">Net balance</span>
                        <span
                            className="folder-stat-value accent"
                            style={{
                                color: folder.balance >= 0 ? 'var(--success-color)' : 'var(--danger-color)',
                            }}
                        >
                            Rs.{Math.abs(folder.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </header>

            <div className="section-head">
                <h2 className="section-title">Transactions</h2>
                <div className="section-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => exportTransactionsToPDF(expenses, folder)}
                    >
                        <Download size={16} /> Export PDF
                    </button>
                    <button type="button" className="btn btn-primary" onClick={handleCreate}>
                        <Plus size={16} /> Add record
                    </button>
                </div>
            </div>

            <FilterBar
                filters={filters}
                setFilters={setFilters}
                folders={[]}
                lockedFolderId={id}
            />

            <div className="section-body">
                <ExpenseList
                    expenses={expenses}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>

            <RecordDialog
                isOpen={isDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false);
                    setEditingRecord(null);
                }}
                onSuccess={handleRecordSuccess}
                initialData={editingRecord || { folder_id: parseInt(id, 10) }}
            />
        </div>
    );
};

export default FolderDetails;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Download, Plus } from 'lucide-react';
import ExpenseList from '../components/ExpenseList';
import FilterBar from '../components/FilterBar';
import QuickAddRecord from '../components/QuickAddRecord';
import RecordDialog from '../components/RecordDialog';
import { expenseService } from '../services/expenseService';
import { folderService } from '../services/folderService';
import { exportTransactionsToPDF } from '../utils/pdfExport';
import { formatDate } from '../utils/dateFormatter';
import { formatCurrency } from '../utils/finance';
import { useHeaderSearch } from '../context/SearchContext';
import { useToast } from '../context/ToastContext';

const FolderDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { searchQuery } = useHeaderSearch();
  const [folder, setFolder] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', start_date: '', end_date: '', folder_id: id });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [importSummary, setImportSummary] = useState(location.state?.importSummary || null);

  useEffect(() => {
    if (location.state?.importSummary) {
      setImportSummary(location.state.importSummary);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const loadFolder = useCallback(async () => {
    setLoading(true);
    try {
      const [folders, expenses] = await Promise.all([
        folderService.getAll(),
        expenseService.getAll({ ...filters, folder_id: id, search: searchQuery || undefined }),
      ]);
      setFolder(folders.find((item) => String(item.id) === String(id)) || null);
      setRecords(expenses);
    } finally {
      setLoading(false);
    }
  }, [filters, id, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(loadFolder, 180);
    return () => clearTimeout(timer);
  }, [loadFolder]);

  const deleteRecord = async (item) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await expenseService.delete(item.id);
      toast.info({
        message: 'Transaction deleted',
        actionLabel: 'Undo',
        onAction: () => setDialogOpen(true),
      });
      loadFolder();
    } catch {
      toast.error('Unable to delete that transaction.');
    }
  };

  const stats = useMemo(
    () =>
      folder
        ? [
            { label: 'Income', value: formatCurrency(folder.totalIncome), className: 'income' },
            { label: 'Expense', value: formatCurrency(folder.totalExpense), className: 'expense' },
            { label: 'Net Balance', value: formatCurrency(folder.balance), className: folder.balance >= 0 ? 'net' : 'expense' },
          ]
        : [],
    [folder]
  );

  if (loading) {
    return <div className="page-loading"><div className="loading-spinner" /><p>Loading folder...</p></div>;
  }

  if (!folder) {
    return <div className="page-loading"><p>Folder not found.</p></div>;
  }

  return (
    <div className="folder-details-page">
      <button type="button" className="back-button" onClick={() => navigate('/folders')}>
        <ChevronLeft size={16} />
        Back to Folders
      </button>

      <section className="folder-detail-hero">
        <div>
          <p className="page-eyebrow">Folder detail</p>
          <h1>{folder.name}</h1>
          <p>Created {formatDate(folder.created_at)}</p>
        </div>
        <div className="folder-detail-actions">
          <button type="button" className="btn btn-outline" onClick={() => exportTransactionsToPDF(records, folder)}>
            <Download size={16} />
            Export PDF
          </button>
          <button type="button" className="btn btn-gradient" onClick={() => setDialogOpen(true)}>
            <Plus size={16} />
            Add Record
          </button>
        </div>
      </section>

      <section className="folder-detail-stats-grid">
        {stats.map((stat) => (
          <article key={stat.label} className={`folder-stat-card ${stat.className}`}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      {importSummary ? (
        <section className="panel-section import-warnings-panel">
          <div className="panel-header">
            <div>
              <h2>Import Summary</h2>
              <p>
                {importSummary.rowsImported} transaction(s) imported into {importSummary.folderName}.
              </p>
            </div>
            <button type="button" className="panel-link" onClick={() => setImportSummary(null)}>
              Dismiss
            </button>
          </div>
          {importSummary.warnings?.length ? (
            <div className="import-warning-list">
              {importSummary.warnings.map((warning) => (
                <article key={`${warning.row}-${warning.message}`} className="import-warning-item">
                  <strong>Row {warning.row}</strong>
                  <p>{warning.message}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="import-warnings-empty">No import warnings. Every valid row was imported cleanly.</p>
          )}
        </section>
      ) : null}

      <QuickAddRecord onSuccess={loadFolder} defaultFolderId={Number(id)} sticky />

      <section className="panel-section">
        <div className="panel-header">
          <div>
            <h2>Transaction History</h2>
            <p>Sortable, filterable history inside this folder.</p>
          </div>
        </div>
        <FilterBar filters={filters} setFilters={setFilters} lockedFolderId={id} />
        <ExpenseList
          expenses={records}
          onEdit={(item) => {
            setEditingRecord(item);
            setDialogOpen(true);
          }}
          onDelete={deleteRecord}
        />
      </section>

      <RecordDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingRecord(null);
        }}
        onSuccess={loadFolder}
        initialData={editingRecord || { folder_id: Number(id) }}
      />
    </div>
  );
};

export default FolderDetails;

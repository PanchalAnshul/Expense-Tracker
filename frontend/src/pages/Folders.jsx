import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { folderService } from '../services/folderService';
import { useHeaderSearch } from '../context/SearchContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/finance';

const Folders = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { searchQuery } = useHeaderSearch();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');

  const loadFolders = async () => {
    setLoading(true);
    try {
      setFolders(await folderService.getAll());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const visibleFolders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return folders;
    return folders.filter((folder) => folder.name.toLowerCase().includes(query));
  }, [folders, searchQuery]);

  const totals = useMemo(
    () => ({
      count: folders.length,
      income: folders.reduce((sum, folder) => sum + Number(folder.totalIncome || 0), 0),
      spent: folders.reduce((sum, folder) => sum + Number(folder.totalExpense || 0), 0),
      net: folders.reduce((sum, folder) => sum + Number(folder.balance || 0), 0),
    }),
    [folders]
  );

  const createFolder = async (event) => {
    event.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await folderService.create(newFolderName.trim());
      toast.success(`Folder "${newFolderName.trim()}" created`);
      setNewFolderName('');
      loadFolders();
    } catch (error) {
      toast.error(error.message || 'We could not create that folder.');
    }
  };

  const deleteFolder = async (folder) => {
    if (!window.confirm(`Delete "${folder.name}"? Transactions will stay available.`)) return;
    try {
      await folderService.delete(folder.id);
      toast.info(`Folder "${folder.name}" deleted`);
      loadFolders();
    } catch {
      toast.error('Unable to delete this folder right now.');
    }
  };

  return (
    <div className="folders-page">
      <section className="page-hero">
        <div>
          <p className="page-eyebrow">Folders</p>
          <h1>Organize records by period, project, or purpose.</h1>
          <p className="page-hero-copy">
            Clear snapshots for every cashbook, trip, fiscal year, or daily spending bucket.
          </p>
        </div>
        <button type="button" className="btn btn-gradient" onClick={() => document.getElementById('folder-name')?.focus()}>
          <FolderPlus size={16} />
          New Folder
        </button>
      </section>

      <div className="summary-pill-strip">
        <article className="summary-pill">
          <span className="summary-pill-dot neutral" />
          <div>
            <small>Total folders</small>
            <strong>{totals.count}</strong>
          </div>
        </article>
        <article className="summary-pill">
          <span className="summary-pill-dot income" />
          <div>
            <small>Total income</small>
            <strong>{formatCurrency(totals.income)}</strong>
          </div>
        </article>
        <article className="summary-pill">
          <span className="summary-pill-dot expense" />
          <div>
            <small>Total spent</small>
            <strong>{formatCurrency(totals.spent)}</strong>
          </div>
        </article>
        <article className="summary-pill">
          <span className="summary-pill-dot purple" />
          <div>
            <small>Net balance</small>
            <strong>{formatCurrency(totals.net)}</strong>
          </div>
        </article>
      </div>

      <form className="folder-create-inline" onSubmit={createFolder}>
        <input
          id="folder-name"
          value={newFolderName}
          onChange={(event) => setNewFolderName(event.target.value)}
          placeholder="Create a folder like SBI_CashBook_FY2025_26"
        />
        <button type="submit" className="btn btn-gradient">
          Create
        </button>
      </form>

      {loading ? (
        <div className="folder-grid">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="folder-tile">
              <div className="skeleton skeleton-line short" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-progress" />
              <div className="skeleton skeleton-line large" />
            </div>
          ))}
        </div>
      ) : (
        <div className="folder-grid">
          <button type="button" className="folder-new-tile" onClick={() => document.getElementById('folder-name')?.focus()}>
            <FolderPlus size={20} />
            <span>New Folder</span>
          </button>

          {visibleFolders.map((folder, index) => {
            const spentPercent = folder.totalIncome > 0 ? Math.min(100, (folder.totalExpense / folder.totalIncome) * 100) : 0;
            const riskClass = spentPercent > 90 ? 'danger' : spentPercent > 70 ? 'warning' : 'good';

            return (
              <article key={folder.id} className="folder-tile" onClick={() => navigate(`/folders/${folder.id}`)}>
                <div className="folder-tile-head">
                  <div className="folder-tile-icon">{index + 1}</div>
                  <div className="folder-tile-copy">
                    <h3>{folder.name}</h3>
                    <p>{folder.expenseCount || 0} transactions</p>
                  </div>
                  <div className="folder-tile-actions" onClick={(event) => event.stopPropagation()}>
                    <button type="button" className="icon-button" onClick={() => navigate(`/folders/${folder.id}`)}>
                      <Pencil size={15} />
                    </button>
                    <button type="button" className="icon-button danger" onClick={() => deleteFolder(folder)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="folder-progress-block">
                  <div className="folder-progress-track">
                    <div className={`folder-progress-fill ${riskClass}`} style={{ width: `${spentPercent}%` }} />
                  </div>
                  <span className={`folder-progress-label ${riskClass}`}>{spentPercent.toFixed(0)}%</span>
                </div>

                <div className="folder-money-row">
                  <span className="income">↑ {formatCurrency(folder.totalIncome)}</span>
                  <span className="expense">↓ {formatCurrency(folder.totalExpense)}</span>
                </div>

                <div className="folder-net-row">
                  <span className={`folder-net-pill ${folder.balance >= 0 ? 'positive' : 'negative'}`}>
                    Net: {folder.balance >= 0 ? '+' : '-'}
                    {formatCurrency(Math.abs(folder.balance))}
                  </span>
                  <span className="folder-open-arrow">
                    Open <ArrowRight size={14} />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Folders;

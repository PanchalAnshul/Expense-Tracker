import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  CircleDollarSign,
  FolderOpen,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import QuickAddRecord from '../components/QuickAddRecord';
import FilterBar from '../components/FilterBar';
import ExpenseList from '../components/ExpenseList';
import { expenseService } from '../services/expenseService';
import { folderService } from '../services/folderService';
import { settingsService } from '../services/settingsService';
import { useHeaderSearch } from '../context/SearchContext';
import { formatCompactCurrency, formatCurrency, formatSignedCurrency, getTransactionSummary } from '../utils/finance';

const LoadingDashboard = () => (
  <div className="dashboard-page">
    <div className="skeleton hero-skeleton" />
    <div className="stats-grid">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="stats-card">
          <div className="skeleton skeleton-icon" />
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-line large" />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </div>
    <div className="skeleton list-skeleton" />
  </div>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { searchQuery } = useHeaderSearch();
  const [expenses, setExpenses] = useState([]);
  const [folders, setFolders] = useState([]);
  const [appSettings, setAppSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    start_date: '',
    end_date: '',
    folder_id: '',
  });

  const fetchPageData = useCallback(async () => {
    setLoading(true);
    try {
      const [expenseData, folderData, settingsData] = await Promise.all([
        expenseService.getAll({ ...filters, search: searchQuery || undefined }),
        folderService.getAll(),
        settingsService.get().catch(() => null),
      ]);
      setExpenses(expenseData);
      setFolders(folderData);
      setAppSettings(settingsData);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(fetchPageData, 200);
    return () => clearTimeout(timer);
  }, [fetchPageData]);

  const summary = useMemo(() => getTransactionSummary(expenses), [expenses]);
  const stats = [
    {
      label: 'Total Income',
      value: formatCurrency(summary.income),
      trend: '+8.2% vs last month',
      icon: TrendingUp,
      className: 'income',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(summary.expense),
      trend: '-2.6% vs last month',
      icon: TrendingDown,
      className: 'expense',
    },
    {
      label: 'Net Flow',
      value: formatSignedCurrency(summary.net),
      trend: appSettings?.opening_balance ? `Opening ${formatCompactCurrency(appSettings.opening_balance)}` : 'Tracked live',
      icon: Wallet,
      className: summary.net >= 0 ? 'net' : 'expense',
    },
    {
      label: 'Folders',
      value: `${folders.length}`,
      trend: 'active folders',
      icon: FolderOpen,
      className: 'folder',
    },
  ];

  if (loading) return <LoadingDashboard />;

  return (
    <div className="dashboard-page">
      <section className="page-hero">
        <div>
          <p className="page-eyebrow">Dashboard</p>
          <h1>Track every rupee without the clutter.</h1>
          <p className="page-hero-copy">
            Quick add, recent history, and the financial signals that matter most right now.
          </p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/reports')}>
          <CircleDollarSign size={16} />
          View reports
        </button>
      </section>

      <QuickAddRecord onSuccess={fetchPageData} />

      <section className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className={`stats-card ${stat.className}`}>
              <div className={`stats-icon ${stat.className}`}>
                <Icon size={18} />
              </div>
              <p className="stats-label">{stat.label}</p>
              <strong className={`stats-value ${stat.className}`}>{stat.value}</strong>
              <div className="stats-footer">
                <span>{stat.trend}</span>
                <span className="sparkline" aria-hidden="true" />
              </div>
            </article>
          );
        })}
      </section>

      <section className="panel-section">
        <div className="panel-header">
          <div>
            <h2>Recent Transactions</h2>
            <p>Filtered by your latest search, category, date, and folder picks.</p>
          </div>
          <button type="button" className="panel-link" onClick={() => navigate('/folders')}>
            View all <ArrowRight size={15} />
          </button>
        </div>

        <FilterBar filters={filters} setFilters={setFilters} folders={folders} />
        <ExpenseList expenses={expenses.slice(0, 20)} readOnly />
      </section>
    </div>
  );
};

export default DashboardPage;

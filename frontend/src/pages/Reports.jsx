import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { exportTransactionsToPDF } from '../utils/pdfExport';
import { formatCompactCurrency, formatCurrency, getCategoryMeta, getTransactionSummary } from '../utils/finance';

const categoryColors = [
  'var(--category-food)',
  'var(--category-transport)',
  'var(--category-rent)',
  'var(--category-shopping)',
  'var(--category-health)',
  'var(--category-entertainment)',
  'var(--category-education)',
  'var(--category-utilities)',
];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <p key={item.name} style={{ color: item.color }}>
          {item.name}: {formatCurrency(item.value)}
        </p>
      ))}
    </div>
  );
};

const Reports = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('monthly');

  useEffect(() => {
    expenseService
      .getAll()
      .then(setRecords)
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => getTransactionSummary(records), [records]);
  const savingsRate = summary.income ? (summary.net / summary.income) * 100 : 0;

  const barData = useMemo(() => {
    const bucket = records.reduce((acc, entry) => {
      const key = view === 'monthly' ? entry.date.slice(0, 7) : entry.date.slice(0, 4);
      if (!acc[key]) acc[key] = { name: key, Income: 0, Expenses: 0, Net: 0 };
      if (entry.type === 'income') acc[key].Income += Number(entry.amount);
      if (entry.type === 'expense') acc[key].Expenses += Number(entry.amount);
      acc[key].Net = acc[key].Income - acc[key].Expenses;
      return acc;
    }, {});
    return Object.values(bucket).sort((a, b) => a.name.localeCompare(b.name));
  }, [records, view]);

  const donutData = useMemo(() => {
    const totals = records
      .filter((entry) => entry.type === 'expense')
      .reduce((acc, entry) => {
        acc[entry.category] = (acc[entry.category] || 0) + Number(entry.amount);
        return acc;
      }, {});
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [records]);

  const trendData = barData.map((item) => ({ name: item.name, Savings: item.Net }));

  const topCategories = donutData.map((item) => ({
    ...item,
    percent: summary.expense ? (item.value / summary.expense) * 100 : 0,
    meta: getCategoryMeta(item.name),
  }));

  if (loading) {
    return <div className="page-loading"><div className="loading-spinner" /><p>Loading reports...</p></div>;
  }

  return (
    <div className="reports-page">
      <section className="page-hero">
        <div>
          <p className="page-eyebrow">Reports</p>
          <h1>Analytics designed for fast financial decisions.</h1>
          <p className="page-hero-copy">Understand cash flow, category concentration, and savings momentum across 2000+ records.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => exportTransactionsToPDF(records)}>
          <Download size={16} />
          Export PDF
        </button>
      </section>

      <section className="stats-grid">
        {[
          { label: 'Total Income', value: formatCurrency(summary.income), icon: TrendingUp, className: 'income' },
          { label: 'Total Expenses', value: formatCurrency(summary.expense), icon: TrendingDown, className: 'expense' },
          { label: 'Net Savings', value: formatCurrency(summary.net), icon: Wallet, className: summary.net >= 0 ? 'net' : 'expense' },
          { label: 'Savings Rate', value: `${savingsRate.toFixed(1)}%`, icon: PiggyBank, className: savingsRate >= 0 ? 'net' : 'expense' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className={`stats-card ${card.className}`}>
              <div className={`stats-icon ${card.className}`}>
                <Icon size={18} />
              </div>
              <p className="stats-label">{card.label}</p>
              <strong className={`stats-value ${card.className}`}>{card.value}</strong>
              <div className="stats-footer">
                <span>{card.label === 'Savings Rate' ? 'Mini donut available below' : 'Updated from imported data'}</span>
                <span className="sparkline" />
              </div>
            </article>
          );
        })}
      </section>

      <section className="chart-panel">
        <div className="panel-header">
          <div>
            <h2>Cash Flow</h2>
            <p>Compare income and expenses by month or year.</p>
          </div>
          <div className="segmented-control">
            <button type="button" className={view === 'monthly' ? 'active' : ''} onClick={() => setView('monthly')}>
              Monthly
            </button>
            <button type="button" className={view === 'yearly' ? 'active' : ''} onClick={() => setView('yearly')}>
              Yearly
            </button>
          </div>
        </div>

        <div className="chart-wrap large">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
              <YAxis
                stroke="var(--text-secondary)"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCompactCurrency(value)}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(108,142,247,0.08)' }} />
              <Legend />
              <Bar dataKey="Income" fill="var(--income-green)" radius={[10, 10, 0, 0]} />
              <Bar dataKey="Expenses" fill="var(--expense-red)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="reports-grid">
        <article className="chart-panel">
          <div className="panel-header">
            <div>
              <h2>Category Breakdown</h2>
              <p>Total spent: {formatCurrency(summary.expense)}</p>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} innerRadius={70} outerRadius={98} paddingAngle={4} dataKey="value">
                  {donutData.map((_, index) => (
                    <Cell key={index} fill={categoryColors[index % categoryColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend-list">
            {topCategories.slice(0, 6).map((item, index) => (
              <div key={item.name} className="chart-legend-row">
                <span className="legend-label">
                  <span className="legend-color" style={{ background: categoryColors[index % categoryColors.length] }} />
                  {item.meta.emoji} {item.meta.label}
                </span>
                <strong>{formatCurrency(item.value)}</strong>
                <span>{item.percent.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </article>

        <article className="chart-panel">
          <div className="panel-header">
            <div>
              <h2>Monthly Trend</h2>
              <p>Savings trend over time.</p>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--neutral-blue)" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="var(--neutral-blue)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="Savings" stroke="var(--neutral-blue)" fill="url(#savingsGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="chart-panel">
        <div className="panel-header">
          <div>
            <h2>Top Categories</h2>
            <p>Ranked by contribution to total spending.</p>
          </div>
        </div>
        <div className="top-category-table">
          {topCategories.map((item, index) => (
            <div key={item.name} className="top-category-row">
              <span>#{index + 1}</span>
              <span>{item.meta.emoji} {item.meta.label}</span>
              <strong>{formatCurrency(item.value)}</strong>
              <span>{item.percent.toFixed(1)}%</span>
              <div className="top-category-bar">
                <div style={{ width: `${item.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Reports;

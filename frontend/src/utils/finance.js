export const CATEGORY_META = {
  food: { label: 'Food', emoji: '🍕', colorVar: 'var(--category-food)' },
  transport: { label: 'Transport', emoji: '🚗', colorVar: 'var(--category-transport)' },
  rent: { label: 'Rent', emoji: '🏠', colorVar: 'var(--category-rent)' },
  utilities: { label: 'Utilities', emoji: '⚡', colorVar: 'var(--category-utilities)' },
  shopping: { label: 'Shopping', emoji: '🛍️', colorVar: 'var(--category-shopping)' },
  entertainment: { label: 'Entertainment', emoji: '🎬', colorVar: 'var(--category-entertainment)' },
  health: { label: 'Health', emoji: '❤️', colorVar: 'var(--category-health)' },
  education: { label: 'Education', emoji: '📚', colorVar: 'var(--category-education)' },
  salary: { label: 'Salary', emoji: '💼', colorVar: 'var(--category-income)' },
  freelance: { label: 'Freelance', emoji: '💻', colorVar: 'var(--category-income)' },
  investment: { label: 'Investment', emoji: '📈', colorVar: 'var(--neutral-blue)' },
  refund: { label: 'Refund', emoji: '↩️', colorVar: 'var(--neutral-blue)' },
  gift: { label: 'Gift', emoji: '🎁', colorVar: 'var(--accent-purple)' },
  other: { label: 'Other', emoji: '⚡', colorVar: 'var(--text-secondary)' },
};

export const EXPENSE_CATEGORIES = [
  CATEGORY_META.food,
  CATEGORY_META.transport,
  CATEGORY_META.rent,
  CATEGORY_META.utilities,
  CATEGORY_META.shopping,
  CATEGORY_META.entertainment,
  CATEGORY_META.health,
  CATEGORY_META.education,
  CATEGORY_META.other,
];

export const INCOME_CATEGORIES = [
  CATEGORY_META.salary,
  CATEGORY_META.freelance,
  CATEGORY_META.investment,
  CATEGORY_META.refund,
  CATEGORY_META.gift,
  CATEGORY_META.other,
];

export const formatCurrency = (value, options = {}) => {
  const amount = Number(value || 0);
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  });
};

export const formatCompactCurrency = (value) => {
  const amount = Number(value || 0);
  const abs = Math.abs(amount);
  if (abs >= 100000) {
    return `₹${new Intl.NumberFormat('en-IN', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(abs)}`;
  }
  return formatCurrency(abs);
};

export const formatSignedCurrency = (value) => {
  const amount = Number(value || 0);
  const prefix = amount > 0 ? '+' : amount < 0 ? '-' : '';
  return `${prefix}${formatCurrency(Math.abs(amount))}`;
};

export const getCategoryMeta = (category) => {
  const key = String(category || 'other').toLowerCase();
  return CATEGORY_META[key] || {
    label: category || 'Other',
    emoji: '⚡',
    colorVar: 'var(--text-secondary)',
  };
};

export const getTypeColorVar = (type) =>
  type === 'income' ? 'var(--income-green)' : 'var(--expense-red)';

export const getRelativeDateLabel = (dateValue) => {
  const input = new Date(dateValue);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const matches = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (matches(input, today)) return 'Today';
  if (matches(input, yesterday)) return 'Yesterday';

  return input.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: today.getFullYear() === input.getFullYear() ? undefined : 'numeric',
  });
};

export const groupTransactionsByDate = (records) => {
  const map = new Map();
  [...records]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((record) => {
      const label = getRelativeDateLabel(record.date);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(record);
    });
  return [...map.entries()];
};

export const getTransactionSummary = (records = []) => {
  const income = records
    .filter((entry) => entry.type === 'income')
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const expense = records
    .filter((entry) => entry.type === 'expense')
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  return {
    income,
    expense,
    net: income - expense,
  };
};

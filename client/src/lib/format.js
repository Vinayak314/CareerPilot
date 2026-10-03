/** Score thresholds shared by rings, badges and tags. */
export const scoreLevel = (score) => {
  if (score === null || score === undefined || Number.isNaN(score)) return 'none';
  if (score >= 80) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
};

export const scoreLabel = (score) => {
  switch (scoreLevel(score)) {
    case 'good':
      return 'Strong match';
    case 'fair':
      return 'Good progress';
    case 'poor':
      return 'Needs work';
    default:
      return 'Not scored';
  }
};

export const toScore = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  // Accept 0–1 fractions as well as 0–100 percentages.
  const pct = n > 0 && n <= 1 && !Number.isInteger(n) ? n * 100 : n;
  return Math.max(0, Math.min(100, Math.round(pct)));
};

export const formatDate = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, options);
};

export const formatRelative = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const diffDays = Math.round((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  return formatDate(value);
};

export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const compactMoney = (n, currency) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n}`;
  }
};

export const formatSalary = ({ salary, salaryMin, salaryMax, salaryCurrency } = {}) => {
  if (typeof salary === 'string' && salary.trim()) return salary.trim();
  const min = Number(salaryMin);
  const max = Number(salaryMax);
  if (min > 0 && max > 0) return `${compactMoney(min, salaryCurrency)} – ${compactMoney(max, salaryCurrency)}`;
  if (min > 0) return `From ${compactMoney(min, salaryCurrency)}`;
  if (max > 0) return `Up to ${compactMoney(max, salaryCurrency)}`;
  return null;
};

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?';

export const isHttpUrl = (value) => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

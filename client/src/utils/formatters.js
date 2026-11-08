/** "Radhika Sharma" → "RS" */
export function getInitials(name = '') {
  return name
    .replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/** ("8", "A") → "Grade 8 · A" */
export function formatClass(grade, section) {
  if (!grade) return '—';
  return section ? `Grade ${grade} · ${section}` : `Grade ${grade}`;
}

/** "2026-11-06" → "6 Nov 2026". Returns "—" for empty values. */
export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Today's date as YYYY-MM-DD in local time. */
export function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/** `days` added to a YYYY-MM-DD date (negative to go back), as YYYY-MM-DD. */
export function addDaysISO(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The date `days` before today, as YYYY-MM-DD. */
export function daysAgoISO(days) {
  return addDaysISO(todayISO(), -days);
}

/** ISO timestamp → "6 Nov 2026, 4:30 pm" */
export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/**
 * Colour token for an attendance percentage, using the Udaan risk thresholds:
 * below 75% is a high concern, 75–85% is a medium concern.
 */
export function attendanceTone(rate) {
  if (rate === null || rate === undefined) return 'var(--color-text-muted)';
  if (rate < 75) return 'var(--color-risk-high)';
  if (rate < 85) return 'var(--color-risk-medium)';
  return 'var(--color-risk-low)';
}

/** 87.456 → "87.5%"; null → "—" */
export function formatPercent(value) {
  if (value === null || value === undefined) return '—';
  return `${Math.round(value * 10) / 10}%`;
}

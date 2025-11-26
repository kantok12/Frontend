// Utility functions for date calculations

export function truncateFilename(name: string | null | undefined, maxLen = 40): string {
  if (!name) return '';
  const s = String(name);
  if (s.length <= maxLen) return s;

  // Try to keep the extension if present
  const lastDot = s.lastIndexOf('.');
  if (lastDot > 0 && lastDot > s.length - 10) {
    // extension is short (e.g. .pdf, .jpg) and close to the end
    const ext = s.slice(lastDot);
    const keep = maxLen - ext.length - 3; // leave room for '...'
    if (keep <= 0) return '...' + ext;
    return s.slice(0, keep) + '...' + ext;
  }

  // Default: truncate end and add ellipsis
  return s.slice(0, maxLen - 3) + '...';
}

export default truncateFilename;

/**
 * Returns the number of days from today until the given date string.
 * Positive => days until expiration. 0 => today. Negative => days since expiration.
 */
export function daysUntilNumber(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  const today = new Date();
  // normalize to local date (midnight) to avoid timezone drift
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  const diffMs = d.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function daysUntilText(dateStr: string | null | undefined): string | null {
  const n = daysUntilNumber(dateStr);
  if (n === null) return null;
  if (n > 1) return `Vence en ${n} días`;
  if (n === 1) return `Vence en 1 día`;
  if (n === 0) return `Vence hoy`;
  const ago = Math.abs(n);
  if (ago === 1) return `Vencido hace 1 día`;
  return `Vencido hace ${ago} días`;
}

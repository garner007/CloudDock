/**
 * Format a date for display. Returns '—' for falsy values.
 * Accepts Date objects, date strings, or timestamps.
 */
export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}

/**
 * Format bytes to human-readable size (B, KB, MB, GB).
 * Returns '—' for falsy values (including 0).
 */
export function fmtSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}

/**
 * Extract the resource name from an ARN string.
 * For ARNs like arn:aws:s3:::my-bucket, returns 'my-bucket'.
 * For ARNs with path like arn:aws:iam::123:role/name, returns 'role/name'.
 * Returns '—' for falsy values.
 */
export function fmtArn(arn) {
  if (!arn) return '—';
  // ARN format: arn:partition:service:region:account:resource
  // Split on first 5 colons, everything after is the resource
  const parts = arn.split(':');
  if (parts.length < 6) return arn;
  return parts.slice(5).join(':') || '—';
}

/**
 * Truncate a string to maxLen characters, appending '…' if truncated.
 * Returns empty string for null/undefined.
 */
export function truncate(str, maxLen = 40) {
  if (str == null) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}

/**
 * Format a number with locale-appropriate grouping (commas in en-US).
 * Returns '—' for null/undefined. Returns '0' for zero.
 */
export function fmtNumber(n) {
  if (n == null) return '—';
  return n.toLocaleString();
}

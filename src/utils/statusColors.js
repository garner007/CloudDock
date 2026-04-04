/**
 * Canonical mapping of AWS resource statuses to badge CSS classes.
 * Consolidates status→color logic scattered across 20+ page components.
 *
 * Keys are UPPER_CASE. Lookup is case-insensitive via getStatusColor().
 */
export const STATUS_COLORS = {
  // ── Green (success / active / healthy) ──
  ACTIVE: 'badge-green',
  RUNNING: 'badge-green',
  ENABLED: 'badge-green',
  AVAILABLE: 'badge-green',
  CREATE_COMPLETE: 'badge-green',
  UPDATE_COMPLETE: 'badge-green',
  IMPORT_COMPLETE: 'badge-green',
  SUCCEEDED: 'badge-green',
  ISSUED: 'badge-green',
  CONFIRMED: 'badge-green',
  SUCCESS: 'badge-green',

  // ── Red (failure / error / terminated) ──
  FAILED: 'badge-red',
  CREATE_FAILED: 'badge-red',
  UPDATE_FAILED: 'badge-red',
  DELETE_FAILED: 'badge-red',
  ROLLBACK_COMPLETE: 'badge-red',
  ROLLBACK_FAILED: 'badge-red',
  ERROR: 'badge-red',
  TERMINATED: 'badge-red',
  STOPPED: 'badge-red',
  EXPIRED: 'badge-red',
  REVOKED: 'badge-red',
  TIMED_OUT: 'badge-red',
  ARCHIVED: 'badge-red',
  COMPROMISED: 'badge-red',

  // ── Yellow (in-progress / pending / transitional) ──
  PENDING: 'badge-yellow',
  PENDING_VALIDATION: 'badge-yellow',
  CREATING: 'badge-yellow',
  UPDATING: 'badge-yellow',
  DELETING: 'badge-yellow',
  MODIFYING: 'badge-yellow',
  CREATE_IN_PROGRESS: 'badge-yellow',
  UPDATE_IN_PROGRESS: 'badge-yellow',
  DELETE_IN_PROGRESS: 'badge-yellow',
  ROLLBACK_IN_PROGRESS: 'badge-yellow',
  IN_PROGRESS: 'badge-yellow',
  FORCE_CHANGE_PASSWORD: 'badge-yellow',
  RESET_REQUIRED: 'badge-yellow',
  STOPPING: 'badge-yellow',
  SHUTTING_DOWN: 'badge-yellow',
  PENDING_IMPORT: 'badge-yellow',
  DRAINING: 'badge-yellow',

  // ── Gray (inactive / deleted / unknown) ──
  INACTIVE: 'badge-gray',
  DISABLED: 'badge-gray',
  DELETED: 'badge-gray',
  ABORTED: 'badge-gray',
};

/**
 * Get the badge CSS class for a status string.
 * Case-insensitive. Returns 'badge-gray' for unknown statuses.
 *
 * Also handles hyphenated statuses like 'shutting-down' by converting
 * hyphens to underscores before lookup.
 */
export function getStatusColor(status) {
  if (!status) return 'badge-gray';
  const normalized = status.toUpperCase().replace(/-/g, '_');
  return STATUS_COLORS[normalized] || 'badge-gray';
}

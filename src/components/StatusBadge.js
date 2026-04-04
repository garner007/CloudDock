import React from 'react';
import { getStatusColor } from '../utils/statusColors';

/**
 * StatusBadge — renders a coloured status pill.
 *
 * Props:
 *   status   {string}  The status text to display
 *   colorMap {object}  Optional custom mapping of status -> color name (green, red, yellow, gray, blue)
 */
export default function StatusBadge({ status, colorMap }) {
  const cls = colorMap
    ? `badge-${colorMap[status] || 'gray'}`
    : getStatusColor(status);

  return (
    <span className={`badge ${cls}`} role="status">
      ● {status}
    </span>
  );
}

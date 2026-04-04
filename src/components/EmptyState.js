import React, { createElement } from 'react';

/**
 * EmptyState — placeholder shown when a list/table has no data.
 *
 * Props:
 *   icon        {Component}  Lucide icon component (rendered at size 48)
 *   title       {string}     Heading text
 *   description {string}     Optional explanatory text
 *   action      {ReactNode}  Optional action element (button, link, etc.)
 */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      {icon && createElement(icon, { size: 48 })}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && action}
    </div>
  );
}

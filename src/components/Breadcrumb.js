import React from 'react';
import { ChevronRight, LayoutDashboard } from 'lucide-react';
import { getServiceById } from '../services/catalog';
import './Breadcrumb.css';

/**
 * Breadcrumb — shows layered navigation path.
 *
 * Static portion (always derived from catalog):
 *   Dashboard  ›  Security  ›  Cognito
 *
 * Dynamic portion (from pageTrail prop — set by pages as user drills down):
 *   Dashboard  ›  Security  ›  Cognito  ›  my-pool  ›  user@example.com
 *
 * Each trail item: { label, onNavigate? }
 *   - If onNavigate is provided, it renders as a clickable link
 *   - The last item is always the current location (non-clickable)
 */
export default function Breadcrumb({ currentService, onNavigate, pageTrail = [] }) {
  if (!currentService || currentService === 'dashboard' || currentService === 'settings') {
    return null;
  }

  const svc   = getServiceById(currentService);
  const group = svc?.group;

  // Combine: [Dashboard] [Group] [Service] [...trail items]
  // Last item is always "current" (non-clickable)
  // Everything before it is a link
  const hasTrail = pageTrail.length > 0;

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {/* Dashboard */}
      <button className="bc-item bc-link" onClick={() => onNavigate('dashboard')} title="Back to Dashboard">
        <LayoutDashboard size={11} />
        Dashboard
      </button>

      {/* Group */}
      {group && (
        <>
          <ChevronRight size={11} className="bc-sep" />
          <span className="bc-item bc-group">{group}</span>
        </>
      )}

      {/* Service — clickable if there's a trail, otherwise current */}
      <ChevronRight size={11} className="bc-sep" />
      {hasTrail ? (
        <button
          className="bc-item bc-link"
          onClick={() => {
            // Navigate back to the service root — clear the trail
            pageTrail[0]?.onNavigateToService?.();
          }}
        >
          {svc && <span className="bc-emoji">{svc.emoji}</span>}
          {svc?.label || currentService}
        </button>
      ) : (
        <span className="bc-item bc-current" aria-current="page">
          {svc && <span className="bc-emoji">{svc.emoji}</span>}
          {svc?.label || currentService}
        </span>
      )}

      {/* Trail items */}
      {pageTrail.map((crumb, i) => {
        const isLast = i === pageTrail.length - 1;
        return (
          <React.Fragment key={i}>
            <ChevronRight size={11} className="bc-sep" />
            {!isLast && crumb.onClick ? (
              <button className="bc-item bc-link" onClick={crumb.onClick} title={`Back to ${crumb.label}`}>
                {crumb.label}
              </button>
            ) : (
              <span
                className="bc-item bc-current"
                aria-current={isLast ? 'page' : undefined}
                title={crumb.label}
              >
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

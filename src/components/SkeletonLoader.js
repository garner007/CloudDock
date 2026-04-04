import React from 'react';

/**
 * Skeleton pulse animation replaces spinners during data loading.
 * Perceived performance is significantly higher (Google UX research).
 */
function Skeleton({ width = '100%', height = 14, radius = 4, style = {} }) {
  return (
    <span style={{
      display: 'block',
      width, height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, var(--aws-surface-3) 25%, var(--aws-border) 50%, var(--aws-surface-3) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-pulse 1.4s ease infinite',
      ...style,
    }} />
  );
}

/**
 * SkeletonTable - mimics a data table while loading.
 * rows: number of placeholder rows
 * cols: column width hints e.g. ['40%', '20%', '20%', '20%']
 */
export function SkeletonTable({ rows = 5, cols = ['35%', '20%', '20%', '15%', '10%'] }) {
  return (
    <div>
      <style>{`
        @keyframes skeleton-pulse {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <table className="data-table" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {cols.map((w, i) => (
              <th key={i} style={{ width: w }}>
                <Skeleton width="60%" height={10} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {cols.map((w, c) => (
                <td key={c} style={{ padding: 'var(--table-row-py, 10px) var(--table-cell-px, 16px)' }}>
                  <Skeleton
                    width={c === 0 ? '70%' : c === cols.length - 1 ? '50%' : '55%'}
                    height={12}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * SkeletonCards - grid of card placeholders (e.g. dashboard service cards)
 */
export function SkeletonCards({ count = 6 }) {
  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{
            background: 'var(--aws-surface-3)', border: '1px solid var(--aws-border)',
            borderRadius: 8, padding: 14,
          }}>
            <Skeleton width={28} height={28} radius={6} style={{ marginBottom: 10 }} />
            <Skeleton width="70%" height={12} style={{ marginBottom: 6 }} />
            <Skeleton width="50%" height={10} />
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * SkeletonDetail - for single-resource detail views
 */
export function SkeletonDetail({ rows = 4 }) {
  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i}>
            <Skeleton width="25%" height={10} style={{ marginBottom: 8 }} />
            <Skeleton width={`${50 + (i % 3) * 15}%`} height={14} />
          </div>
        ))}
      </div>
    </>
  );
}

export default Skeleton;

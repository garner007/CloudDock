import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import EmptyState from './EmptyState';
import './DataTable.css';

/**
 * DataTable — reusable sortable, searchable data table.
 *
 * Props:
 *   columns           {Array}      [{ key, label, mono, render }]
 *   data              {Array}      Row objects
 *   loading           {bool}       Show skeleton loading rows
 *   rowKey            {string}     Key field for React keys
 *   onRowClick        {fn}         Called with row object on click
 *   actions           {fn}         (row) => ReactNode for actions column
 *   searchable        {bool}       Show search input
 *   searchPlaceholder {string}     Placeholder for search input
 *   searchKeys        {Array}      Fields to search against
 *   emptyIcon         {Component}  Icon for empty state
 *   emptyTitle        {string}     Title for empty state
 *   emptyDescription  {string}     Description for empty state
 *   sortable          {bool}       Enable column sorting
 */
export default function DataTable({
  columns,
  data,
  loading,
  rowKey,
  onRowClick,
  actions,
  searchable,
  searchPlaceholder = 'Search...',
  searchKeys = [],
  emptyIcon,
  emptyTitle = 'No items found',
  emptyDescription,
  sortable,
}) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  // Filter by search
  const filtered = useMemo(() => {
    if (!search || !searchKeys.length) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      searchKeys.some(key => {
        const val = row[key];
        return val && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, searchKeys]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortCol] ?? '';
      const bVal = b[sortCol] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const handleSort = (key) => {
    if (!sortable) return;
    if (sortCol === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(key);
      setSortDir('asc');
    }
  };

  const ariaSort = (key) => {
    if (sortCol !== key) return undefined;
    return sortDir === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <>
      {searchable && (
        <div className="data-table-search">
          <div className="search-bar">
            <Search size={14} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>
        </div>
      )}

      <div className="card">
        <table className="data-table" aria-busy={loading}>
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={sortable ? 'sortable' : undefined}
                  onClick={() => handleSort(col.key)}
                  aria-sort={ariaSort(col.key)}
                >
                  {col.label}
                  {sortable && sortCol === col.key && (
                    <span className="sort-indicator">
                      {sortDir === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
              ))}
              {actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skel-${i}`} className="skeleton-row">
                  {columns.map(col => (
                    <td key={col.key}>
                      <div className="skeleton-bar" style={{ width: `${60 + Math.random() * 30}%` }} />
                    </td>
                  ))}
                  {actions && (
                    <td><div className="skeleton-bar" style={{ width: '40%' }} /></td>
                  )}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)}>
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              sorted.map(row => (
                <tr
                  key={row[rowKey]}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={onRowClick ? { cursor: 'pointer' } : undefined}
                >
                  {columns.map(col => (
                    <td key={col.key} className={col.mono ? 'mono' : undefined}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {actions && <td onClick={e => e.stopPropagation()}>{actions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

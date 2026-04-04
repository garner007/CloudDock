import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DataTable from '../../components/DataTable';
import { Archive } from 'lucide-react';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
];

const data = [
  { id: '1', name: 'Alpha', status: 'ACTIVE' },
  { id: '2', name: 'Beta', status: 'INACTIVE' },
  { id: '3', name: 'Charlie', status: 'ACTIVE' },
];

describe('DataTable', () => {
  test('renders column headers and rows', () => {
    render(<DataTable columns={columns} data={data} rowKey="id" />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  test('shows empty state when data is empty', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        rowKey="id"
        emptyIcon={Archive}
        emptyTitle="No items"
        emptyDescription="Nothing here"
      />
    );
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  test('shows loading skeleton rows', () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} rowKey="id" loading />
    );
    const skeletonRows = container.querySelectorAll('.skeleton-row');
    expect(skeletonRows.length).toBe(5);
  });

  test('filters data when searching', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        rowKey="id"
        searchable
        searchKeys={['name']}
        searchPlaceholder="Search..."
      />
    );
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'alpha' } });
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
  });

  test('calls onRowClick when a row is clicked', () => {
    const onClick = jest.fn();
    render(
      <DataTable columns={columns} data={data} rowKey="id" onRowClick={onClick} />
    );
    fireEvent.click(screen.getByText('Alpha'));
    expect(onClick).toHaveBeenCalledWith(data[0]);
  });

  test('renders actions column', () => {
    const actions = (row) => <button>Delete {row.name}</button>;
    render(
      <DataTable columns={columns} data={data} rowKey="id" actions={actions} />
    );
    expect(screen.getByText('Delete Alpha')).toBeInTheDocument();
  });

  test('sorts data when clicking sortable header', () => {
    const { container } = render(
      <DataTable columns={columns} data={data} rowKey="id" sortable />
    );
    // Click Name header to sort descending (default is no sort, first click asc)
    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);
    // First click = ascending, so order: Alpha, Beta, Charlie
    const cells = container.querySelectorAll('tbody td:first-child');
    expect(cells[0].textContent).toBe('Alpha');
    expect(cells[2].textContent).toBe('Charlie');

    // Click again for descending
    fireEvent.click(nameHeader);
    const cells2 = container.querySelectorAll('tbody td:first-child');
    expect(cells2[0].textContent).toBe('Charlie');
    expect(cells2[2].textContent).toBe('Alpha');
  });
});

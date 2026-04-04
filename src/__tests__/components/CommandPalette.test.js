import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CommandPalette from '../../components/CommandPalette';

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('CommandPalette', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onNavigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('does not render when open=false', () => {
    const { container } = render(
      <CommandPalette open={false} onClose={jest.fn()} onNavigate={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders search input when open=true', () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search services, jump to…')).toBeInTheDocument();
  });

  test('renders dialog with accessible role', () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.getByRole('dialog', { name: /command palette/i })).toBeInTheDocument();
  });

  test('filters services as user types', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search services, jump to…');
    fireEvent.change(input, { target: { value: 'S3' } });
    // S3 should appear in results
    expect(screen.getByText('S3')).toBeInTheDocument();
  });

  test('shows "No services match" when query has no results', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search services, jump to…');
    fireEvent.change(input, { target: { value: 'zzz_nonexistent_zzz' } });
    expect(screen.getByText(/No services match/)).toBeInTheDocument();
  });

  test('selecting a service calls onNavigate and closes palette', () => {
    const onNavigate = jest.fn();
    const onClose = jest.fn();
    render(
      <CommandPalette open={true} onClose={onClose} onNavigate={onNavigate} />
    );
    const input = screen.getByPlaceholderText('Search services, jump to…');
    fireEvent.change(input, { target: { value: 'Dashboard' } });
    // Click the Dashboard result
    fireEvent.click(screen.getByText('Dashboard'));
    expect(onNavigate).toHaveBeenCalledWith('dashboard');
    expect(onClose).toHaveBeenCalled();
  });
});

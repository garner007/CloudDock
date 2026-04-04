import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../../components/StatusBadge';

describe('StatusBadge', () => {
  test('renders the status text', () => {
    render(<StatusBadge status="ACTIVE" />);
    expect(screen.getByRole('status')).toHaveTextContent('ACTIVE');
  });

  test('applies correct badge class for known status', () => {
    render(<StatusBadge status="ACTIVE" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('badge', 'badge-green');
  });

  test('falls back to badge-gray for unknown status', () => {
    render(<StatusBadge status="MYSTERY" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('badge', 'badge-gray');
  });

  test('uses custom colorMap when provided', () => {
    const colorMap = { enabled: 'green', disabled: 'red' };
    render(<StatusBadge status="enabled" colorMap={colorMap} />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('badge', 'badge-green');
  });

  test('colorMap falls back to badge-gray for unmapped status', () => {
    const colorMap = { enabled: 'green' };
    render(<StatusBadge status="unknown" colorMap={colorMap} />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('badge', 'badge-gray');
  });

  test('has role="status"', () => {
    render(<StatusBadge status="RUNNING" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('renders bullet character before status text', () => {
    render(<StatusBadge status="FAILED" />);
    expect(screen.getByRole('status').textContent).toContain('●');
  });
});

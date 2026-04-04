import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Breadcrumb from '../../components/Breadcrumb';

describe('Breadcrumb', () => {
  test('returns null for dashboard service', () => {
    const { container } = render(
      <Breadcrumb currentService="dashboard" onNavigate={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('returns null for settings service', () => {
    const { container } = render(
      <Breadcrumb currentService="settings" onNavigate={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders Dashboard as root breadcrumb', () => {
    render(<Breadcrumb currentService="s3" onNavigate={jest.fn()} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('shows current service name', () => {
    render(<Breadcrumb currentService="s3" onNavigate={jest.fn()} />);
    expect(screen.getByText('S3')).toBeInTheDocument();
  });

  test('clicking Dashboard calls onNavigate with "dashboard"', () => {
    const onNavigate = jest.fn();
    render(<Breadcrumb currentService="s3" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('Dashboard'));
    expect(onNavigate).toHaveBeenCalledWith('dashboard');
  });

  test('shows group label from catalog', () => {
    render(<Breadcrumb currentService="s3" onNavigate={jest.fn()} />);
    expect(screen.getByText('Storage')).toBeInTheDocument();
  });

  test('shows page trail items when provided', () => {
    const trail = [
      { label: 'my-bucket', onClick: jest.fn() },
      { label: 'photos/cat.png' },
    ];
    render(
      <Breadcrumb currentService="s3" onNavigate={jest.fn()} pageTrail={trail} />
    );
    expect(screen.getByText('my-bucket')).toBeInTheDocument();
    expect(screen.getByText('photos/cat.png')).toBeInTheDocument();
  });

  test('trail intermediate items are clickable, last is not', () => {
    const onClick = jest.fn();
    const trail = [
      { label: 'my-bucket', onClick },
      { label: 'photos/cat.png' },
    ];
    render(
      <Breadcrumb currentService="s3" onNavigate={jest.fn()} pageTrail={trail} />
    );
    // Intermediate item is a button
    const bucketEl = screen.getByText('my-bucket');
    fireEvent.click(bucketEl);
    expect(onClick).toHaveBeenCalled();

    // Last item has aria-current="page"
    const lastEl = screen.getByText('photos/cat.png');
    expect(lastEl).toHaveAttribute('aria-current', 'page');
  });
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ACMPage from '../../pages/ACMPage';

// AWS SDK is auto-mocked via moduleNameMapper in package.json

describe('ACMPage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<ACMPage showNotification={mockNotify} />);
    expect(screen.getByText(/ACM/)).toBeInTheDocument();
  });

  it('renders the certificate request button', () => {
    render(<ACMPage showNotification={mockNotify} />);
    expect(screen.getByText('Request certificate')).toBeInTheDocument();
  });

  it('loads certificate data', async () => {
    render(<ACMPage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText('example.com')).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import STSPage from '../../pages/STSPage';

// AWS SDK is auto-mocked via moduleNameMapper in package.json

describe('STSPage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<STSPage showNotification={mockNotify} />);
    expect(screen.getByText(/STS/)).toBeInTheDocument();
  });

  it('shows caller identity section', () => {
    render(<STSPage showNotification={mockNotify} />);
    expect(screen.getByText('GetCallerIdentity')).toBeInTheDocument();
  });

  it('shows caller identity data after loading', async () => {
    render(<STSPage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText('000000000000')).toBeInTheDocument();
    });
  });
});

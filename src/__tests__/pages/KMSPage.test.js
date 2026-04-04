import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import KMSPage from '../../pages/KMSPage';

// AWS SDK is auto-mocked via moduleNameMapper in package.json

describe('KMSPage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<KMSPage showNotification={mockNotify} />);
    expect(screen.getByText(/KMS/)).toBeInTheDocument();
  });

  it('renders the create key button', () => {
    render(<KMSPage showNotification={mockNotify} />);
    expect(screen.getByText('Create key')).toBeInTheDocument();
  });

  it('renders key list after data loads', async () => {
    render(<KMSPage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText(/1 key/)).toBeInTheDocument();
    });
  });
});

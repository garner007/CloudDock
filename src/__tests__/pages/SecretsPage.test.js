import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SecretsPage from '../../pages/SecretsPage';

// AWS SDK is auto-mocked via moduleNameMapper in package.json

describe('SecretsPage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<SecretsPage showNotification={mockNotify} />);
    expect(screen.getByText(/Secrets Manager/)).toBeInTheDocument();
  });

  it('renders secrets data in the table', async () => {
    render(<SecretsPage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText('my-secret')).toBeInTheDocument();
    });
    expect(screen.getByText(/1 secret/)).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SSMPage from '../../pages/SSMPage';

// AWS SDK is auto-mocked via moduleNameMapper in package.json

describe('SSMPage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<SSMPage showNotification={mockNotify} />);
    expect(screen.getByText(/Parameter Store/)).toBeInTheDocument();
  });

  it('renders parameter data in the table', async () => {
    render(<SSMPage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText('/myapp/db/password')).toBeInTheDocument();
    });
    expect(screen.getByText(/1 parameter/)).toBeInTheDocument();
  });
});

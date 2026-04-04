import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SESPage from '../../pages/SESPage';

// AWS SDK is auto-mocked via moduleNameMapper in package.json

describe('SESPage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<SESPage showNotification={mockNotify} />);
    expect(screen.getByText(/Simple Email Service/)).toBeInTheDocument();
  });

  it('shows empty state when no identities exist', async () => {
    render(<SESPage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText(/No verified identities/)).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import FirehosePage from '../../pages/FirehosePage';

// AWS SDK is auto-mocked via moduleNameMapper in package.json

describe('FirehosePage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<FirehosePage showNotification={mockNotify} />);
    expect(screen.getByText(/Firehose/)).toBeInTheDocument();
  });

  it('shows empty state when no streams exist', async () => {
    render(<FirehosePage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText(/No delivery streams/)).toBeInTheDocument();
    });
  });
});

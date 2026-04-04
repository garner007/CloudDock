import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import KinesisPage from '../../pages/KinesisPage';

// AWS SDK is auto-mocked via moduleNameMapper in package.json

describe('KinesisPage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<KinesisPage showNotification={mockNotify} />);
    expect(screen.getByText(/Kinesis/)).toBeInTheDocument();
  });

  it('shows empty state when no streams exist', async () => {
    render(<KinesisPage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText(/No streams/)).toBeInTheDocument();
    });
  });
});

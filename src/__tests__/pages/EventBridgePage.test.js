import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import EventBridgePage from '../../pages/EventBridgePage';

// AWS SDK is auto-mocked via moduleNameMapper in package.json

describe('EventBridgePage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<EventBridgePage showNotification={mockNotify} />);
    expect(screen.getByText(/EventBridge/)).toBeInTheDocument();
  });

  it('shows event buses section after data loads', async () => {
    render(<EventBridgePage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText('Event Buses')).toBeInTheDocument();
    });
  });
});

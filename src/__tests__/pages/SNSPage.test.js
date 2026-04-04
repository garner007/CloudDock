import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SNSPage from '../../pages/SNSPage';

// AWS SDK is auto-mocked via moduleNameMapper in package.json

describe('SNSPage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<SNSPage showNotification={mockNotify} />);
    expect(screen.getByText(/SNS/)).toBeInTheDocument();
  });

  it('renders topic list after data loads', async () => {
    render(<SNSPage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText('my-topic')).toBeInTheDocument();
    });
  });
});

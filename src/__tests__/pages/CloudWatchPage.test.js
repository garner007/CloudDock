import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CloudWatchPage from '../../pages/CloudWatchPage';

jest.mock('@aws-sdk/client-cloudwatch-logs', () => ({
  CloudWatchLogsClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ logGroups: [] }),
    destroy: jest.fn(),
  })),
  DescribeLogGroupsCommand: jest.fn(),
}));

describe('CloudWatchPage', () => {
  test('renders page title', async () => {
    render(<CloudWatchPage showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('CloudWatch Logs')).toBeInTheDocument();
    });
  });
});

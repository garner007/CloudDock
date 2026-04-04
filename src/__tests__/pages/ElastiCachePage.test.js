import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ElastiCachePage from '../../pages/ElastiCachePage';

jest.mock('@aws-sdk/client-elasticache', () => ({
  ElastiCacheClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      CacheClusters: [],
      ReplicationGroups: [],
    }),
    destroy: jest.fn(),
  })),
  DescribeCacheClustersCommand: jest.fn(),
  DescribeReplicationGroupsCommand: jest.fn(),
}));

describe('ElastiCachePage', () => {
  test('renders page title', async () => {
    render(<ElastiCachePage showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('ElastiCache')).toBeInTheDocument();
    });
  });
});

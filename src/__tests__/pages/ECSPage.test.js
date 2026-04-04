import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ECSPage from '../../pages/ECSPage';

jest.mock('@aws-sdk/client-ecs', () => ({
  ECSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ clusterArns: [], clusters: [] }),
    destroy: jest.fn(),
  })),
  ListClustersCommand: jest.fn(),
  DescribeClustersCommand: jest.fn(),
}));

describe('ECSPage', () => {
  test('renders page title', async () => {
    render(<ECSPage showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('ECS Clusters')).toBeInTheDocument();
    });
  });
});

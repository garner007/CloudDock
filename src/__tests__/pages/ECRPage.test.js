import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ECRPage from '../../pages/ECRPage';

jest.mock('@aws-sdk/client-ecr', () => ({
  ECRClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ repositories: [] }),
    destroy: jest.fn(),
  })),
  DescribeRepositoriesCommand: jest.fn(),
}));

describe('ECRPage', () => {
  test('renders page title', async () => {
    render(<ECRPage showNotification={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/ECR/)).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SSMPage from '../../pages/SSMPage';

jest.mock('@aws-sdk/client-ssm', () => ({
  SSMClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      Parameters: [
        {
          Name: '/myapp/db/password',
          Type: 'SecureString',
          Description: 'Database password',
          Version: 1,
          LastModifiedDate: '2024-01-01T00:00:00Z',
        },
      ],
    }),
    destroy: jest.fn(),
  })),
  DescribeParametersCommand: jest.fn(),
  PutParameterCommand: jest.fn(),
  DeleteParameterCommand: jest.fn(),
  GetParameterCommand: jest.fn(),
}));

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

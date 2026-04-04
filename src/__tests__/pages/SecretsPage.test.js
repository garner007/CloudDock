import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SecretsPage from '../../pages/SecretsPage';

jest.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      SecretList: [
        {
          Name: 'my-secret',
          ARN: 'arn:aws:secretsmanager:us-east-1:000000000000:secret:my-secret-abc123',
          Description: 'Test secret',
          LastChangedDate: '2024-01-01T00:00:00Z',
          LastAccessedDate: '2024-01-02T00:00:00Z',
        },
      ],
    }),
    destroy: jest.fn(),
  })),
  ListSecretsCommand: jest.fn(),
  CreateSecretCommand: jest.fn(),
  DeleteSecretCommand: jest.fn(),
  GetSecretValueCommand: jest.fn(),
}));

describe('SecretsPage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<SecretsPage showNotification={mockNotify} />);
    expect(screen.getByText(/Secrets Manager/)).toBeInTheDocument();
  });

  it('renders secrets data in the table', async () => {
    render(<SecretsPage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText('my-secret')).toBeInTheDocument();
    });
    expect(screen.getByText(/1 secret/)).toBeInTheDocument();
  });
});

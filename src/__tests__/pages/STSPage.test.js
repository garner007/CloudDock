import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import STSPage from '../../pages/STSPage';

// STSPage uses static imports, so we mock the module
jest.mock('@aws-sdk/client-sts', () => ({
  STSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      Account: '000000000000',
      Arn: 'arn:aws:iam::000000000000:root',
      UserId: 'AKIAIOSFODNN7EXAMPLE',
      Credentials: {
        AccessKeyId: 'ASIAIOSFODNN7EXAMPLE',
        SecretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        SessionToken: 'FwoGZXIvYXdzEBAaDEXAMPLE',
        Expiration: '2024-01-01T01:00:00Z',
      },
    }),
    destroy: jest.fn(),
  })),
  GetCallerIdentityCommand: jest.fn(),
  GetSessionTokenCommand: jest.fn(),
}));

describe('STSPage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<STSPage showNotification={mockNotify} />);
    expect(screen.getByText(/STS/)).toBeInTheDocument();
  });

  it('shows caller identity section', async () => {
    render(<STSPage showNotification={mockNotify} />);
    expect(screen.getByText('GetCallerIdentity')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('000000000000')).toBeInTheDocument();
    });
  });
});

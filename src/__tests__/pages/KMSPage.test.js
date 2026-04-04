import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import KMSPage from '../../pages/KMSPage';

jest.mock('@aws-sdk/client-kms', () => ({
  KMSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      Keys: [
        { KeyId: 'abcd1234-5678-90ab-cdef-1234567890ab', KeyArn: 'arn:aws:kms:us-east-1:000000000000:key/abcd1234' },
      ],
      KeyMetadata: {
        KeyId: 'abcd1234-5678-90ab-cdef-1234567890ab',
        KeyState: 'Enabled',
        KeyUsage: 'ENCRYPT_DECRYPT',
        KeySpec: 'SYMMETRIC_DEFAULT',
        Description: 'Test key',
        CreationDate: '2024-01-01T00:00:00Z',
      },
    }),
    destroy: jest.fn(),
  })),
  ListKeysCommand: jest.fn(),
  DescribeKeyCommand: jest.fn(),
  CreateKeyCommand: jest.fn(),
  ScheduleKeyDeletionCommand: jest.fn(),
}));

describe('KMSPage', () => {
  const mockNotify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title', () => {
    render(<KMSPage showNotification={mockNotify} />);
    expect(screen.getByText(/KMS/)).toBeInTheDocument();
  });

  it('renders key list after data loads', async () => {
    render(<KMSPage showNotification={mockNotify} />);
    await waitFor(() => {
      expect(screen.getByText(/1 key/)).toBeInTheDocument();
    });
  });
});
